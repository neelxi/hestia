"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { archiveClientAction } from "@/app/actions/clients";
import { getClientLabel } from "@/lib/terminology";

function ArchiveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Archiving..." : "Archive"}
    </Button>
  );
}

export function ArchiveClientForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const label = getClientLabel(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          Archive
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={() => archiveClientAction(clientId)}>
          <DialogHeader>
            <DialogTitle>Archive {label}?</DialogTitle>
            <DialogDescription>
              This will set the {label.toLowerCase()} status to inactive. You can restore them later by editing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <ArchiveButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
