"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DisconnectDriveButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Drive? New uploads will go back to server storage until you reconnect.")) return;
    setLoading(true);
    await fetch("/api/integrations/google-drive/disconnect", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDisconnect} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
      Disconnect
    </Button>
  );
}
