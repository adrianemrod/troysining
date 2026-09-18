"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Truck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select, Input, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatManilaDate } from "@/lib/utils";
import { DELIVERY_STATUS_META } from "@/lib/status";
import type { DeliveryMethod, DeliveryStatus } from "@prisma/client";

interface RiderOption {
  id: string;
  name: string;
  avatarColor: string;
}

interface DeliveryData {
  id: string;
  method: DeliveryMethod;
  status: DeliveryStatus;
  deliveryDate: string | Date | null;
  address: string | null;
  notes: string | null;
  proofUrl: string | null;
  rider: RiderOption | null;
}

const METHOD_LABELS: Record<DeliveryMethod, string> = {
  PICKUP: "Client Pickup",
  IN_HOUSE: "In-house Delivery",
  COURIER: "3rd-party Courier",
};

export function DeliveryPanel({
  orderId,
  delivery,
  riderOptions,
  canManage,
  defaultAddress,
}: {
  orderId: string;
  delivery: DeliveryData | null;
  riderOptions: RiderOption[];
  canManage: boolean;
  defaultAddress: string | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<DeliveryMethod>(delivery?.method ?? "PICKUP");
  const [status, setStatus] = useState<DeliveryStatus>(delivery?.status ?? "PREPARING");
  const [riderId, setRiderId] = useState(delivery?.rider?.id ?? "");
  const [deliveryDate, setDeliveryDate] = useState(
    delivery?.deliveryDate ? new Date(delivery.deliveryDate).toISOString().slice(0, 10) : ""
  );
  const [address, setAddress] = useState(delivery?.address ?? defaultAddress ?? "");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("method", method);
    form.set("status", status);
    if (riderId) form.set("riderId", riderId);
    if (deliveryDate) form.set("deliveryDate", deliveryDate);
    if (address) form.set("address", address);
    if (notes) form.set("notes", notes);
    if (proof) form.set("proof", proof);

    const res = await fetch(`/api/orders/${orderId}/delivery`, { method: "PATCH", body: form });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update delivery.");
      return;
    }
    setNotes("");
    setProof(null);
    router.refresh();
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Truck className="h-4 w-4 text-primary" /> Delivery
        </h2>
        {delivery && <Badge tone={DELIVERY_STATUS_META[delivery.status].tone}>{DELIVERY_STATUS_META[delivery.status].label}</Badge>}
      </div>

      {!delivery && !canManage && <EmptyState icon={Truck} title="No delivery arranged yet" />}

      {delivery && (
        <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <p><span className="text-foreground font-medium">Method:</span> {METHOD_LABELS[delivery.method]}</p>
          {delivery.deliveryDate && <p><span className="text-foreground font-medium">Date:</span> {formatManilaDate(delivery.deliveryDate)}</p>}
          {delivery.rider && (
            <p className="flex items-center gap-1.5"><span className="text-foreground font-medium">Rider:</span> <Avatar name={delivery.rider.name} color={delivery.rider.avatarColor} size="xs" /> {delivery.rider.name}</p>
          )}
          {delivery.address && <p className="sm:col-span-2"><span className="text-foreground font-medium">Address:</span> {delivery.address}</p>}
          {delivery.notes && <p className="sm:col-span-2"><span className="text-foreground font-medium">Notes:</span> {delivery.notes}</p>}
          {delivery.proofUrl && (
            <a href={delivery.proofUrl} target="_blank" rel="noreferrer" className="sm:col-span-2 mt-1 block w-fit overflow-hidden rounded-lg border border-border">
              <Image src={delivery.proofUrl} alt="Proof of delivery" width={140} height={140} className="h-28 w-28 object-cover" unoptimized />
            </a>
          )}
        </div>
      )}

      {canManage && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-border pt-4">
          {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup>
              <Label htmlFor="method">Delivery method</Label>
              <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as DeliveryMethod)}>
                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as DeliveryStatus)}>
                {Object.entries(DELIVERY_STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="rider">Rider / Driver</Label>
              <Select id="rider" value={riderId} onChange={(e) => setRiderId(e.target.value)}>
                <option value="">Unassigned</option>
                {riderOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="deliveryDate">Delivery date</Label>
              <Input id="deliveryDate" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label htmlFor="address">Delivery address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="dnotes">Notes (optional)</Label>
            <Textarea id="dnotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="proof">Proof of delivery (photo/e-signature)</Label>
            <input
              id="proof"
              type="file"
              accept="image/*"
              onChange={(e) => setProof(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
          </FieldGroup>
          <Button type="submit" disabled={loading} size="sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save delivery update
          </Button>
        </form>
      )}
    </Card>
  );
}
