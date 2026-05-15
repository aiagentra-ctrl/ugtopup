import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, History, Bookmark } from "lucide-react";
import { ChatTab } from "./ChatTab";
import { ChangelogTab } from "./ChangelogTab";
import { SavedReportsTab } from "./SavedReportsTab";
import { PageTransition } from "../ui/PageTransition";

interface AICommandPageProps {
  initialQuery?: string;
}

export function AICommandPage({ initialQuery }: AICommandPageProps) {
  const [tab, setTab] = useState("chat");
  const [seedQuery, setSeedQuery] = useState(initialQuery ?? "");

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-white/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Command</h1>
            <p className="text-sm text-muted-foreground">Ask anything. Run commands. Inspect every change.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-card/60 backdrop-blur-md border border-white/10">
            <TabsTrigger value="chat" className="gap-2"><Sparkles className="h-4 w-4" />Chat</TabsTrigger>
            <TabsTrigger value="changelog" className="gap-2"><History className="h-4 w-4" />Changelog</TabsTrigger>
            <TabsTrigger value="saved" className="gap-2"><Bookmark className="h-4 w-4" />Saved Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <ChatTab seedQuery={seedQuery} onConsumed={() => setSeedQuery("")} />
          </TabsContent>
          <TabsContent value="changelog" className="mt-4">
            <ChangelogTab />
          </TabsContent>
          <TabsContent value="saved" className="mt-4">
            <SavedReportsTab onRerun={(q) => { setSeedQuery(q); setTab("chat"); }} />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
