"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Paperclip, Image as ImageIcon, MoreVertical, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { messagesApi } from "@/lib/api";
import { WS_URL } from "@/lib/constants";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: string[];
  sentAt: string;
  read: boolean;
}

interface ChatWindowProps {
  bookingId: string;
  otherParty: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
  };
  bookingRef?: string;
}

export function ChatWindow({ bookingId, otherParty, bookingRef }: ChatWindowProps) {
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const stompRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load message history
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await messagesApi.getThread(bookingId, { page: 0, size: 50 });
        setMessages(data.content ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  // WebSocket connection
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      onConnect: () => {
        client.subscribe(`/topic/booking/${bookingId}/messages`, (msg) => {
          const data: Message = JSON.parse(msg.body);
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
        });
        client.subscribe(`/topic/booking/${bookingId}/typing`, (msg) => {
          const { senderId } = JSON.parse(msg.body);
          if (senderId !== user?.id) {
            setTyping(true);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setTyping(false), 3000);
          }
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [bookingId, accessToken, user?.id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleTyping = useCallback(() => {
    stompRef.current?.publish({
      destination: `/app/booking/${bookingId}/typing`,
      body: JSON.stringify({ senderId: user?.id }),
    });
  }, [bookingId, user?.id]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      await messagesApi.send(bookingId, text);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTyping();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-stone-50/50">
        <Avatar src={otherParty.avatar} name={otherParty.name} size="sm" online={otherParty.online} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-stone-900">{otherParty.name}</p>
          {bookingRef && (
            <p className="text-[11px] text-stone-400">Booking #{bookingRef}</p>
          )}
        </div>
        <button className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-5 w-5 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                >
                  {!isOwn && (
                    <Avatar src={msg.senderAvatar} name={msg.senderName} size="xs" className="mt-1 shrink-0" />
                  )}
                  <div className={cn("max-w-[70%] space-y-1", isOwn && "items-end flex flex-col")}>
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isOwn
                          ? "bg-stone-900 text-white rounded-tr-sm"
                          : "bg-stone-100 text-stone-900 rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-stone-400 px-1">
                      {formatRelativeTime(msg.sentAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            {/* Typing indicator */}
            <AnimatePresence>
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 items-end"
                >
                  <Avatar src={otherParty.avatar} name={otherParty.name} size="xs" />
                  <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0">
            <Paperclip className="h-4 w-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 max-h-32 overflow-y-auto"
              style={{ minHeight: "42px" }}
            />
          </div>
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim()}
            className="shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
