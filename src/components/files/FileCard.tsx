import Image from "next/image";
import { FileText, File as FileIcon, History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatManilaDate } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const CATEGORY_META: Record<string, { label: string; tone: Tone }> = {
  DESIGN: { label: "Design File", tone: "info" },
  PROOF: { label: "Proof", tone: "accent" },
  FINAL: { label: "Approved Final", tone: "success" },
  QUOTATION: { label: "Quotation", tone: "accent" },
  CONTRACT: { label: "Contract", tone: "neutral" },
  FB_SCREENSHOT: { label: "FB Screenshot", tone: "warning" },
  OTHER: { label: "Other", tone: "neutral" },
};

interface FileRow {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  category: string;
  version: number;
  createdAt: string | Date;
  uploadedBy: { name: string };
}

function isImage(mimeType: string | null) {
  return mimeType?.startsWith("image/") ?? false;
}
function isPdf(mimeType: string | null) {
  return mimeType === "application/pdf";
}

export function FileCard({ file }: { file: FileRow }) {
  const meta = CATEGORY_META[file.category] ?? CATEGORY_META.OTHER;

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="flex h-32 items-center justify-center overflow-hidden bg-canvas">
        {isImage(file.mimeType) ? (
          <Image src={file.url} alt={file.filename} width={200} height={128} className="h-full w-full object-cover" unoptimized />
        ) : isPdf(file.mimeType) ? (
          <FileText className="h-10 w-10 text-muted-light" />
        ) : (
          <FileIcon className="h-10 w-10 text-muted-light" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-accent">{file.filename}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {file.version > 1 && (
            <Badge tone="neutral" className="gap-1">
              <History className="h-3 w-3" /> v{file.version}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-light">
          {file.uploadedBy.name} &middot; {formatManilaDate(file.createdAt)}
        </p>
      </div>
    </a>
  );
}
