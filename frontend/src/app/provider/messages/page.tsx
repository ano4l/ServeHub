"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MessageSquare, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookingStatusBadge } from "@/components/booking/BookingStatusStepper";
import { bookingsApi, type BookingListItem } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

interface ProviderThread {
  bookingId: string;
  bookingRef: string;
  otherParty: {
    id: string;
    name: string;
    avatar?: string;
  };
  service: string;
  status: BookingListItem["status"];
  lastMessageAt: string;
}

export default function ProviderMessagesPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ProviderThread[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bookingsApi.getAll();
        const items = (res.data.content ?? []).map((booking): ProviderThread => ({
          bookingId: booking.id,
          bookingRef: booking.reference,
          otherParty: {
            id: booking.customer.id,
            name: booking.customer.name,
            avatar: booking.customer.avatar,
          },
          service: booking.service,
          status: booking.status,
          lastMessageAt: booking.createdAt,
        }));

        setThreads(items);
        setSelectedBookingId(items[0]?.bookingId ?? null);
      } catch {
        addToast({ type: "error", message: "We couldn't load your customer conversations." });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [addToast]);

  const filteredThreads = threads.filter((thread) => {
    const haystack = `${thread.otherParty.name} ${thread.service} ${thread.bookingRef}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const selectedThread = filteredThreads.find((thread) => thread.bookingId === selectedBookingId) ?? filteredThreads[0] ?? null;

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer messages</h1>
          <p className="mt-1 text-sm text-slate-500">Every conversation stays attached to its booking so nothing falls through the cracks.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="min-h-[680px]">
            <CardHeader>
              <CardTitle>Conversation list</CardTitle>
              <CardDescription>Search by customer name, service, or booking reference.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations..."
                leftIcon={<Search className="h-4 w-4" />}
              />

              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-24 rounded-[24px] border border-white/65 bg-white/55 animate-pulse" />
                  ))
                ) : filteredThreads.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                    No messages match that search yet.
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const active = selectedThread?.bookingId === thread.bookingId;
                    return (
                      <button
                        key={thread.bookingId}
                        onClick={() => setSelectedBookingId(thread.bookingId)}
                        className={`w-full rounded-[24px] border px-4 py-4 text-left transition-all ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-[0_24px_36px_rgba(15,23,42,0.18)]"
                            : "border-white/65 bg-white/60 text-slate-900 hover:bg-white/82"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={thread.otherParty.name} src={thread.otherParty.avatar} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{thread.otherParty.name}</p>
                                <p className={`mt-1 truncate text-sm ${active ? "text-white/70" : "text-slate-500"}`}>{thread.service}</p>
                              </div>
                              <ArrowRight className={`mt-1 h-4 w-4 shrink-0 ${active ? "text-white/70" : "text-slate-400"}`} />
                            </div>
                            <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${active ? "text-white/70" : "text-slate-400"}`}>
                              <BookingStatusBadge status={thread.status} />
                              <span>{thread.bookingRef}</span>
                              <span>{formatRelativeTime(thread.lastMessageAt)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>{selectedThread ? selectedThread.otherParty.name : "Open a conversation"}</CardTitle>
              <CardDescription>
                {selectedThread ? `${selectedThread.service} · ${selectedThread.bookingRef}` : "Choose a booking thread from the left."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {selectedThread ? (
                <div className="h-[620px]">
                  <ChatWindow
                    bookingId={selectedThread.bookingId}
                    bookingRef={selectedThread.bookingRef}
                    otherParty={selectedThread.otherParty}
                  />
                </div>
              ) : (
                <div className="flex h-[620px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
                  <MessageSquare className="h-10 w-10 text-slate-300" />
                  Select a booking to start messaging the customer.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
