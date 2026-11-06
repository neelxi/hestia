import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mic } from "lucide-react";

export default async function ClientMeetingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">No client record found</h2>
        <p className="text-muted-foreground mt-2">
          Your email isn&apos;t linked to a client account.
        </p>
      </div>
    );
  }

  const { data: meetings } = await supabase
    .from("notes")
    .select("*")
    .eq("client_id", client.id)
    .eq("type", "meeting_transcript")
    .order("created_at", { ascending: false });

  const notes = meetings ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
        <p className="text-muted-foreground mt-1">
          Summaries and transcripts from recorded meetings.
        </p>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mic className="mx-auto size-10 text-muted-foreground/50" />
            <p className="text-muted-foreground mt-3">
              No meeting transcripts yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const preview =
              note.content.length > 240
                ? note.content.slice(0, 240).trimEnd() + "…"
                : note.content;
            const meta = note.metadata as Record<string, string | undefined>;

            return (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {meta?.title ?? `Meeting — ${new Date(note.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {new Date(note.created_at).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span>Source: {note.source}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Transcript
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {preview}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
