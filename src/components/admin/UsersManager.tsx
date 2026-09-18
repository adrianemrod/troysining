"use client";

import { useState } from "react";
import { Loader2, UserPlus, Copy, Check, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { ROLE_LABELS } from "@/lib/roles";
import { ROLE_META } from "@/lib/status";
import { formatManilaDate } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
}

interface InviteRow {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: string;
}

const ROLES: Role[] = ["ADMIN", "SALES", "PRODUCTION", "DELIVERY", "ENCODER"];

export function UsersManager({
  initialUsers,
  initialInvites,
  currentUserId,
}: {
  initialUsers: UserRow[];
  initialInvites: InviteRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("SALES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNewLink(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send invite.");
      return;
    }
    setInvites((prev) => [{ id: data.invite.id, email: data.invite.email, role: data.invite.role, status: data.invite.status, expiresAt: data.invite.expiresAt }, ...prev]);
    setNewLink(data.inviteLink);
    setEmail("");
  }

  async function updateUser(id: string, patch: { role?: Role; isActive?: boolean }) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
    }
  }

  async function revokeInvite(id: string) {
    const res = await fetch(`/api/invites/${id}`, { method: "PATCH" });
    if (res.ok) {
      setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, status: "REVOKED" } : i)));
    }
  }

  function copyLink() {
    if (!newLink) return;
    navigator.clipboard.writeText(newLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserPlus className="h-4 w-4 text-primary" /> Invite a Teammate
        </h2>
        <form onSubmit={sendInvite} className="mt-3 flex flex-wrap items-end gap-3">
          {error && <p className="w-full text-sm text-danger">{error}</p>}
          <FieldGroup className="min-w-[220px] flex-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="newhire@troysining.ph" />
          </FieldGroup>
          <FieldGroup className="w-48">
            <Label htmlFor="invite-role">Role</Label>
            <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </FieldGroup>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Invite
          </Button>
        </form>
        {newLink && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
            <span className="truncate">{newLink}</span>
            <button type="button" onClick={copyLink} className="ml-auto shrink-0 hover:text-primary-hover">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-light">No email provider is configured in this demo — copy the link above and share it directly.</p>
      </Card>

      {invites.filter((i) => i.status === "PENDING").length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Pending Invites</h2>
          <ul className="mt-3 divide-y divide-border">
            {invites.filter((i) => i.status === "PENDING").map((invite) => (
              <li key={invite.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted">{ROLE_LABELS[invite.role]} &middot; expires {formatManilaDate(invite.expiresAt)}</p>
                </div>
                <button onClick={() => revokeInvite(invite.id)} className="flex items-center gap-1 text-xs font-medium text-danger hover:underline">
                  <XCircle className="h-3.5 w-3.5" /> Revoke
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} color={user.avatarColor} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{user.name}{isSelf && <span className="ml-1.5 text-xs text-muted">(you)</span>}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <Badge tone={ROLE_META[user.role].tone}>{ROLE_LABELS[user.role]}</Badge>
                    ) : (
                      <Select
                        value={user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value as Role })}
                        className="w-auto text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <button
                        onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                        className="inline-flex"
                      >
                        <Badge tone={user.isActive ? "success" : "danger"} className="cursor-pointer">
                          {user.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatManilaDate(user.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
