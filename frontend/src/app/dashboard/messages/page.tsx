"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Search, Filter, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { BookingStatusBadge } from "@/components/booking/BookingStatusStepper";
import type { BookingStatus } from "@/lib/constants";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { useAuthStore } from "@/store/auth.store";
import { bookingsApi, type BookingListItem } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

interface MessageThread {
  bookingId: string;
  bookingRef: string;
  otherParty: {
    id: string;
    name: string;
    avatar?: string;
    online?: boolean;
  };
  lastMessage: {
    content: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount: number;
  service: string;
  status: string;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bookingsApi.getAll({ page: 0, size: 50 });
        const bookings = res.data.content ?? [];
        const messageThreads: MessageThread[] = bookings.map((b: BookingListItem) => ({
          bookingId: b.id,
          bookingRef: b.reference,
          otherParty: user?.activeRole === "CUSTOMER" 
            ? { id: b.provider.id, name: b.provider.name, avatar: b.provider.avatar }
            : { id: b.customer.id, name: b.customer.name, avatar: b.customer.avatar },
          lastMessage: {
            content: "Start a conversation about this booking",
            sentAt: b.createdAt,
            senderId: "",
          },
          unreadCount: 0,
          service: b.service,
          status: b.status,
        }));
        setThreads(messageThreads);
      } catch {
        // silently handle errors
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filteredThreads = threads.filter(thread =>
    thread.otherParty.name.toLowerCase().includes(search.toLowerCase()) ||
    thread.service.toLowerCase().includes(search.toLowerCase()) ||
    thread.bookingRef.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedThread) {
    return (
      <DashboardLayout requiredRole="CUSTOMER">
        <div className="h-full">
          <Button
            variant="ghost"
            onClick={() => setSelectedThread(null)}
            className="mb-4"
          >
            ← Back to Messages
          </Button>
          <ChatWindow
            bookingId={selectedThread.bookingId}
            otherParty={selectedThread.otherParty}
            bookingRef={selectedThread.bookingRef}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="CUSTOMER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Messages</h1>
            <p className="text-stone-500 mt-1">Chat with providers and customers</p>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Message Threads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100">
                    <div className="h-10 w-10 rounded-full bg-stone-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-stone-200 rounded animate-pulse w-1/3" />
                      <div className="h-3 bg-stone-200 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-stone-900 mb-2">No messages yet</h3>
                <p className="text-stone-500 mb-4">
                  {search ? "No conversations match your search" : "Start a booking to begin messaging"}
                </p>
                {!search && (
                  <Button variant="primary" asChild>
                    <a href="/browse">Find Providers</a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.bookingId}
                    onClick={() => setSelectedThread(thread)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-200 hover:bg-stone-50 transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar
                        src={thread.otherParty.avatar}
                        name={thread.otherParty.name}
                        size="md"
                        online={thread.otherParty.online}
                      />
                      {thread.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-stone-900 truncate">
                          {thread.otherParty.name}
                        </span>
                        <span className="text-xs text-stone-400">
                          {formatRelativeTime(thread.lastMessage.sentAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookingStatusBadge status={thread.status as BookingStatus} />
                        <span className="text-xs text-stone-500">{thread.service}</span>
                      </div>
                      <p className="text-sm text-stone-600 truncate">
                        {thread.lastMessage.content}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
