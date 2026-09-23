import Link from "next/link";
import { ArrowLeft, CheckCircle2, CloudOff, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { DisconnectDriveButton } from "@/components/admin/DisconnectDriveButton";
import { getDriveConnection, oauthClientConfigured } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const { connected, error } = await searchParams;
  const connection = await getDriveConnection();
  const configured = oauthClientConfigured();

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted">Connect external services used by the system.</p>
      </div>

      {connected && (
        <div className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">Google Drive connected successfully.</div>
      )}
      {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{decodeURIComponent(error)}</div>}

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HardDrive className="h-4 w-4 text-primary" /> Google Drive
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          When connected, files uploaded in File Organizer, production photos, and delivery proofs are stored in this
          Google Drive account instead of the server&apos;s disk — one folder per client.
        </p>

        {!configured ? (
          <div className="mt-4 rounded-lg bg-canvas p-3 text-sm text-muted">
            Not set up yet. Add <code className="rounded bg-border px-1 py-0.5 text-xs">GOOGLE_OAUTH_CLIENT_ID</code> and{" "}
            <code className="rounded bg-border px-1 py-0.5 text-xs">GOOGLE_OAUTH_CLIENT_SECRET</code> in Railway first.
          </div>
        ) : connection ? (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-success-soft px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Connected{connection.connectedEmail ? ` as ${connection.connectedEmail}` : ""}
            </div>
            <DisconnectDriveButton />
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CloudOff className="h-4 w-4" /> Not connected — files are stored on the server.
            </div>
            <LinkButton href="/api/integrations/google-drive/connect" size="sm">
              Connect Google Drive
            </LinkButton>
          </div>
        )}
      </Card>
    </div>
  );
}
