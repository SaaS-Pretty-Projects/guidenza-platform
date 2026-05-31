import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Clock, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';

const STUDY_PLAN_COST = 100;

export function AIStudyPlan() {
  const { user } = useAuth();
  const { credits, spend, tier } = useCredits();
  const rateLimiter = useRateLimit({ key: 'ai_study_plan', maxPerDay: 3 });
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!goal.trim()) {
      toast.error('Please describe your learning goal');
      return;
    }

    if (tier === 'free') {
      const success = await spend(STUDY_PLAN_COST, 'AI Study Plan generation');
      if (!success) {
        toast.error(`Need ${STUDY_PLAN_COST} credits. You have ${credits}.`);
        return;
      }
    }

    if (!rateLimiter.consume()) {
      toast.error('Daily study plan limit reached (3/day). Try again tomorrow.');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const prompt = `Create a detailed, actionable study plan for a student with these parameters:
- Goal: ${goal}
- Experience level: ${experience}
- Available time: ${hoursPerWeek} hours per week

Generate a structured plan with:
1. A 4-8 week timeline with specific weekly milestones
2. Recommended resources and courses
3. Practice exercises for each week
4. Key concepts to master at each stage
5. Assessment checkpoints

Format as clean markdown. Be specific and practical.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      setPlan(response.text || 'Failed to generate plan. Please try again.');
    } catch (err) {
      console.error('Study plan generation error:', err);
      toast.error('Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <Helmet><title>AI Study Plan | Guidenza</title></Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-accent" />
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">AI Study Plan Generator</h1>
        </div>
        <p className="text-muted-foreground mb-10">
          Get a personalized learning roadmap powered by AI.
          {tier === 'free' && <span className="text-yellow-400 ml-1">({STUDY_PLAN_COST} credits)</span>}
          {tier !== 'free' && <span className="text-green-400 ml-1">(Included with {tier})</span>}
        </p>

        {!plan ? (
          <div className="liquid-glass rounded-2xl border border-white/5 p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" /> What do you want to learn?
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Master React and build production-ready web applications"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" /> Experience Level
              </label>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setExperience(level)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      experience === level
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> Hours per week: {hoursPerWeek}
              </label>
              <input
                type="range"
                min={1}
                max={40}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 hr</span>
                <span>40 hrs</span>
              </div>
            </div>

            <button
              onClick={generatePlan}
              disabled={loading || !goal.trim() || (tier === 'free' && credits < STUDY_PLAN_COST)}
              className="w-full py-3 rounded-full bg-accent text-accent-foreground font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Study Plan
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setPlan(null)}
              className="px-4 py-2 rounded-full bg-white/5 text-sm hover:bg-white/10 transition"
            >
              Generate Another Plan
            </button>
            <div className="liquid-glass rounded-2xl border border-white/5 p-6 sm:p-8 prose prose-invert prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(plan.replace(/\n/g, '<br/>').replace(/#{1,3}\s(.+)/g, '<h3>$1</h3>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')) }} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
