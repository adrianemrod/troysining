import { getSession } from "@/lib/auth";
import { OutsCalculator } from "@/components/outs/OutsCalculator";

export default async function OutsPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Outs Number</h1>
        <p className="mt-1 text-sm text-muted">
          Figure out how many pieces you can cut from a paper sheet — set the sheet size, bleed, and the item size.
        </p>
      </div>
      <OutsCalculator />
    </div>
  );
}
