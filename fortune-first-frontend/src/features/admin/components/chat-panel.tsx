'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Phone, Video, Info, Send, Paperclip, Mic, Smile } from 'lucide-react';

import api, { getAccessToken } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ChatPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get('/admin/chat/group_all')
      .then((res) => setMessages(res.data.data))
      .catch((error) => console.error('Failed to load chat history', error));

    const token = getAccessToken();
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000', {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('receive_message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { conversationId: 'group_all', content: input });
    setInput('');
  };

  return (
    <div className="flex h-[640px] flex-1 flex-col rounded-2xl border border-brand-border bg-white">
      <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Team Channel</h3>
          <p className="text-xs text-gray-500">{messages.length > 0 ? 'Shared with your whole team' : 'No messages yet'}</p>
        </div>
        <div className="flex items-center gap-2">
          {[Phone, Video, Info].map((Icon, i) => (
            <button
              key={i}
              disabled
              title="Coming soon"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border text-gray-300"
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-muted/40 p-5">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  isMe ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-brand-border bg-white'
                }`}
              >
                {!isMe && <p className="mb-1 text-xs font-bold text-primary">{msg.sender_name || 'Team member'}</p>}
                <p className="text-sm">{msg.content}</p>
                <p className={`mt-1 text-right text-[10px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-brand-border p-4">
        <button type="button" disabled title="Coming soon" className="text-gray-300">
          <Smile size={19} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-brand-border px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button type="button" disabled title="Coming soon" className="text-gray-300">
          <Paperclip size={18} />
        </button>
        <button type="button" disabled title="Coming soon" className="text-gray-300">
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
