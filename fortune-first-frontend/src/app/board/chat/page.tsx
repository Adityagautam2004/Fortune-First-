'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import api, { getAccessToken } from '@/lib/api';

export default function BoardChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // 1. Fetch History from the API we built
    api.get('/board/chat/group_all').then((res) => setMessages(res.data.data));

    // 2. Initialize WebSocket Connection
    const token = getAccessToken();
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000', {
      auth: { token }
    });

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      conversationId: 'group_all',
      content: input
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
      <div className="bg-brand-navy text-white p-4 font-bold">Board Internal Chat (Group)</div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${isMe ? 'bg-brand-orange text-white rounded-br-none' : 'bg-white border border-gray-200 rounded-bl-none'}`}>
                {!isMe && <p className="text-xs font-bold mb-1 text-brand-navy">{msg.sender_name}</p>}
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..." className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:border-brand-orange"
        />
        <button type="submit" className="bg-brand-navy text-white px-6 py-2 rounded-md font-medium hover:bg-opacity-90">Send</button>
      </form>
    </div>
  );
}