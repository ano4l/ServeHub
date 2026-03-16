"use client";

import { useEffect, useState } from "react";
import { Clock3, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { catalogApi, providersApi, type ProviderProfileItem, type ServiceOfferingItem } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useUIStore } from "@/store/ui.store";

type ServiceFormState = {
  category: string;
  serviceName: string;
  pricingType: "FIXED" | "HOURLY" | "FROM_PRICE";
  price: string;
  estimatedDurationMinutes: string;
};

const defaultServiceForm: ServiceFormState = {
  category: SERVICE_CATEGORIES[0].label,
  serviceName: "",
  pricingType: "FIXED",
  price: "",
  estimatedDurationMinutes: "60",
};

async function fetchProviderCatalogState() {
  const profileRes = await providersApi.getProfile();
  const profile = profileRes.data;
  const offeringsRes = await providersApi.getOfferings(profile.id);

  return {
    profile,
    offerings: offeringsRes.data ?? [],
  };
}

export default function ProviderServicesPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState<ProviderProfileItem | null>(null);
  const [offerings, setOfferings] = useState<ServiceOfferingItem[]>([]);
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(defaultServiceForm);

  const load = async () => {
    setLoading(true);
    try {
      const { profile, offerings } = await fetchProviderCatalogState();
      setProvider(profile);
      setOfferings(offerings);
    } catch {
      addToast({ type: "error", message: "We couldn't load your service catalog." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { profile, offerings } = await fetchProviderCatalogState();
        setProvider(profile);
        setOfferings(offerings);
      } catch {
        addToast({ type: "error", message: "We couldn't load your service catalog." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [addToast]);

  const resetForm = () => {
    setEditingOfferingId(null);
    setForm(defaultServiceForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!provider) {
      return;
    }

    setSubmitting(true);
    const payload = {
      providerId: Number(provider.id),
      category: form.category,
      serviceName: form.serviceName,
      pricingType: form.pricingType,
      price: Number(form.price),
      estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
    };

    try {
      if (editingOfferingId) {
        await catalogApi.updateOffering(editingOfferingId, payload);
        addToast({ type: "success", message: "Service updated." });
      } else {
        await catalogApi.createOffering(payload);
        addToast({ type: "success", message: "Service added." });
      }
      resetForm();
      await load();
    } catch {
      addToast({ type: "error", message: "We couldn't save that service right now." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (offering: ServiceOfferingItem) => {
    setEditingOfferingId(offering.id);
    setForm({
      category: offering.category,
      serviceName: offering.serviceName,
      pricingType: offering.pricingType as ServiceFormState["pricingType"],
      price: String(offering.price),
      estimatedDurationMinutes: String(offering.estimatedDurationMinutes),
    });
  };

  const handleDelete = async (offeringId: string) => {
    const confirmed = window.confirm("Delete this service from your catalog?");
    if (!confirmed) {
      return;
    }

    try {
      await catalogApi.deleteOffering(offeringId);
      addToast({ type: "success", message: "Service removed." });
      if (editingOfferingId === offeringId) {
        resetForm();
      }
      await load();
    } catch {
      addToast({ type: "error", message: "We couldn't delete that service." });
    }
  };

  return (
    <DashboardLayout requiredRole="PROVIDER">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Service catalog</h1>
            <p className="mt-1 text-sm text-slate-500">Publish the services customers can book and keep your pricing current.</p>
          </div>
          <Badge variant="info">{offerings.length} live service{offerings.length === 1 ? "" : "s"}</Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Your offerings</CardTitle>
              <CardDescription>These are the services customers see when they browse and book you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-[24px] border border-white/65 bg-white/55 animate-pulse" />
                ))
              ) : offerings.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                  Add your first service to start receiving bookings.
                </div>
              ) : (
                offerings.map((offering) => (
                  <div key={offering.id} className="rounded-[24px] border border-white/65 bg-white/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-900">{offering.serviceName}</h2>
                          <Badge variant="outline">{offering.category}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span>{formatCurrency(offering.price)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {offering.estimatedDurationMinutes} min
                          </span>
                          <span>{offering.pricingType.replaceAll("_", " ")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(offering)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(offering.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingOfferingId ? "Edit service" : "Add a new service"}</CardTitle>
              <CardDescription>
                {provider
                  ? `These services publish under ${provider.fullName}.`
                  : "Load your profile before adding services."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category</label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="liquid-panel glass-hairline surface-ring w-full rounded-[22px] border border-white/65 px-3.5 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                  >
                    {SERVICE_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.label}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Service name"
                  placeholder="Emergency plumbing"
                  value={form.serviceName}
                  onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="pricing-type" className="block text-sm font-medium text-slate-700">Pricing type</label>
                    <select
                      id="pricing-type"
                      value={form.pricingType}
                      onChange={(event) => setForm((current) => ({ ...current, pricingType: event.target.value as ServiceFormState["pricingType"] }))}
                      className="liquid-panel glass-hairline surface-ring w-full rounded-[22px] border border-white/65 px-3.5 py-3 text-sm text-slate-900 shadow-[0_10px_24px_rgba(64,87,130,0.12)] focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                    >
                      <option value="FIXED">Fixed</option>
                      <option value="HOURLY">Hourly</option>
                      <option value="FROM_PRICE">From price</option>
                    </select>
                  </div>

                  <Input
                    label="Price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="850"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  />
                </div>

                <Input
                  label="Estimated duration (minutes)"
                  type="number"
                  min={15}
                  step="15"
                  placeholder="60"
                  value={form.estimatedDurationMinutes}
                  onChange={(event) => setForm((current) => ({ ...current, estimatedDurationMinutes: event.target.value }))}
                />

                <div className="rounded-[24px] border border-white/65 bg-white/60 p-4 text-sm text-slate-500">
                  <p className="font-medium text-slate-700">Preview</p>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/70 bg-white/80 text-slate-500">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{form.serviceName || "Your service name"}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{form.category}</p>
                      <p className="mt-2">
                        {form.price ? formatCurrency(Number(form.price)) : "Set a price"} · {form.pricingType.replaceAll("_", " ")} · {form.estimatedDurationMinutes || "0"} min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" loading={submitting} disabled={!provider || !form.serviceName || !form.price}>
                    <Plus className="h-4 w-4" />
                    {editingOfferingId ? "Save changes" : "Add service"}
                  </Button>
                  {editingOfferingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
