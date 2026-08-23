'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Check, CheckCheck, Phone, Video, Info, Paperclip, Mic, Smile } from 'lucide-react';
import type { ChatMessage } from './useTeamChat';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateDivider(dateStr: string) {
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday ? `Today, ${formatted}` : formatted;
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

  const isGroup = title === 'Team Channel';
  const isOnline = subtitle === 'Online';

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
    <div className="flex h-[640px] flex-1 flex-col rounded-2xl border border-brand-border bg-card">
      <div className="flex items-center justify-between border-b border-brand-border px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-xs font-bold text-primary">
            {isGroup ? '#' : initials(title)}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {typingUser ? (
                `${typingUser} is typing…`
              ) : !isGroup && isOnline ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                subtitle
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border text-primary transition-colors hover:bg-muted"
            aria-label="Call"
          >
            <Phone size={16} />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border text-primary transition-colors hover:bg-muted"
            aria-label="Video call"
          >
            <Video size={16} />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border text-primary transition-colors hover:bg-muted"
            aria-label="Conversation info"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto bg-muted/40 p-5">
        {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet</p>}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const seen = isMe && (msg.read_by?.length || 0) > 1;
          const showDateDivider = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="my-4 flex items-center justify-center">
                  <span className="rounded-full border border-brand-border bg-card px-3 py-1 text-xs text-muted-foreground">
                    {formatDateDivider(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 py-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary">
                    {initials(msg.sender_name || 'T')}
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? 'rounded-br-md border border-primary/40 bg-primary/10 text-foreground'
                      : 'rounded-bl-md border border-brand-border bg-card'
                  }`}
                >
                  {!isMe && <p className="mb-1 text-xs font-bold text-primary">{msg.sender_name || 'Team member'}</p>}
                  <p className="text-sm">{msg.content}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                    <span>{formatTime(msg.created_at)}</span>
                    {isMe && (seen ? <CheckCheck size={12} /> : <Check size={12} />)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-brand-border p-4">
        <div className="relative flex-1">
          <Smile size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type a message..."
            className="w-full rounded-full border border-brand-border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          aria-label="Record voice message"
        >
          <Mic size={18} />
        </button>
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
