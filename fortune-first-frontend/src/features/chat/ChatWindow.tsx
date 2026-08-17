'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from './useTeamChat';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface ChatWindowProps {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  currentUserId?: string;
  typingUser: string | null;
  onSend: (content: string) => void;
  onTyping: (typing: boolean) => void;
}

export function ChatWindow({ title, subtitle, messages, currentUserId, typingUser, onSend, onTyping }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    onTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    onTyping(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  return (
    <div className="flex h-[640px] flex-1 flex-col rounded-2xl border border-brand-border bg-white">
      <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{typingUser ? `${typingUser} is typing…` : subtitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-muted/40 p-5">
        {messages.length === 0 && <p className="text-center text-sm text-gray-400">No messages yet</p>}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const seen = isMe && (msg.read_by?.length || 0) > 1;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  isMe ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-brand-border bg-white'
                }`}
              >
                {!isMe && <p className="mb-1 text-xs font-bold text-primary">{msg.sender_name || 'Team member'}</p>}
                <p className="text-sm">{msg.content}</p>
                <div
                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                    isMe ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  <span>{formatTime(msg.created_at)}</span>
                  {isMe && (seen ? <CheckCheck size={12} /> : <Check size={12} />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-brand-border p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-brand-border px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
