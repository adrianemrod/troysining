"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Field";
import { LEAD_STAGE_META } from "@/lib/status";
import type { LeadStage, ClientType } from "@prisma/client";

export function LeadStageEditor({ clientId, initialStage, initialType }: { clientId: string; initialStage: LeadStage; initialType: ClientType }) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [type, setType] = useState(initialType);
  const [saving, setSaving] = useState(false);

  async function update(field: "leadStage" | "clientType", value: string) {
    setSaving(true);
    await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={stage}
        onChange={(e) => {
          setStage(e.target.value as LeadStage);
          update("leadStage", e.target.value);
        }}
        className="w-auto"
        disabled={saving}
      >
        {Object.entries(LEAD_STAGE_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </Select>
      <Select
        value={type}
        onChange={(e) => {
          setType(e.target.value as ClientType);
          update("clientType", e.target.value);
        }}
        className="w-auto"
        disabled={saving}
      >
        <option value="ONE_TIME">One-time</option>
        <option value="REPEAT">Repeat Customer</option>
      </Select>
    </div>
  );
}
