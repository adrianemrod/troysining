import Link from "next/link";
import { FolderOpen, Search, Folder } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { FileCard } from "@/components/files/FileCard";
import { UploadFileForm } from "@/components/files/UploadFileForm";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ q?: string; client?: string }> }) {
  const { q, client: selectedClientId } = await searchParams;
  const session = await getSession();
  if (!session) return null;

  const where: Prisma.ClientWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { businessName: { contains: q, mode: "insensitive" } },
          { contactNumber: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { files: true } } },
    orderBy: { name: "asc" },
  });

  const activeClientId = selectedClientId ?? clients.find((c) => c._count.files > 0)?.id;
  const activeClient = activeClientId
    ? await prisma.client.findUnique({
        where: { id: activeClientId },
        include: {
          files: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  const canUpload = ["ADMIN", "SALES", "PRODUCTION", "DELIVERY", "ENCODER"].includes(session.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-foreground">File Organizer</h1>
        <p className="mt-1 text-sm text-muted">Design files, proofs, contracts, and FB screenshots — organized per client.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <form action="/files" method="GET" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-light" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search client or contact #"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </form>

          <div className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-border bg-surface p-2">
            {clients.length === 0 ? (
              <p className="p-3 text-sm text-muted">No clients found.</p>
            ) : (
              clients.map((c) => (
                <Link
                  key={c.id}
                  href={`/files?client=${c.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    activeClientId === c.id ? "bg-primary-soft text-primary font-medium" : "text-foreground hover:bg-canvas"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Folder className="h-4 w-4 shrink-0" />
                    <span className="truncate">{c.businessName || c.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-light">{c._count.files}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          {!activeClient ? (
            <EmptyState
              icon={FolderOpen}
              title="Select a client to view their files"
              description="Search by client name or contact number, then choose a folder on the left."
            />
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">{activeClient.businessName || activeClient.name}</h2>
                {activeClient.contactNumber && <p className="text-sm text-muted">{activeClient.contactNumber}</p>}
              </div>

              {canUpload && <UploadFileForm clientId={activeClient.id} />}

              {activeClient.files.length === 0 ? (
                <EmptyState title="No files yet" description="Uploaded design files, proofs, and documents will show up here." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeClient.files.map((f) => (
                    <FileCard key={f.id} file={{ ...f, createdAt: f.createdAt.toISOString() }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
