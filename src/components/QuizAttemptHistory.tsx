import { computeQuizScore, type QuizAttempt } from '../lib/quizzes';

interface QuizAttemptHistoryProps {
  attempts: QuizAttempt[];
}

export function QuizAttemptHistory({ attempts }: QuizAttemptHistoryProps) {
  if (attempts.length === 0) {
    return <p className="text-xs text-muted-foreground">No attempts yet.</p>;
  }

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attempt History</h5>
      {attempts.map((a, i) => {
        const { correct, total } = computeQuizScore(a.answers);
        return (
          <div
            key={a.id ?? i}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
              a.passed
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${a.passed ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-muted-foreground">
                Attempt {attempts.length - i}
              </span>
            </div>
            <span className={a.passed ? 'text-green-400 font-medium' : 'text-muted-foreground'}>
              {correct}/{total} ({a.score}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}
