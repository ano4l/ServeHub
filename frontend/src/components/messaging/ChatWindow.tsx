"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { messagesApi, type ChatMessageItem } from "@/lib/api";
import { WS_URL } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

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
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const stompRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/bookings/${bookingId}`, (frame) => {
          const payload = JSON.parse(frame.body) as {
            bookingId: number;
            sender: string;
            message: string;
            sentAt: string;
          };

          setMessages((current) => {
            const exists = current.some(
              (entry) =>
                entry.senderId === payload.sender &&
                entry.content === payload.message &&
                entry.sentAt === payload.sentAt
            );
            if (exists) {
              return current;
            }

            return [
              ...current,
              {
                id: `${payload.sender}-${payload.sentAt}`,
                senderId: payload.sender,
                senderName: payload.sender === user?.id ? user.fullName : otherParty.name,
                content: payload.message,
                sentAt: payload.sentAt,
                read: true,
              },
            ];
          });
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [accessToken, bookingId, otherParty.name, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) {
      return;
    }

    setSending(true);
    const text = input.trim();
    setInput("");

    try {
      const { data } = await messagesApi.send(bookingId, text);
      setMessages((current) => {
        if (current.some((message) => message.id === data.id)) {
          return current;
        }
        return [...current, data];
      });
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-stone-50/50">
        <Avatar src={otherParty.avatar} name={otherParty.name} size="sm" online={otherParty.online} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-stone-900">{otherParty.name}</p>
          {bookingRef && <p className="text-[11px] text-stone-400">Booking #{bookingRef}</p>}
        </div>
        <button className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-5 w-5 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                >
                  {!isOwn && <Avatar name={message.senderName} size="xs" className="mt-1 shrink-0" />}
                  <div className={cn("max-w-[70%] space-y-1", isOwn && "items-end flex flex-col")}>
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isOwn ? "bg-stone-900 text-white rounded-tr-sm" : "bg-stone-100 text-stone-900 rounded-tl-sm"
                      )}
                    >
                      {message.content}
                    </div>
                    <span className="text-[10px] text-stone-400 px-1">{formatRelativeTime(message.sentAt)}</span>
                  </div>
                </motion.div>
              );
            })}
            <AnimatePresence />
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0">
            <Paperclip className="h-4 w-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
            onClick={() => void handleSend()}
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
