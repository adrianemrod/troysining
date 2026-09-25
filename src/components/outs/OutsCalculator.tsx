"use client";

import { useMemo, useState } from "react";
import { Grid3x3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

interface SizePreset {
  label: string;
  width: number;
  height: number;
}

const SHEET_PRESETS: SizePreset[] = [
  { label: "Short Bond (8.5×11)", width: 8.5, height: 11 },
  { label: "Long Bond (8.5×13)", width: 8.5, height: 13 },
  { label: "A4 (8.27×11.69)", width: 8.27, height: 11.69 },
  { label: "A3 (11.69×16.54)", width: 11.69, height: 16.54 },
  { label: "23×35", width: 23, height: 35 },
  { label: "22×34", width: 22, height: 34 },
];

const ITEM_PRESETS: SizePreset[] = [
  { label: "Calling Card (3.5×2)", width: 3.5, height: 2 },
  { label: "ID Size (2×3)", width: 2, height: 3 },
  { label: "A6 Flyer (4.13×5.83)", width: 4.13, height: 5.83 },
  { label: "A5 Flyer (5.83×8.27)", width: 5.83, height: 8.27 },
];

const MAX_PREVIEW_CELLS = 300;

function toNumber(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function OutsCalculator() {
  const [sheetWidth, setSheetWidth] = useState("23");
  const [sheetHeight, setSheetHeight] = useState("35");
  const [bleed, setBleed] = useState("0.125");
  const [itemWidth, setItemWidth] = useState("3");
  const [itemHeight, setItemHeight] = useState("4");
  const [quantity, setQuantity] = useState("");

  const result = useMemo(() => {
    const sw = toNumber(sheetWidth);
    const sh = toNumber(sheetHeight);
    const b = Math.max(0, toNumber(bleed));
    const iw = toNumber(itemWidth);
    const ih = toNumber(itemHeight);

    if (sw <= 0 || sh <= 0 || iw <= 0 || ih <= 0) return null;

    const effW = iw + b * 2;
    const effH = ih + b * 2;
    if (effW <= 0 || effH <= 0) return null;

    const colsNormal = Math.floor(sw / effW);
    const rowsNormal = Math.floor(sh / effH);
    const outsNormal = colsNormal * rowsNormal;

    const colsRotated = Math.floor(sw / effH);
    const rowsRotated = Math.floor(sh / effW);
    const outsRotated = colsRotated * rowsRotated;

    const rotated = outsRotated > outsNormal;
    const cols = rotated ? colsRotated : colsNormal;
    const rows = rotated ? rowsRotated : rowsNormal;
    const outs = rotated ? outsRotated : outsNormal;

    const sheetArea = sw * sh;
    const usedArea = outs * iw * ih;
    const yieldPct = sheetArea > 0 ? (usedArea / sheetArea) * 100 : 0;

    const qty = toNumber(quantity);
    const sheetsNeeded = qty > 0 && outs > 0 ? Math.ceil(qty / outs) : null;

    return { outs, cols, rows, rotated, outsNormal, outsRotated, yieldPct, sheetsNeeded, effW, effH };
  }, [sheetWidth, sheetHeight, bleed, itemWidth, itemHeight, quantity]);

  const previewCells = result ? Math.min(result.cols * result.rows, MAX_PREVIEW_CELLS) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <Label>Paper sheet size (in)</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label htmlFor="sheetWidth">Width</Label>
              <Input id="sheetWidth" type="number" min="0" step="0.01" value={sheetWidth} onChange={(e) => setSheetWidth(e.target.value)} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="sheetHeight">Height</Label>
              <Input id="sheetHeight" type="number" min="0" step="0.01" value={sheetHeight} onChange={(e) => setSheetHeight(e.target.value)} />
            </FieldGroup>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SHEET_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setSheetWidth(String(p.width));
                  setSheetHeight(String(p.height));
                }}
                className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <FieldGroup>
          <Label htmlFor="bleed">Bleed per side (in)</Label>
          <Input id="bleed" type="number" min="0" step="0.001" value={bleed} onChange={(e) => setBleed(e.target.value)} />
        </FieldGroup>

        <div>
          <Label>Item / project size (in)</Label>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label htmlFor="itemWidth">Width</Label>
              <Input id="itemWidth" type="number" min="0" step="0.01" value={itemWidth} onChange={(e) => setItemWidth(e.target.value)} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="itemHeight">Height</Label>
              <Input id="itemHeight" type="number" min="0" step="0.01" value={itemHeight} onChange={(e) => setItemHeight(e.target.value)} />
            </FieldGroup>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ITEM_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setItemWidth(String(p.width));
                  setItemHeight(String(p.height));
                }}
                className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <FieldGroup>
          <Label htmlFor="quantity">Quantity needed (optional)</Label>
          <Input id="quantity" type="number" min="0" step="1" placeholder="e.g. 500" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </FieldGroup>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Grid3x3 className="h-4 w-4 text-primary" /> Result
        </h2>

        {!result ? (
          <p className="mt-4 text-sm text-muted">Fill in the sheet size and item size to see how many outs you get.</p>
        ) : result.outs === 0 ? (
          <p className="mt-4 text-sm text-danger">
            The item (with bleed) doesn&apos;t fit on this sheet at all. Try a smaller item, less bleed, or a bigger sheet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-primary-soft px-4 py-3">
              <p className="text-xs font-medium text-primary/80">Outs per sheet</p>
              <p className="text-3xl font-bold text-primary">{result.outs}</p>
              <p className="mt-0.5 text-xs text-primary/80">
                {result.cols} across &times; {result.rows} down {result.rotated && "(item rotated 90°)"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Not rotated</p>
                <p className="font-semibold text-foreground">{result.outsNormal} outs</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Rotated 90°</p>
                <p className="font-semibold text-foreground">{result.outsRotated} outs</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Item + bleed</p>
                <p className="font-semibold text-foreground">
                  {result.effW.toFixed(3)}&quot; &times; {result.effH.toFixed(3)}&quot;
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted">Paper used</p>
                <p className="font-semibold text-foreground">{result.yieldPct.toFixed(1)}%</p>
              </div>
            </div>

            {result.sheetsNeeded != null && (
              <div className="rounded-lg bg-success-soft px-4 py-3">
                <p className="text-xs font-medium text-success">Sheets needed for {quantity} pcs</p>
                <p className="text-2xl font-bold text-success">{result.sheetsNeeded}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Layout preview</p>
              <div
                className="grid gap-0.5 rounded-lg border border-dashed border-border bg-canvas p-2"
                style={{ gridTemplateColumns: `repeat(${result.cols}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: previewCells }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-sm bg-primary/25" />
                ))}
              </div>
              {result.cols * result.rows > MAX_PREVIEW_CELLS && (
                <p className="mt-1 text-xs text-muted-light">Preview capped — actual layout is {result.cols}×{result.rows}.</p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
