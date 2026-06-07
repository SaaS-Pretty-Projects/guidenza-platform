import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { submitQuizAttempt, getQuizAttempts, type Quiz, type QuizAttempt, computeQuizScore } from '../lib/quizzes';
import { QuizAttemptHistory } from './QuizAttemptHistory';

interface QuizViewerProps {
  courseId: string;
  moduleId: string;
  quiz: Quiz;
  onQuizPassed?: () => void;
  onClose?: () => void;
}

export function QuizViewer({ courseId, moduleId, quiz, onQuizPassed, onClose }: QuizViewerProps) {
  const { user } = useAuth();
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ attempt: QuizAttempt; canRetry: boolean } | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (result) return;
    setSelections((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: selections[q.id] ?? -1,
      }));
      const res = await submitQuizAttempt(user.uid, courseId, moduleId, quiz.id!, answers);
      setResult(res);
      if (res.attempt.passed) {
        onQuizPassed?.();
      }
      const prev = await getQuizAttempts(user.uid, quiz.id!);
      setAttempts(prev);
    } catch (err) {
      console.error('Quiz submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = quiz.questions.every((q) => selections[q.id] !== undefined);
  const isPassed = attempts.some((a) => a.passed) || result?.attempt.passed;

  if (isPassed) {
    return (
      <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/10 text-center">
        <p className="text-green-400 font-semibold text-lg mb-1">Quiz Passed!</p>
        {attempts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Score: {attempts.filter(a => a.passed)[attempts.filter(a => a.passed).length - 1]?.score ?? 100}%
            {attempts.length > 1 && ` (${attempts.length} attempts)`}
          </p>
        )}
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-full">
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{quiz.title}</h4>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showHistory ? 'Hide history' : `View history (${attempts.length})`}
        </button>
      </div>

      {showHistory && attempts.length > 0 && (
        <QuizAttemptHistory attempts={attempts} />
      )}

      {quiz.questions.map((q, qi) => (
        <div key={q.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-sm font-medium mb-3">{qi + 1}. {q.questionText}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = selections[q.id] === oi;
              const isCorrect = result && q.correctAnswer === oi;
              const isWrong = result && selected && q.correctAnswer !== oi;
              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(q.id, oi)}
                  disabled={!!result}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                    isCorrect
                      ? 'border-green-500/50 bg-green-500/10 text-green-300'
                      : isWrong
                      ? 'border-red-500/50 bg-red-500/10 text-red-300'
                      : selected
                      ? 'border-white/30 bg-white/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        {result && (
          <div className={`text-sm font-medium ${result.attempt.passed ? 'text-green-400' : 'text-yellow-400'}`}>
            Score: {result.attempt.score}% {result.attempt.passed ? '— Passed!' : '— Try again'}
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-white/10 rounded-full hover:border-white/20 transition-colors">
              Close
            </button>
          )}
          {(!result || result.canRetry) && (
            <button
              onClick={() => {
                if (result) {
                  setResult(null);
                  setSelections({});
                } else {
                  handleSubmit();
                }
              }}
              disabled={result ? false : (!allAnswered || submitting)}
              className="px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : result ? 'Retry' : 'Submit'}
            </button>
          )}
          {result && !result.canRetry && !result.attempt.passed && (
            <p className="text-xs text-muted-foreground self-center">No attempts remaining</p>
          )}
        </div>
      </div>
    </div>
  );
}
