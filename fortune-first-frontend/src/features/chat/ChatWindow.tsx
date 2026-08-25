'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Check, CheckCheck, Phone, Video, Info, Paperclip, Mic, Smile, ArrowLeft } from 'lucide-react';
import type { ChatMessage } from './useTeamChat';
import { EmojiPicker } from './EmojiPicker';

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
  onBack?: () => void;
}

export function ChatWindow({ title, subtitle, messages, currentUserId, typingUser, onSend, onTyping, onBack }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  const handleEmojiSelect = (emoji: string) => {
    handleInputChange(input + emoji);
  };

  return (
    // WhatsApp-style single-pane chat: fills the viewport on mobile (the
    // back arrow returns to the contact list), fixed height on desktop
    // where the contact list sits alongside it.
    <div className="flex h-[calc(100vh-13rem)] flex-1 flex-col rounded-2xl border border-brand-border bg-card lg:h-[640px]">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Back to contacts"
            >
              <ArrowLeft size={20} />
            </button>
          )}
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
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-brand-border text-primary transition-colors hover:bg-muted sm:flex"
            aria-label="Conversation info"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* WhatsApp-style chat backdrop: a faint tinted surface behind the bubbles */}
      <div className="flex-1 space-y-1 overflow-y-auto bg-[#e9ddce]/25 p-3 dark:bg-[#0b141a]/60 sm:p-5">
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
                {/* WhatsApp's signature colors: light green outgoing bubble, white incoming */}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
                    isMe
                      ? 'rounded-br-sm bg-[#dcf8c6] text-gray-900 dark:bg-[#025144] dark:text-gray-100'
                      : 'rounded-bl-sm bg-white text-gray-900 dark:bg-[#1f2c34] dark:text-gray-100'
                  }`}
                >
                  {!isMe && <p className="mb-1 text-xs font-bold text-primary">{msg.sender_name || 'Team member'}</p>}
                  <p className="text-sm">{msg.content}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>{formatTime(msg.created_at)}</span>
                    {isMe && (seen ? <CheckCheck size={12} className="text-sky-500" /> : <Check size={12} />)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative flex items-center gap-2 border-t border-brand-border p-3 sm:p-4">
        {showEmojiPicker && (
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
        )}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted ${
            showEmojiPicker ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
          aria-label="Choose emoji"
        >
          <Smile size={20} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-brand-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary sm:flex"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>
        {input.trim() ? (
          <button
            type="submit"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
            aria-label="Record voice message"
          >
            <Mic size={16} />
          </button>
        )}
      </form>
    </div>
  );
}
