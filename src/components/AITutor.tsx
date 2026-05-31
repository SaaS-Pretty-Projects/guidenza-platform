import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';

const AI_TUTOR_COST = 50;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITutorProps {
  courseTitle: string;
  courseDescription: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AITutor({ courseTitle, courseDescription, isOpen, onClose }: AITutorProps) {
  const { user } = useAuth();
  const { credits, spend, tier } = useCredits();
  const rateLimiter = useRateLimit({ key: 'ai_tutor', maxPerDay: 10 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    if (tier === 'free') {
      const success = await spend(AI_TUTOR_COST, `AI Tutor session: ${courseTitle}`);
      if (!success) {
        toast.error(`Not enough credits. Need ${AI_TUTOR_COST} credits.`);
        return;
      }
    }
    if (!rateLimiter.consume()) {
      toast.error('Daily tutor session limit reached (10/day). Try again tomorrow.');
      return;
    }
    setSessionStarted(true);
    setMessages([{
      role: 'assistant',
      content: `Hi! I'm your AI tutor for "${courseTitle}". Ask me anything about the course material and I'll help you understand it better. What would you like to learn?`
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const systemPrompt = `You are an expert tutor for the course "${courseTitle}". Course description: "${courseDescription}". 
      Provide clear, concise explanations. Use examples when helpful. If the student asks something outside the course scope, gently guide them back. 
      Keep responses focused and under 300 words unless the question requires more detail.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ]
      });

      const text = response.text || 'I apologize, but I encountered an issue generating a response. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (err) {
      console.error('AI Tutor error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 bg-[#0a0a0b] border-l border-white/10 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium">AI Tutor</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{courseTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages or Start Screen */}
        {!sessionStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6"
            >
              <Bot className="w-8 h-8 text-accent" />
            </motion.div>
            <h3 className="text-lg font-medium mb-2">AI Tutor Session</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get personalized explanations, ask questions, and deepen your understanding of the course material.
            </p>
            {tier !== 'free' ? (
              <div className="text-xs text-green-400 mb-4">Included with your {tier} plan</div>
            ) : (
              <div className="text-xs text-muted-foreground mb-4">Cost: {AI_TUTOR_COST} credits per session | Your balance: {credits}</div>
            )}
            <button
              onClick={startSession}
              disabled={tier === 'free' && credits < AI_TUTOR_COST}
              className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tier === 'free' && credits < AI_TUTOR_COST ? 'Not Enough Credits' : 'Start Session'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent/20 text-foreground'
                      : 'bg-white/5 text-foreground'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-white/5 rounded-2xl px-4 py-3">
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-accent"
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask your tutor..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground hover:opacity-90 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
