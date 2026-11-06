"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  convertApplicationToLeadAction,
  convertApplicationToClientAction,
} from "@/app/actions/applications";
import { UserPlus, Users } from "lucide-react";

export function ConvertApplicationButtons({
  applicationId,
}: {
  applicationId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleConvertToLead() {
    startTransition(async () => {
      await convertApplicationToLeadAction(applicationId);
    });
  }

  function handleConvertToClient() {
    startTransition(async () => {
      await convertApplicationToClientAction(applicationId);
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleConvertToLead}
        disabled={isPending}
      >
        <UserPlus className="mr-2 size-4" />
        Convert to lead
      </Button>
      <Button onClick={handleConvertToClient} disabled={isPending}>
        <Users className="mr-2 size-4" />
        Convert to client
      </Button>
    </div>
  );
}
