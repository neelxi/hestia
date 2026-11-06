import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/helpers";
import { getPortalMode } from "@/lib/portal-mode";
import { DocForm } from "../doc-form";

export default async function NewDocPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (getPortalMode() === "brokerage") redirect("/team/dashboard");

  if (profile.role !== "admin") {
    redirect("/team/docs");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Doc</h1>
        <p className="text-muted-foreground">
          Create internal documentation.
        </p>
      </div>
      <DocForm action="create" />
    </div>
  );
}
