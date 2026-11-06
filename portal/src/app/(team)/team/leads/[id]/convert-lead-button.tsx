"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { convertLeadToClientAction } from "@/app/actions/leads";
import { UserPlus } from "lucide-react";

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await convertLeadToClientAction(leadId);
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      <UserPlus className="mr-2 size-4" />
      {isPending ? "Converting..." : "Convert to client"}
    </Button>
  );
}
