import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AutoUpdateTools({ onDone }) {
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const check = async () => {
    setChecking(true);
    try {
      const { data } = await base44.functions.invoke("syncAITools", {});
      if (data?.error) {
        toast({ description: data.error, variant: "destructive" });
        return;
      }
      const added = data?.created || 0;
      const updates = data?.updates?.length || 0;
      if (added || updates) {
        toast({
          description: `Added ${added} new tool${added === 1 ? "" : "s"} and posted ${updates} update note${
            updates === 1 ? "" : "s"
          } — students see it in their notifications.`,
        });
        if (added) onDone?.();
      } else {
        toast({ description: "Checked the web — nothing new worth adding right now." });
      }
    } catch (error) {
      toast({ description: "Update check failed. Please try again.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mt-8 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="font-heading font-bold text-sm">Auto tool updates</p>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
          Searches the internet for AI tools launched or updated in the last 30 days, adds the confirmed ones to the
          directory and notifies students automatically.
        </p>
      </div>
      <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={check} disabled={checking}>
        <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
        {checking ? "Checking the web..." : "Check for updates now"}
      </Button>
    </div>
  );
}