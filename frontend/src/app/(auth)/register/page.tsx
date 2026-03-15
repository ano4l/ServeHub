"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Briefcase, Eye, EyeOff, User, Wrench } from "lucide-react";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { USER_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^0[67]\d{8}$/, "Enter a valid South African phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER]),
});

type FormData = z.infer<typeof schema>;
type RegistrationRole = typeof USER_ROLES.CUSTOMER | typeof USER_ROLES.PROVIDER;

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? "Registration failed. Please try again.";
  }
  return "Registration failed. Please try again.";
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [showPass, setShowPass] = useState(false);
  const preselectedRole = searchParams.get("role");
  const initialRole: RegistrationRole = preselectedRole === USER_ROLES.PROVIDER ? USER_ROLES.PROVIDER : USER_ROLES.CUSTOMER;
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>(initialRole);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: initialRole },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data);
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

  const roleField = register("role");

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
              Join the trusted
              <br />
              service marketplace
            </h2>
            <p className="text-stone-400">Create your account to start booking or offering services.</p>
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
            <h1 className="text-2xl font-bold text-stone-900">Create account</h1>
            <p className="text-sm text-stone-500 mt-1">Join thousands of customers and providers</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Account type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: USER_ROLES.CUSTOMER, label: "Customer", icon: User, desc: "Book services" },
                { value: USER_ROLES.PROVIDER, label: "Provider", icon: Briefcase, desc: "Offer services" },
              ].map((option) => {
                const Icon = option.icon;
                const selected = selectedRole === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? "border-stone-900 bg-stone-900/5" : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      name={roleField.name}
                      ref={roleField.ref}
                      onBlur={roleField.onBlur}
                      onChange={(event) => {
                        roleField.onChange(event);
                        const value = event.target.value as RegistrationRole;
                        setSelectedRole(value);
                        setValue("role", value, { shouldValidate: true });
                      }}
                      className="sr-only"
                    />
                    <Icon className={`h-5 w-5 ${selected ? "text-stone-900" : "text-stone-400"}`} />
                    <span className={`text-xs font-medium ${selected ? "text-stone-900" : "text-stone-500"}`}>{option.label}</span>
                    <span className={`text-[10px] ${selected ? "text-stone-600" : "text-stone-400"}`}>{option.desc}</span>
                  </label>
                );
              })}
            </div>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" placeholder="John" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last name" placeholder="Doe" error={errors.lastName?.message} {...register("lastName")} />
            </div>
            <Input label="Email address" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
            <Input label="Phone number" type="tel" placeholder="0712345678" error={errors.phone?.message} {...register("phone")} />
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
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs text-stone-400 bg-stone-50 px-3">Already have an account?</div>
          </div>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-white hover:border-stone-300 transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
