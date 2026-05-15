import { useEffect, useRef, useState } from "react";
import { Send, Mic, Sparkles, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "../ui/GlassCard";
import { Shimmer } from "../ui/Shimmer";
import { LiveResultPanel, type PanelPayload } from "./LiveResultPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  panel?: PanelPayload | null;
  ts: string;
}

const QUICK_CHIPS = [
  "Today's sales",
  "Pending orders",
  "Low stock items",
  "Pending credit requests",
  "Top 5 products this week",
  "Sales report this month",
];

interface ChatTabProps {
  seedQuery?: string;
  onConsumed?: () => void;
}

export function ChatTab({ seedQuery, onConsumed }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [latestPanel, setLatestPanel] = useState<PanelPayload | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seedQuery && seedQuery.trim()) {
      setInput(seedQuery);
      onConsumed?.();
      setTimeout(() => send(seedQuery), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuery]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { role: "user", content: trimmed, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("ai-command", { body: { messages: history } });
      if (error) throw error;
      const panel: PanelPayload | null = data?.panel ?? null;
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data?.chat_text || "Done.",
        panel,
        ts: new Date().toISOString(),
      };
      setMessages((m) => [...m, aiMsg]);
      if (panel) setLatestPanel(panel);
    } catch (e: any) {
      toast.error(e?.message || "AI request failed");
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong.", ts: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  }

  function startVoice() {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false;
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.onerror = () => toast.error("Voice input failed");
    rec.start();
  }

  async function pinReport() {
    if (!latestPanel) { toast.error("Nothing to pin"); return; }
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "AI Report";
    const { error } = await supabase.from("ai_saved_reports" as any).insert({
      admin_id: (await supabase.auth.getUser()).data.user?.id,
      title: lastUser.slice(0, 80),
      query: lastUser,
      response_payload: latestPanel as any,
    });
    if (error) toast.error(error.message); else toast.success("Pinned to Saved Reports");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      {/* LEFT: Chat thread */}
      <GlassCard className="lg:col-span-2 flex flex-col overflow-hidden">
        <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/60" />
              <p className="text-sm">Ask anything or pick a quick command below.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-white/10 rounded-bl-sm",
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <div className={cn("text-[10px] mt-1 opacity-60", m.role === "user" ? "text-right" : "text-left")}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-white/10 rounded-xl rounded-bl-sm px-3 py-2 w-44 space-y-1.5">
                <Shimmer height={10} width="80%" />
                <Shimmer height={10} width="60%" />
                <p className="text-[10px] text-muted-foreground mt-1">AI is thinking…</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/5 p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted border border-white/5 transition-colors disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything or give a command..."
              className="resize-none min-h-[44px] max-h-32 rounded-lg"
              rows={1}
            />
            <Button type="button" variant="outline" size="icon" onClick={startVoice} className="shrink-0" aria-label="Voice input">
              <Mic className="h-4 w-4" />
            </Button>
            <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon" className="shrink-0" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* RIGHT: Live result panel */}
      <GlassCard className="lg:col-span-3 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 p-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Live Result</h3>
          <Button variant="ghost" size="sm" onClick={pinReport} disabled={!latestPanel} className="gap-1.5">
            <Bookmark className="h-4 w-4" /> Pin
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {latestPanel ? (
            <LiveResultPanel payload={latestPanel} onRefresh={() => latestPanel && messages.length && send(messages[messages.length - 2]?.content ?? "")} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-3 text-primary/40" />
              <p className="text-sm">Results will appear here.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
