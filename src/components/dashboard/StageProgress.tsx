import { cn } from "@/lib/utils";
import { PRODUCTION_STAGE_ORDER, PRODUCTION_STAGE_META } from "@/lib/status";
import type { ProductionStage } from "@prisma/client";

export function StageProgress({ stage, className }: { stage: ProductionStage; className?: string }) {
  const currentIndex = PRODUCTION_STAGE_ORDER.indexOf(stage);
  const idx = currentIndex === -1 ? PRODUCTION_STAGE_ORDER.length - 1 : currentIndex;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-1">
        {PRODUCTION_STAGE_ORDER.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < idx && "bg-primary/40",
              i === idx && "bg-accent",
              i > idx && "bg-slate-200"
            )}
            title={PRODUCTION_STAGE_META[s].label}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-muted">
        Step {Math.min(idx + 1, PRODUCTION_STAGE_ORDER.length)} of {PRODUCTION_STAGE_ORDER.length} &middot;{" "}
        <span className="text-foreground">{PRODUCTION_STAGE_META[stage].label}</span>
      </p>
    </div>
  );
}
