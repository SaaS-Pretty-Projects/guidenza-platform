import React, { useState, useEffect } from 'react';
import { createQuiz, updateQuiz, deleteQuiz, getModuleQuizzes, type Quiz, type QuizQuestion } from '../lib/quizzes';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface QuizEditorProps {
  courseId: string;
  modules: { id: string; title: string }[];
  onClose: () => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyQuestion(): QuizQuestion {
  return {
    id: generateId(),
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  };
}

export function QuizEditor({ courseId, modules, onClose }: QuizEditorProps) {
  const [quizzes, setQuizzes] = useState<Record<string, Quiz[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [editingQuiz, setEditingQuiz] = useState<{ moduleId: string; quiz: Quiz } | null>(null);
  const [addingForModule, setAddingForModule] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    passingScore: 70,
    maxAttempts: 0,
    questions: [emptyQuestion()],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllQuizzes();
  }, [courseId]);

  async function loadAllQuizzes() {
    setLoading(true);
    const results: Record<string, Quiz[]> = {};
    for (const mod of modules) {
      try {
        results[mod.id] = await getModuleQuizzes(courseId, mod.id);
      } catch {
        results[mod.id] = [];
      }
    }
    setQuizzes(results);
    setLoading(false);
  }

  function toggleModule(moduleId: string) {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }

  function handleAddQuiz(moduleId: string) {
    setEditingQuiz(null);
    setAddingForModule(moduleId);
    setFormData({
      title: '',
      passingScore: 70,
      maxAttempts: 0,
      questions: [emptyQuestion()],
    });
  }

  function handleEditQuiz(moduleId: string, quiz: Quiz) {
    setAddingForModule(null);
    setEditingQuiz({ moduleId, quiz });
    setFormData({
      title: quiz.title,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      questions: quiz.questions.length > 0 ? quiz.questions : [emptyQuestion()],
    });
  }

  function cancelForm() {
    setEditingQuiz(null);
    setAddingForModule(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    setSaving(true);
    try {
      const quizData = {
        title: formData.title,
        passingScore: formData.passingScore,
        maxAttempts: formData.maxAttempts,
        questions: formData.questions,
      };

      if (editingQuiz) {
        await updateQuiz(courseId, editingQuiz.moduleId, editingQuiz.quiz.id!, quizData);
        toast.success('Quiz updated');
        await loadModuleQuizzes(editingQuiz.moduleId);
      } else if (addingForModule) {
        await createQuiz(courseId, addingForModule, quizData);
        toast.success('Quiz created');
        await loadModuleQuizzes(addingForModule);
      }
      cancelForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  }

  async function loadModuleQuizzes(moduleId: string) {
    try {
      const data = await getModuleQuizzes(courseId, moduleId);
      setQuizzes(prev => ({ ...prev, [moduleId]: data }));
    } catch {
      // ignore
    }
  }

  async function handleDeleteQuiz(moduleId: string, quiz: Quiz) {
    if (!window.confirm(`Delete quiz "${quiz.title}"? This cannot be undone.`)) return;
    try {
      await deleteQuiz(courseId, moduleId, quiz.id!);
      toast.success('Quiz deleted');
      await loadModuleQuizzes(moduleId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete quiz');
    }
  }

  function addQuestion() {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  }

  function removeQuestion(index: number) {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function updateQuestionField(index: number, value: string) {
    setFormData(prev => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], questionText: value };
      return { ...prev, questions };
    });
  }

  function updateCorrectAnswer(index: number, value: number) {
    setFormData(prev => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], correctAnswer: value };
      return { ...prev, questions };
    });
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setFormData(prev => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];
      options[optionIndex] = value;
      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl custom-scrollbar">
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-8 pb-4 border-b border-white/10">
          <h2 className="text-2xl font-semibold">Quiz Manager</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {editingQuiz || addingForModule ? (
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {editingQuiz ? 'Edit Quiz' : 'Add Quiz'}
              </h3>
              <span className="text-sm text-muted-foreground">
                {editingQuiz
                  ? `Module: ${modules.find(m => m.id === editingQuiz.moduleId)?.title ?? editingQuiz.moduleId}`
                  : `Module: ${modules.find(m => m.id === addingForModule)?.title ?? addingForModule}`}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Passing Score (0-100)</label>
                <input
                  type="number"
                  value={formData.passingScore}
                  onChange={e => setFormData({ ...formData, passingScore: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  min={0}
                  max={100}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Max Attempts (0 = unlimited)</label>
                <input
                  type="number"
                  value={formData.maxAttempts}
                  onChange={e => setFormData({ ...formData, maxAttempts: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-muted-foreground">Questions</label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-sm text-foreground font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>
              <div className="space-y-4">
                {formData.questions.map((q, qi) => (
                  <div key={q.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <label className="text-xs font-medium text-muted-foreground">Question {qi + 1}</label>
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qi)}
                          className="text-red-400 hover:text-red-300 transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={q.questionText}
                      onChange={e => updateQuestionField(qi, e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-foreground focus:outline-none focus:border-white/20 min-h-[60px] text-sm"
                      placeholder="Enter your question..."
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === oi}
                            onChange={() => updateCorrectAnswer(qi, oi)}
                            className="accent-white cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={e => updateOption(qi, oi, e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-white/20"
                            placeholder={`Option ${oi + 1}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Radio button marks the correct answer</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelForm}
                className="px-6 py-3 rounded-full font-semibold border border-white/10 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-full font-semibold bg-foreground text-background hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Quiz'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading quizzes...</p>
            ) : modules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No modules found for this course.</p>
            ) : (
              modules.map(mod => {
                const modQuizzes = quizzes[mod.id] ?? [];
                const expanded = expandedModules[mod.id] ?? true;
                return (
                  <div key={mod.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                    >
                      <span className="font-medium">{mod.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{modQuizzes.length} quiz{modQuizzes.length !== 1 ? 'zes' : ''}</span>
                        {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-white/10 p-4 space-y-3">
                        {modQuizzes.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No quizzes yet.</p>
                        ) : (
                          modQuizzes.map(quiz => (
                            <div key={quiz.id} className="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{quiz.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                                  {' · '}Pass: {quiz.passingScore}%
                                  {quiz.maxAttempts > 0 ? ` · Max: ${quiz.maxAttempts}` : ' · Unlimited'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                <button
                                  type="button"
                                  onClick={() => handleEditQuiz(mod.id, quiz)}
                                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit Quiz"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuiz(mod.id, quiz)}
                                  className="w-8 h-8 bg-white/5 hover:bg-red-500/20 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                                  title="Delete Quiz"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddQuiz(mod.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-white/10 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                        >
                          <Plus size={14} />
                          Add Quiz
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
