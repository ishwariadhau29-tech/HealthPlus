import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, User, Stethoscope } from 'lucide-react';
import { ChatMessage } from '@/lib/types';

interface SecureMessagingProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export function SecureMessagingDrawer({ open, onClose, patientId, patientName, messages, onSend }: SecureMessagingProps) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const patientMessages = messages.filter((m) => m.patientId === patientId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [patientMessages, open]);

  if (!open) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Secure Messaging</h2>
              <p className="text-xs text-slate-400">Thread with {patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
          {patientMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400">No messages yet. Start a secure thread with this patient.</p>
            </div>
          ) : (
            patientMessages.map((msg) => {
              const isDoctor = msg.author === 'doctor';
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isDoctor ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isDoctor ? 'bg-blue-500 text-white' : 'bg-teal-500 text-white'}`}>
                    {isDoctor ? <Stethoscope className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${isDoctor ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{msg.text}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Type a secure message..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Messages are encrypted and visible in the patient portal.</p>
        </div>
      </div>
    </div>
  );
}
