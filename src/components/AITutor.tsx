import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { askTutor } from '../lib/ai';

export interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  content: string;
}

interface AITutorProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  initialQuestion?: string;
  onClose: () => void;
}

let msgId = 0;

export function AITutor({ courseId, moduleId, moduleTitle, initialQuestion, onClose }: AITutorProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const initialSentRef = useRef(false);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialQuestion && !initialSentRef.current) {
      initialSentRef.current = true;
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSend = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setInput('');

    const userMsg: TutorMessage = { id: `m-${++msgId}`, role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const answer = await askTutor(courseId, moduleId, question);
      if (!mountedRef.current) return;
      const tutorMsg: TutorMessage = { id: `m-${++msgId}`, role: 'tutor', content: answer };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      if (!mountedRef.current) return;
      const errMsg: TutorMessage = { id: `m-${++msgId}`, role: 'tutor', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div>
          <h4 className="text-sm font-semibold">AI Tutor</h4>
          <p className="text-xs text-muted-foreground">{moduleTitle}</p>
        </div>
        <button onClick={onClose} aria-label="Close AI tutor" className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 custom-scrollbar" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ask me anything about this module.</p>
            <p className="text-xs mt-1">I'll use the module content to answer.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'tutor' && (
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-purple-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-foreground text-background rounded-br-sm'
                  : 'bg-white/5 border border-white/10 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-purple-400" />
            </div>
            <div className="max-w-[80%] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this module..."
          disabled={loading}
          className="flex-1 bg-background border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 transition-opacity"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
