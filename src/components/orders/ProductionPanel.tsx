"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, Loader2, Factory } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { StageProgress } from "@/components/dashboard/StageProgress";
import { formatManilaDateTime } from "@/lib/utils";
import { daysLabel } from "@/lib/deadlines";
import { PRODUCTION_STAGE_ORDER, PRODUCTION_STAGE_META } from "@/lib/status";
import type { ProductionStage } from "@prisma/client";

interface StaffOption {
  id: string;
  name: string;
  avatarColor: string;
}

interface StatusLog {
  id: string;
  stage: ProductionStage;
  note: string | null;
  photoUrl: string | null;
  createdAt: string | Date;
  author: { id: string; name: string; avatarColor: string };
}

interface Job {
  id: string;
  stage: ProductionStage;
  isAtRisk: boolean;
  assignedStaff: StaffOption | null;
  statusLogs: StatusLog[];
}

const ALL_STAGES: ProductionStage[] = [...PRODUCTION_STAGE_ORDER, "COMPLETED"];

export function ProductionPanel({
  orderId,
  dueDate,
  job,
  staffOptions,
  canManage,
}: {
  orderId: string;
  dueDate: string;
  job: Job | null;
  staffOptions: StaffOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<ProductionStage>(job?.stage ?? "PENDING");
  const [assignedStaffId, setAssignedStaffId] = useState(job?.assignedStaff?.id ?? "");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("stage", stage);
    if (assignedStaffId) form.set("assignedStaffId", assignedStaffId);
    if (note) form.set("note", note);
    if (photo) form.set("photo", photo);

    const res = await fetch(`/api/orders/${orderId}/production`, { method: "PATCH", body: form });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update production status.");
      return;
    }
    setNote("");
    setPhoto(null);
    router.refresh();
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Factory className="h-4 w-4 text-primary" /> Production Tracker
        </h2>
        {job?.isAtRisk && (
          <span className="flex items-center gap-1 text-xs font-medium text-danger">
            <AlertTriangle className="h-3.5 w-3.5" /> At risk &middot; {daysLabel(dueDate)}
          </span>
        )}
      </div>

      {!job ? (
        <EmptyState
          icon={Factory}
          title="Production hasn't started"
          description={canManage ? "Kick things off by setting an initial stage below." : "This job hasn't entered the production queue yet."}
        />
      ) : (
        <div className="mt-4">
          <StageProgress stage={job.stage} />
          <div className="mt-3 flex items-center gap-2">
            <Badge tone={PRODUCTION_STAGE_META[job.stage].tone}>{PRODUCTION_STAGE_META[job.stage].label}</Badge>
            {job.assignedStaff && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Avatar name={job.assignedStaff.name} color={job.assignedStaff.avatarColor} size="xs" /> {job.assignedStaff.name}
              </span>
            )}
          </div>
        </div>
      )}

      {canManage && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-border pt-4">
          {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup>
              <Label htmlFor="stage">Update stage</Label>
              <Select id="stage" value={stage} onChange={(e) => setStage(e.target.value as ProductionStage)}>
                {ALL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {PRODUCTION_STAGE_META[s].label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="staff">Assign staff</Label>
              <Select id="staff" value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)}>
                <option value="">Unassigned</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Progress update, proof approved, etc." rows={2} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="photo">Attach photo of proof/sample (optional)</Label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
          </FieldGroup>
          <Button type="submit" disabled={loading} size="sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save update
          </Button>
        </form>
      )}

      {job && job.statusLogs.length > 0 && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Activity Timeline</p>
          <ol className="space-y-4">
            {job.statusLogs.map((log) => (
              <li key={log.id} className="flex gap-3">
                <Avatar name={log.author.name} color={log.author.avatarColor} size="xs" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{log.author.name}</span>{" "}
                    <span className="text-muted">moved to</span>{" "}
                    <Badge tone={PRODUCTION_STAGE_META[log.stage].tone}>{PRODUCTION_STAGE_META[log.stage].label}</Badge>
                  </p>
                  {log.note && <p className="mt-1 text-sm text-muted">{log.note}</p>}
                  {log.photoUrl && (
                    <a href={log.photoUrl} target="_blank" rel="noreferrer" className="mt-2 block w-fit overflow-hidden rounded-lg border border-border">
                      <Image src={log.photoUrl} alt="Production proof" width={120} height={120} className="h-24 w-24 object-cover" unoptimized />
                    </a>
                  )}
                  <p className="mt-1 text-xs text-muted-light">{formatManilaDateTime(log.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}
