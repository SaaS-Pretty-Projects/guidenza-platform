import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import {
  createQuiz, updateQuiz, deleteQuiz, getModuleQuizzes,
  type Quiz, type QuizQuestion,
} from '../lib/quizzes';
import { generateQuiz as generateAIQuiz, type Difficulty } from '../lib/ai';
import { validateQuizForm, mapAIGeneratedToForm } from '../lib/quizForm';

interface QuizEditorProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  onClose: () => void;
}

interface DraftQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
}

const blankQuestion = (): DraftQuestion => ({
  id: crypto.randomUUID(),
  questionText: '',
  options: ['', ''],
  correctAnswer: 0,
});

export function QuizEditor({ courseId, moduleId, moduleTitle, onClose }: QuizEditorProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiDifficulty, setAIDifficulty] = useState<Difficulty>('medium');
  const [aiGenerating, setAIGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getModuleQuizzes(courseId, moduleId)
      .then((q) => { if (!cancelled) setQuizzes(q); })
      .catch((err) => { if (!cancelled) console.error('Failed to load quizzes', err); });
    return () => { cancelled = true; };
  }, [courseId, moduleId]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, blankQuestion()]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.id !== id)));
  };

  const updateQuestionField = (id: string, field: 'questionText' | 'correctAnswer', value: string | number) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qId: string, optIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId
      ? { ...q, options: q.options.map((o, i) => (i === optIdx ? value : o)) }
      : q)));
  };

  const addOption = (qId: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId
      ? { ...q, options: [...q.options, ''] }
      : q)));
  };

  const removeOption = (qId: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== qId || q.options.length <= 2) return q;
      return {
        ...q,
        options: q.options.slice(0, -1),
        correctAnswer: Math.min(q.correctAnswer, q.options.length - 2),
      };
    }));
  };

  const resetForm = () => {
    setTitle('');
    setPassingScore(70);
    setMaxAttempts(3);
    setQuestions([blankQuestion()]);
    setEditingId(null);
    setValidationErrors([]);
  };

  const handleSave = async () => {
    const result = validateQuizForm({ title, questions });
    if (!result.valid) {
      setValidationErrors(result.errors);
      return;
    }
    setValidationErrors([]);
    setLoading(true);
    try {
      const quizData = {
        title: title.trim(),
        passingScore,
        maxAttempts,
        questions: questions as QuizQuestion[],
      };
      if (editingId) {
        await updateQuiz(courseId, moduleId, editingId, quizData);
      } else {
        await createQuiz(courseId, moduleId, quizData);
      }
      resetForm();
      const updated = await getModuleQuizzes(courseId, moduleId);
      setQuizzes(updated);
    } catch (err) {
      console.error('Failed to save quiz', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz: Quiz) => {
    setTitle(quiz.title);
    setPassingScore(quiz.passingScore);
    setMaxAttempts(quiz.maxAttempts);
    setQuestions(quiz.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
    })));
    setEditingId(quiz.id ?? null);
    setValidationErrors([]);
  };

  const handleDelete = async (quizId: string) => {
    try {
      await deleteQuiz(courseId, moduleId, quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (editingId === quizId) resetForm();
    } catch (err) {
      console.error('Failed to delete quiz', err);
    }
  };

  const handleAIGenerate = async () => {
    setAIGenerating(true);
    try {
      const generated = await generateAIQuiz(courseId, moduleId, aiDifficulty, 5);
      const mapped = mapAIGeneratedToForm(generated);
      setTitle(mapped.title);
      setPassingScore(mapped.passingScore);
      setQuestions(mapped.questions);
      setEditingId(null);
      setValidationErrors([]);
    } catch (err) {
      console.error('AI generation failed', err);
    } finally {
      setAIGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quizzes for {moduleTitle}</h3>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      {quizzes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Existing Quizzes</h4>
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]"
            >
              <div>
                <p className="text-sm font-medium">{q.title}</p>
                <p className="text-xs text-muted-foreground">
                  {q.questions.length} questions &middot; {q.passingScore}% to pass &middot; {q.maxAttempts || '∞'} attempts
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(q)}
                  className="text-xs text-muted-foreground hover:text-foreground border border-white/10 px-2 py-1 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => q.id && handleDelete(q.id)}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-2 py-1 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{editingId ? 'Edit Quiz' : 'New Quiz'}</h4>
          <div className="flex items-center gap-2">
            <select
              value={aiDifficulty}
              onChange={(e) => setAIDifficulty(e.target.value as Difficulty)}
              className="bg-background border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-white/30"
              aria-label="AI generation difficulty"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 px-2 py-1 rounded-lg disabled:opacity-50"
            >
              <Sparkles size={12} />
              {aiGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Quiz Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Module 1 Quiz"
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">Passing Score (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">Max Attempts (0 = ∞)</label>
            <input
              type="number"
              min={0}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Questions</label>
            <button onClick={addQuestion} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Plus size={12} /> Add Question
            </button>
          </div>
          {questions.map((q, qi) => (
            <div key={q.id} className="p-3 rounded-lg border border-white/5 bg-white/[0.03] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Q{qi + 1}</span>
                <input
                  value={q.questionText}
                  onChange={(e) => updateQuestionField(q.id, 'questionText', e.target.value)}
                  placeholder="Question text..."
                  className="flex-1 bg-background border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-white/30"
                />
                <button onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-300" aria-label="Remove question">
                  <Trash2 size={14} />
                </button>
              </div>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2 ml-4">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctAnswer === oi}
                    onChange={() => updateQuestionField(q.id, 'correctAnswer', oi)}
                    aria-label={`Mark option ${oi + 1} as correct`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(q.id, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 bg-background border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
              ))}
              <div className="ml-4 flex gap-3 text-xs">
                <button onClick={() => addOption(q.id)} className="text-muted-foreground hover:text-foreground">
                  + Add option
                </button>
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(q.id)} className="text-red-400 hover:text-red-300">
                    - Remove last option
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {validationErrors.length > 0 && (
          <ul className="text-xs text-red-400 space-y-1" role="alert">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <button onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground border border-white/10 rounded-full">
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-full disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingId ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
