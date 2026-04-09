'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { v4 as uuidv4 } from 'uuid';

interface Props { role: 'donor' | 'recipient'; userName?: string; }

const QUICK_QUESTIONS: Record<string, string[]> = {
  donor: [
    'How does organ matching work?',
    'What are the viability windows?',
    'Which blood types can I donate to?',
    'What health conditions affect eligibility?',
  ],
  recipient: [
    'How is my priority calculated?',
    'What blood types can donate to me?',
    'How long is the average wait time?',
    'What happens after allocation?',
  ],
};

export default function Chatbot({ role, userName }: Props) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: `Hi ${userName || 'there'}! 👋 I'm OrganMatch AI. I'm here to help you understand the ${role === 'donor' ? 'organ donation' : 'transplant waiting'} process. What would you like to know?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: data.reply || data.message || 'Sorry, something went wrong.',
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: 'Connection error. Please check your Groq API key in .env.local.',
        timestamp: new Date().toISOString(),
      }]);
    } finally { setLoading(false); }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400';

  return (
    <div className={`${cardBg} border rounded-2xl flex flex-col h-[520px] overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-inherit flex items-center gap-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
          AI
        </div>
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>OrganMatch AI</p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {role === 'donor' ? 'Donor Assistant' : 'Recipient Assistant'} · Powered by Groq
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot" />
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-400'} animate-bounce`}
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_QUESTIONS[role].map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isDark
                  ? 'border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400'
                  : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600'
              }`}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={`px-4 py-3 border-t border-inherit flex gap-2`}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask me anything..."
          className={`flex-1 rounded-xl px-4 py-2 text-sm border outline-none transition-colors ${inputBg} focus:border-blue-500`}
        />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          Send
        </button>
      </div>
    </div>
  );
}
