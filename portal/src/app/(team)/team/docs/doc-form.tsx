"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDocAction, updateDocAction } from "@/app/actions/docs";

const CATEGORIES = ["general", "operations", "sales", "technical", "other"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

type DocFormProps =
  | { action: "create" }
  | { action: "update"; doc: { id: string; title: string; slug: string; content: string; category: string } };

export function DocForm(props: DocFormProps) {
  const isCreate = props.action === "create";
  const doc = props.action === "update" ? props.doc : null;

  const action = isCreate
    ? createDocAction
    : (formData: FormData) => updateDocAction(doc!.id, formData);

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={doc?.title}
          placeholder="Doc title"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={doc?.slug}
          placeholder="url-friendly-slug"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue={doc?.category ?? "general"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content (Markdown)</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={doc?.content}
          placeholder="Write your doc content here..."
          rows={16}
          className="font-mono text-sm"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
