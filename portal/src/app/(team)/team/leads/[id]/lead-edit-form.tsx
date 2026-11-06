"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { updateWarmLeadAction } from "@/app/actions/leads";

export function LeadEditForm({
  leadId,
  currentStatus,
  currentAssigneeId,
  currentNotes,
  profiles,
}: {
  leadId: string;
  currentStatus: string;
  currentAssigneeId: string | null;
  currentNotes: string | null;
  profiles: { id: string; display_name: string }[];
}) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await updateWarmLeadAction(leadId, formData);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignee_id">Assignee</Label>
        <select
          id="assignee_id"
          name="assignee_id"
          defaultValue={currentAssigneeId ?? ""}
          className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
        >
          <option value="">Unassigned</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={currentNotes ?? ""}
          rows={4}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm shadow-xs"
          placeholder="Add notes about this lead..."
        />
      </div>
      <FormSubmitButton>Save changes</FormSubmitButton>
    </form>
  );
}
