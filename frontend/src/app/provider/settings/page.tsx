"use client";

import { useEffect, useState } from "react";
import { Bell, MapPinned, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notificationsApi, providersApi, type ProviderProfileItem, type ProviderProfileUpdatePayload } from "@/lib/api";
import { useUIStore } from "@/store/ui.store";

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  bookingUpdates: boolean;
  messages: boolean;
  promotions: boolean;
}

function verificationVariant(status?: string) {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "PENDING_REVIEW":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
      return "danger";
    default:
      return "default";
  }
}

async function fetchProviderSettingsState() {
  const [profileRes, prefsRes] = await Promise.all([
    providersApi.getProfile(),
    notificationsApi.getPrefs(),
  ]);

  return {
    profile: profileRes.data,
    prefs: prefsRes.data as NotificationPreferences,
  };
}

export default function ProviderSettingsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [provider, setProvider] = useState<ProviderProfileItem | null>(null);
  const [profileForm, setProfileForm] = useState<ProviderProfileUpdatePayload>({
    bio: "",
    city: "",
    serviceRadiusKm: 15,
    latitude: undefined,
    longitude: undefined,
    profileImageUrl: "",
  });
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    bookingUpdates: true,
    messages: true,
    promotions: false,
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { profile, prefs } = await fetchProviderSettingsState();
        setProvider(profile);
        setProfileForm({
          bio: profile.bio,
          city: profile.city,
          serviceRadiusKm: profile.serviceRadiusKm,
          latitude: profile.latitude,
          longitude: profile.longitude,
          profileImageUrl: profile.profileImageUrl ?? "",
        });
        setPrefs(prefs);
      } catch {
        addToast({ type: "error", message: "We couldn't load your provider settings." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [addToast]);

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await providersApi.update({
        ...profileForm,
        profileImageUrl: profileForm.profileImageUrl || undefined,
      });
      setProvider(response.data);
      addToast({ type: "success", message: "Provider profile updated." });
    } catch {
      addToast({ type: "error", message: "We couldn't save your provider profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePrefsSave = async () => {
    setSavingPrefs(true);
    try {
      await notificationsApi.updatePrefs(prefs);
      addToast({ type: "success", message: "Notification preferences updated." });
    } catch {
      addToast({ type: "error", message: "We couldn't save your notification preferences." });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provider settings</h1>
          <p className="mt-1 text-sm text-slate-500">Update the public provider profile customers see and control your notification preferences.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Public provider profile</CardTitle>
              <CardDescription>These details power your provider page, search visibility, and booking trust cues.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileSave}>
                <Input
                  label="Profile image URL"
                  placeholder="https://..."
                  value={profileForm.profileImageUrl ?? ""}
                  onChange={(event) => setProfileForm((current) => ({ ...current, profileImageUrl: event.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="City"
                    placeholder="Sandton"
                    value={profileForm.city}
                    onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))}
                  />
                  <Input
                    label="Service radius (km)"
                    type="number"
                    min={1}
                    max={200}
                    value={String(profileForm.serviceRadiusKm)}
                    onChange={(event) => setProfileForm((current) => ({ ...current, serviceRadiusKm: Number(event.target.value) }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Latitude"
                    type="number"
                    step="0.000001"
                    placeholder="-26.1076"
                    value={profileForm.latitude ?? ""}
                    onChange={(event) => setProfileForm((current) => ({
                      ...current,
                      latitude: event.target.value ? Number(event.target.value) : undefined,
                    }))}
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="0.000001"
                    placeholder="28.0567"
                    value={profileForm.longitude ?? ""}
                    onChange={(event) => setProfileForm((current) => ({
                      ...current,
                      longitude: event.target.value ? Number(event.target.value) : undefined,
                    }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="provider-settings-bio" className="block text-sm font-medium text-slate-700">Provider bio</label>
                  <textarea
                    id="provider-settings-bio"
                    rows={5}
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                    className="liquid-panel glass-hairline surface-ring w-full rounded-[22px] border border-white/65 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:bg-white/85 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-white"
                    placeholder="Tell customers about your specialization, response times, and coverage."
                  />
                </div>

                <Button type="submit" loading={savingProfile}>
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile preview</CardTitle>
                <CardDescription>Your current provider trust and visibility signals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar src={profileForm.profileImageUrl || undefined} name={provider?.fullName} size="xl" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-900">{provider?.fullName ?? "Provider"}</p>
                      <Badge variant={verificationVariant(provider?.verificationStatus)}>
                        {provider?.verificationStatus ?? "UNKNOWN"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{provider?.email}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserCircle2 className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.22em]">Rating</span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{provider?.averageRating.toFixed(1) ?? "0.0"}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.22em]">Reviews</span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{provider?.reviewCount ?? 0}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPinned className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.22em]">Coverage</span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{profileForm.serviceRadiusKm} km</p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/65 bg-white/60 p-4 text-sm leading-6 text-slate-600">
                  {profileForm.bio || "Your bio preview appears here once you start typing."}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose how provider updates and customer messages should reach you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-[20px] border border-white/65 bg-white/55 animate-pulse" />
                  ))
                ) : (
                  <>
                    {[
                      { key: "emailEnabled", label: "Email notifications" },
                      { key: "pushEnabled", label: "Push notifications" },
                      { key: "smsEnabled", label: "SMS notifications" },
                      { key: "bookingUpdates", label: "Booking updates" },
                      { key: "messages", label: "Messages" },
                      { key: "promotions", label: "Promotions" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between rounded-[20px] border border-white/65 bg-white/60 px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Bell className="h-4 w-4 text-slate-400" />
                          {item.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={prefs[item.key as keyof NotificationPreferences]}
                          onChange={(event) => setPrefs((current) => ({
                            ...current,
                            [item.key]: event.target.checked,
                          }))}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </label>
                    ))}
                    <Button onClick={() => void handlePrefsSave()} loading={savingPrefs}>
                      <Save className="h-4 w-4" />
                      Save preferences
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
