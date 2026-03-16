"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CreditCard,
  MapPinned,
  Save,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  customerApi,
  notificationsApi,
  type CustomerAddressItem,
  type CustomerProfileItem,
  type SavedPaymentMethodItem,
} from "@/lib/api";
import { useUIStore } from "@/store/ui.store";

interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  bookingUpdates: boolean;
  messages: boolean;
  promotions: boolean;
}

type AddressFormState = {
  label: string;
  value: string;
  note: string;
};

type PaymentMethodFormState = {
  holderName: string;
  cardNumber: string;
  expiry: string;
};

const emptyAddressForm: AddressFormState = {
  label: "",
  value: "",
  note: "",
};

const emptyPaymentMethodForm: PaymentMethodFormState = {
  holderName: "",
  cardNumber: "",
  expiry: "",
};

async function fetchCustomerSettingsState() {
  const [profileRes, addressesRes, methodsRes, prefsRes] = await Promise.all([
    customerApi.getProfile(),
    customerApi.getAddresses(),
    customerApi.getPaymentMethods(),
    notificationsApi.getPrefs(),
  ]);

  return {
    profile: profileRes.data,
    addresses: addressesRes.data,
    paymentMethods: methodsRes.data,
    prefs: prefsRes.data as NotificationPreferences,
  };
}

export default function CustomerSettingsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);
  const [profile, setProfile] = useState<CustomerProfileItem | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
  });
  const [addresses, setAddresses] = useState<CustomerAddressItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethodItem[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    bookingUpdates: true,
    messages: true,
    promotions: false,
  });
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddressForm);
  const [paymentMethodForm, setPaymentMethodForm] =
    useState<PaymentMethodFormState>(emptyPaymentMethodForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const state = await fetchCustomerSettingsState();
      setProfile(state.profile);
      setProfileForm({
        fullName: state.profile.fullName,
        email: state.profile.email,
        phoneNumber: state.profile.phoneNumber,
        avatarUrl: state.profile.avatarUrl ?? "",
      });
      setAddresses(state.addresses);
      setPaymentMethods(state.paymentMethods);
      setPrefs(state.prefs);
    } catch {
      addToast({ type: "error", message: "We couldn't load your customer settings." });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await customerApi.updateProfile({
        ...profileForm,
        avatarUrl: profileForm.avatarUrl || undefined,
      });
      setProfile(response.data);
      addToast({ type: "success", message: "Profile updated." });
    } catch {
      addToast({ type: "error", message: "We couldn't save your profile." });
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

  const handleAddressCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAddress(true);
    try {
      const response = await customerApi.createAddress({
        label: addressForm.label,
        value: addressForm.value,
        note: addressForm.note || undefined,
      });
      setAddresses((current) => [response.data, ...current.filter((item) => !item.defaultAddress)]);
      setAddressForm(emptyAddressForm);
      await load();
      addToast({ type: "success", message: "Address saved." });
    } catch {
      addToast({ type: "error", message: "We couldn't save that address." });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleAddressDelete = async (addressId: string) => {
    try {
      await customerApi.deleteAddress(addressId);
      setAddresses((current) => current.filter((item) => item.id !== addressId));
      await load();
      addToast({ type: "success", message: "Address removed." });
    } catch {
      addToast({ type: "error", message: "We couldn't remove that address." });
    }
  };

  const handleAddressDefault = async (address: CustomerAddressItem) => {
    try {
      await customerApi.updateAddress(address.id, {
        label: address.label,
        value: address.value,
        note: address.note,
        defaultAddress: true,
      });
      await load();
      addToast({ type: "success", message: "Default address updated." });
    } catch {
      addToast({ type: "error", message: "We couldn't update the default address." });
    }
  };

  const handlePaymentMethodCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPaymentMethod(true);
    try {
      const response = await customerApi.createPaymentMethod({
        holderName: paymentMethodForm.holderName,
        cardNumber: paymentMethodForm.cardNumber,
        expiry: paymentMethodForm.expiry,
      });
      setPaymentMethods((current) => [
        response.data,
        ...current.filter((item) => !item.defaultMethod),
      ]);
      setPaymentMethodForm(emptyPaymentMethodForm);
      await load();
      addToast({ type: "success", message: "Payment method saved." });
    } catch {
      addToast({ type: "error", message: "We couldn't save that payment method." });
    } finally {
      setSavingPaymentMethod(false);
    }
  };

  const handlePaymentMethodDelete = async (paymentMethodId: string) => {
    try {
      await customerApi.deletePaymentMethod(paymentMethodId);
      setPaymentMethods((current) => current.filter((item) => item.id !== paymentMethodId));
      await load();
      addToast({ type: "success", message: "Payment method removed." });
    } catch {
      addToast({ type: "error", message: "We couldn't remove that payment method." });
    }
  };

  const handlePaymentMethodDefault = async (paymentMethodId: string) => {
    try {
      await customerApi.updatePaymentMethod(paymentMethodId, { defaultMethod: true });
      await load();
      addToast({ type: "success", message: "Default payment method updated." });
    } catch {
      addToast({
        type: "error",
        message: "We couldn't update the default payment method.",
      });
    }
  };

  return (
    <DashboardLayout requiredRole="CUSTOMER">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep your profile, saved locations, payment methods, and notifications up to date.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                These details power your customer account and booking confirmations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileSave}>
                <Input
                  label="Avatar URL"
                  placeholder="https://..."
                  value={profileForm.avatarUrl}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      avatarUrl: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Full name"
                  placeholder="Ano Dzinotyiwei"
                  value={profileForm.fullName}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="+27 82 555 0134"
                    value={profileForm.phoneNumber}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit" loading={savingProfile}>
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account snapshot</CardTitle>
              <CardDescription>
                Quick visibility into the customer profile the platform is using right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-white/65 bg-white/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/80 text-slate-500">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {profile?.fullName || profileForm.fullName || "Customer profile"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {profile?.email || profileForm.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Addresses
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{addresses.length}</p>
                </div>
                <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Cards
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {paymentMethods.length}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/65 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Status
                  </p>
                  <div className="mt-3">
                    <Badge variant="success">Live account</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Saved addresses</CardTitle>
              <CardDescription>
                Use saved locations to speed up booking checkout for at-home services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[24px] border border-white/65 bg-white/55"
                  />
                ))
              ) : addresses.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                  No saved addresses yet.
                </div>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-[24px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{address.label}</p>
                          {address.defaultAddress ? (
                            <Badge variant="success">Default</Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{address.value}</p>
                        {address.note ? (
                          <p className="mt-1 text-xs text-slate-400">{address.note}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        {!address.defaultAddress ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleAddressDefault(address)}
                          >
                            <MapPinned className="h-4 w-4" />
                            Make default
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleAddressDelete(address.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <form className="space-y-4 rounded-[24px] border border-white/65 bg-white/60 p-4" onSubmit={handleAddressCreate}>
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-slate-500" />
                  <p className="font-semibold text-slate-900">Add an address</p>
                </div>
                <Input
                  label="Label"
                  placeholder="Home"
                  value={addressForm.label}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Address"
                  placeholder="83 Rivonia Road, Sandton"
                  value={addressForm.value}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Note"
                  placeholder="Gate code, unit, landmark"
                  value={addressForm.note}
                  onChange={(event) =>
                    setAddressForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
                <Button
                  type="submit"
                  loading={savingAddress}
                  disabled={!addressForm.label || !addressForm.value}
                >
                  <Save className="h-4 w-4" />
                  Save address
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved payment methods</CardTitle>
              <CardDescription>
                Cards are stored as lightweight customer records for faster repeat bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[24px] border border-white/65 bg-white/55"
                  />
                ))
              ) : paymentMethods.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                  No payment methods saved yet.
                </div>
              ) : (
                paymentMethods.map((method) => (
                  <div key={method.id} className="rounded-[24px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {method.brand} ending in {method.last4}
                          </p>
                          {method.defaultMethod ? (
                            <Badge variant="success">Default</Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{method.holderName}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Expires {method.expiry}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!method.defaultMethod ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handlePaymentMethodDefault(method.id)}
                          >
                            <CreditCard className="h-4 w-4" />
                            Make default
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handlePaymentMethodDelete(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <form className="space-y-4 rounded-[24px] border border-white/65 bg-white/60 p-4" onSubmit={handlePaymentMethodCreate}>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <p className="font-semibold text-slate-900">Add a payment method</p>
                </div>
                <Input
                  label="Cardholder name"
                  placeholder="Ano Dzinotyiwei"
                  value={paymentMethodForm.holderName}
                  onChange={(event) =>
                    setPaymentMethodForm((current) => ({
                      ...current,
                      holderName: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Card number"
                  placeholder="4242 4242 4242 4242"
                  value={paymentMethodForm.cardNumber}
                  onChange={(event) =>
                    setPaymentMethodForm((current) => ({
                      ...current,
                      cardNumber: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Expiry"
                  placeholder="12/28"
                  value={paymentMethodForm.expiry}
                  onChange={(event) =>
                    setPaymentMethodForm((current) => ({
                      ...current,
                      expiry: event.target.value,
                    }))
                  }
                />
                <Button
                  type="submit"
                  loading={savingPaymentMethod}
                  disabled={
                    !paymentMethodForm.holderName ||
                    !paymentMethodForm.cardNumber ||
                    !paymentMethodForm.expiry
                  }
                >
                  <Save className="h-4 w-4" />
                  Save payment method
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose which booking and message updates should reach you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "emailEnabled", label: "Email alerts" },
              { key: "pushEnabled", label: "Push notifications" },
              { key: "smsEnabled", label: "SMS notifications" },
              { key: "bookingUpdates", label: "Booking updates" },
              { key: "messages", label: "Messages" },
              { key: "promotions", label: "Promotions" },
            ].map((item) => {
              const checked = prefs[item.key as keyof NotificationPreferences];

              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-[20px] border border-white/65 bg-white/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/70 bg-white/80 text-slate-500">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      setPrefs((current) => ({
                        ...current,
                        [item.key]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </label>
              );
            })}

            <Button onClick={() => void handlePrefsSave()} loading={savingPrefs}>
              <Save className="h-4 w-4" />
              Save notification preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
