"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, Landmark, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { walletApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

interface WalletTransactionItem {
  id: number;
  type: string;
  amount: number;
  reference: string;
  description: string;
  balanceAfter?: number;
  relatedBookingId?: number | null;
  createdAt: string;
}

async function fetchWalletState() {
  const [balanceRes, transactionsRes, payoutsRes] = await Promise.all([
    walletApi.getBalance(),
    walletApi.getTransactions({ page: 0, size: 20 }),
    walletApi.getPayouts({ page: 0, size: 10 }),
  ]);

  return {
    balance: balanceRes.data,
    transactions: transactionsRes.data.content ?? [],
    payouts: payoutsRes.data.content ?? [],
  };
}

export default function ProviderWalletPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<{
    available: number;
    pending: number;
    totalEarnings: number;
    thisMonth: number;
  } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [payouts, setPayouts] = useState<WalletTransactionItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchWalletState();
      setBalance(data.balance);
      setTransactions(data.transactions);
      setPayouts(data.payouts);
    } catch {
      addToast({ type: "error", message: "We couldn't load your wallet right now." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchWalletState();
        setBalance(data.balance);
        setTransactions(data.transactions);
        setPayouts(data.payouts);
      } catch {
        addToast({ type: "error", message: "We couldn't load your wallet right now." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [addToast]);

  const handlePayoutRequest = async () => {
    if (!amount) {
      return;
    }

    setRequestingPayout(true);
    try {
      await walletApi.requestPayout(Number(amount));
      addToast({ type: "success", message: "Payout requested." });
      setAmount("");
      await load();
    } catch {
      addToast({ type: "error", message: "We couldn't request a payout." });
    } finally {
      setRequestingPayout(false);
    }
  };

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet and payouts</h1>
          <p className="mt-1 text-sm text-slate-500">Track earnings, monitor pending funds, and request provider payouts.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-[linear-gradient(135deg,#122649_0%,#274f8f_100%)] px-6 py-6 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/60">Available balance</p>
                <p className="mt-4 text-4xl font-semibold">{balance ? formatCurrency(balance.available) : "R0"}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs text-sky-100/65">Pending</p>
                    <p className="mt-2 text-xl font-semibold">{balance ? formatCurrency(balance.pending) : "R0"}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs text-sky-100/65">This month</p>
                    <p className="mt-2 text-xl font-semibold">{balance ? formatCurrency(balance.thisMonth) : "R0"}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs text-sky-100/65">Lifetime</p>
                    <p className="mt-2 text-xl font-semibold">{balance ? formatCurrency(balance.totalEarnings) : "R0"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request payout</CardTitle>
              <CardDescription>Move available funds into your payout queue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Amount"
                type="number"
                min={1}
                step="0.01"
                placeholder="500"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <Button onClick={() => void handlePayoutRequest()} loading={requestingPayout} disabled={!amount}>
                <Landmark className="h-4 w-4" />
                Request payout
              </Button>
              <div className="rounded-[24px] border border-white/65 bg-white/60 p-4 text-sm text-slate-500">
                Railway-backed wallet endpoints are live here, so payout requests will use the real provider wallet API.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Credits, deductions, refunds, and adjustments on your provider wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-[22px] border border-white/65 bg-white/55 animate-pulse" />
                ))
              ) : transactions.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                  No transactions yet.
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-wrap items-center gap-4 rounded-[22px] border border-white/65 bg-white/60 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/85 text-slate-500">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{transaction.description || transaction.type.replaceAll("_", " ")}</p>
                        <Badge variant={transaction.type === "PAYOUT" ? "warning" : transaction.type === "EARNING" ? "success" : "outline"}>
                          {transaction.type.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{transaction.reference}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(Number(transaction.amount))}</p>
                      {transaction.balanceAfter != null && (
                        <p className="mt-1 text-xs text-slate-400">Balance {formatCurrency(Number(transaction.balanceAfter))}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout history</CardTitle>
              <CardDescription>Your recent provider payout requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-[22px] border border-white/65 bg-white/55 animate-pulse" />
                ))
              ) : payouts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                  No payout requests submitted yet.
                </div>
              ) : (
                payouts.map((payout) => (
                  <div key={payout.id} className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{formatCurrency(Number(payout.amount))}</p>
                          <Badge variant="warning">Payout</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{payout.reference}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(payout.createdAt)}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/85 text-slate-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Wallet performance</p>
                <p className="text-sm text-slate-500">Your provider-side payout and transaction data is being pulled from the live wallet endpoints.</p>
              </div>
            </div>
            <Badge variant="info">Live wallet integration</Badge>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
