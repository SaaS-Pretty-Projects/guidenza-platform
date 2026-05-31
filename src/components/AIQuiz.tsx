import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useCredits } from '../contexts/CreditsContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';

const QUIZ_COST = 75;

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AIQuizProps {
  courseTitle: string;
  courseDescription: string;
}

export function AIQuiz({ courseTitle, courseDescription }: AIQuizProps) {
  const { credits, spend, canAfford, tier } = useCredits();
  const rateLimiter = useRateLimit({ key: 'ai_quiz', maxPerDay: 5 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const generateQuiz = async () => {
    if (tier === 'free' && !canAfford(QUIZ_COST)) {
      toast.error(`Need ${QUIZ_COST} credits. You have ${credits}.`);
      return;
    }
    if (tier === 'free') {
      const success = await spend(QUIZ_COST, `AI Quiz: ${courseTitle}`);
      if (!success) {
        toast.error(`Need ${QUIZ_COST} credits. You have ${credits}.`);
        return;
      }
    }
    if (!rateLimiter.consume()) {
      toast.error('Daily quiz limit reached (5/day). Try again tomorrow.');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const prompt = `Generate a quiz with exactly 10 multiple choice questions about: "${courseTitle}" (${courseDescription}).

Return ONLY a valid JSON array with this exact structure (no markdown, no code fences):
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]

Make questions progressively harder. Include practical application questions.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Invalid response format');

      const parsed: Question[] = JSON.parse(jsonMatch[0]);
      setQuestions(parsed);
      setAnswers(new Array(parsed.length).fill(null));
      setStarted(true);
      setCurrentQ(0);
      setShowResults(false);
    } catch (err) {
      console.error('Quiz generation error:', err);
      toast.error('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResults(true);
    }
  };

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;

  if (!started) {
    return (
      <div className="liquid-glass rounded-2xl border border-white/5 p-6 text-center">
        <Brain className="w-10 h-10 text-accent mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">AI-Generated Quiz</h3>
        <p className="text-sm text-muted-foreground mb-4">Test your knowledge with AI-generated questions.</p>
        {tier === 'free' && <p className="text-xs text-yellow-400 mb-4">{QUIZ_COST} credits per quiz</p>}
        <button
          onClick={generateQuiz}
          disabled={loading || (tier === 'free' && credits < QUIZ_COST)}
          className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="liquid-glass rounded-2xl border border-white/5 p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold mb-2">Quiz Complete!</h3>
          <p className="text-4xl font-bold text-accent">{score}/{questions.length}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {score >= 8 ? 'Excellent!' : score >= 6 ? 'Good job!' : 'Keep studying!'}
          </p>
        </div>
        <div className="space-y-3 mb-6">
          {questions.map((q, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${answers[i] === q.correctIndex ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
              {answers[i] === q.correctIndex ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-medium">{q.question}</p>
                {answers[i] !== q.correctIndex && (
                  <p className="text-muted-foreground mt-1">Correct: {q.options[q.correctIndex]} — {q.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setStarted(false); setQuestions([]); }}
          className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Take Another Quiz
        </button>
      </div>
    );
  }

  const q = questions[currentQ];
  return (
    <div className="liquid-glass rounded-2xl border border-white/5 p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
        <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <h4 className="text-sm font-medium mb-4">{q.question}</h4>
      <div className="space-y-2 mb-4">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => selectAnswer(i)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition border ${
              answers[currentQ] === i
                ? 'bg-accent/10 border-accent/50 text-foreground'
                : 'bg-white/3 border-white/5 text-muted-foreground hover:bg-white/5'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={nextQuestion}
        disabled={answers[currentQ] === null}
        className="w-full py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {currentQ === questions.length - 1 ? 'See Results' : 'Next Question'}
      </button>
    </div>
  );
}
