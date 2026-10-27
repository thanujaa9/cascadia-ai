import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { askAssistant } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const PRESET_QUERIES = [
  "What is the probable root cause of the current failure?",
  "Which downstream services will degrade next and when?",
  "What is the recommended recovery action and trade-offs?",
  "Why should we NOT restart the database during high load?"
];

export const AssistantDrawer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: "**CASCADIA Autonomous SRE Copilot Initialized.**\n\nI am grounded strictly in live telemetry, topology dependencies, and observed causal evidence — not unverified hallucinations.\n\nAsk me about active anomalies, cascade risk projections, or recommended intervention trade-offs.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await askAssistant(q);
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: "Error connecting to SRE Intelligence engine. Please ensure backend is active.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1200px] mx-auto py-2 h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>CASCADIA Natural-Language Incident Copilot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-semibold uppercase">
                Bonus Feature
              </span>
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              Evidence-grounded SRE incident intelligence engine
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-neutral-500 shrink-0 text-[11px]">Quick Prompts:</span>
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="shrink-0 bg-[#171717] hover:bg-[#222222] border border-[#2c2c2c] hover:border-cyan-600/50 text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg text-xs transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Chat Window */}
      <div className="flex-1 bg-[#101010] border border-[#222222] rounded-xl p-4 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-neutral-500">
              <span>{m.sender === 'user' ? 'Operator' : 'Cascadia AI Copilot'}</span>
              <span>·</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap font-sans ${
                m.sender === 'user'
                  ? 'bg-neutral-800 text-white rounded-tr-none'
                  : 'bg-[#181818] border border-[#282828] text-neutral-200 rounded-tl-none font-mono'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-[#161616] p-3 rounded-lg border border-[#262626] w-fit">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Consulting telemetry baselines and dependency graph...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-xl p-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cascadia about incident root cause, downstream cascade risk, or recovery options..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
