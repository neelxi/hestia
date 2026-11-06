"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaskStatusAction } from "@/app/actions/tasks";

const HESTIA_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const BROKERAGE_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "compliance_review", label: "Compliance Review" },
  { value: "done", label: "Done" },
];

export function TaskStatusForm({
  taskId,
  currentStatus,
  isBrokerage = false,
}: {
  taskId: string;
  currentStatus: string;
  isBrokerage?: boolean;
}) {
  const router = useRouter();
  const [displayStatus, setDisplayStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const previousStatus = displayStatus;
    setDisplayStatus(value);

    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, value);
        router.refresh();
      } catch {
        setDisplayStatus(previousStatus);
        toast.error("Failed to update status");
      }
    });
  }

  return (
    <Select value={displayStatus} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(isBrokerage ? BROKERAGE_STATUSES : HESTIA_STATUSES).map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
