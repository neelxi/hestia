"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteDocAction } from "@/app/actions/docs";

export function DeleteDocButton({
  docId,
  docTitle,
}: {
  docId: string;
  docTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;
    startTransition(() => {
      deleteDocAction(docId);
    });
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="mr-2 size-4" />
      Delete
    </Button>
  );
}
