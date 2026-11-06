"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWarmLeadAction } from "@/app/actions/leads";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export function LeadStatusForm({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const [displayStatus, setDisplayStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const previousStatus = displayStatus;
    setDisplayStatus(value);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("status", value);
        await updateWarmLeadAction(leadId, formData);
      } catch (err) {
        if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setDisplayStatus(previousStatus);
        toast.error("Failed to update status");
      }
    });
  }

  return (
    <Select value={displayStatus} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={isPending ? "Updating…" : undefined} />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
