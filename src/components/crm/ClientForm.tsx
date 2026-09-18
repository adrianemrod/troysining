"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { CLIENT_TYPE_META, LEAD_STAGE_META } from "@/lib/status";
import type { ClientType, LeadStage } from "@prisma/client";

interface SalesOption {
  id: string;
  name: string;
}

export function ClientForm({ salesOptions, currentUserId, isAdmin }: { salesOptions: SalesOption[]; currentUserId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [fbHandle, setFbHandle] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [clientType, setClientType] = useState<ClientType>("ONE_TIME");
  const [leadStage, setLeadStage] = useState<LeadStage>("NEW_INQUIRY");
  const [salesOwnerId, setSalesOwnerId] = useState(currentUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessName, contactNumber, fbHandle, email, address, clientType, leadStage, salesOwnerId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create client.");
      return;
    }
    router.push(`/crm/${data.client.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="name" required>Contact person name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Golden" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Golden Crust Bakery" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactNumber">Contact number</Label>
          <Input id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="0917-234-5678" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="fbHandle">Facebook Page / Messenger</Label>
          <Input id="fbHandle" value={fbHandle} onChange={(e) => setFbHandle(e.target.value)} placeholder="fb.com/yourpage" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, Province" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="clientType">Client type</Label>
          <Select id="clientType" value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)}>
            {Object.entries(CLIENT_TYPE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="leadStage">Lead stage</Label>
          <Select id="leadStage" value={leadStage} onChange={(e) => setLeadStage(e.target.value as LeadStage)}>
            {Object.entries(LEAD_STAGE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </FieldGroup>
        {isAdmin && (
          <FieldGroup>
            <Label htmlFor="salesOwner">Sales owner</Label>
            <Select id="salesOwner" value={salesOwnerId} onChange={(e) => setSalesOwnerId(e.target.value)}>
              {salesOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FieldGroup>
        )}
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save client
      </Button>
    </form>
  );
}
