"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Wrench } from "lucide-react";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Invalid email or password";
  }
  return "Invalid email or password";
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      setAuth(user, accessToken, refreshToken);
      const dest = user.roles.includes("ADMIN") ? "/admin" : user.roles.includes("PROVIDER") ? "/provider" : "/dashboard";
      router.replace(dest);
    } catch (error: unknown) {
      addToast({ type: "error", message: getErrorMessage(error) });
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-stone-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(163,230,53,0.12),_transparent_60%)]" />
        <Link href="/" className="relative flex items-center gap-2 w-fit">
          <div className="h-9 w-9 rounded-xl bg-lime-400 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-stone-900" />
          </div>
          <span className="text-white font-bold text-lg">Serveify</span>
        </Link>
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Welcome back to
              <br />
              your marketplace
            </h2>
            <p className="text-stone-400">Sign in to manage your bookings, messages and earnings.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: "200k+", label: "Jobs completed" },
              { val: "4.8*", label: "Average rating" },
              { val: "8k+", label: "Active providers" },
              { val: "< 2min", label: "Avg. booking time" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.val}</p>
                <p className="text-xs text-stone-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-stone-500">Copyright 2026 Serveify. Enterprise Marketplace Platform.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-stone-900 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-lime-400" />
            </div>
            <span className="font-bold text-stone-900">Serveify</span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-stone-900">Sign in</h1>
            <p className="text-sm text-stone-500 mt-1">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="........"
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPass((value) => !value)} className="text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register("password")}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                <input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-stone-700 hover:text-stone-900 font-medium">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs text-stone-400 bg-stone-50 px-3">Don&apos;t have an account?</div>
          </div>

          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-white hover:border-stone-300 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
