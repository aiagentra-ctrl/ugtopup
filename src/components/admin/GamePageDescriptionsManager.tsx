import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllGamePageDescriptions,
  upsertGamePageDescription,
  type GamePageDescription,
} from "@/lib/gamePageContentApi";

export const GamePageDescriptionsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GamePageDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllGamePageDescriptions();
      setItems(data);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (slug: string, patch: Partial<GamePageDescription>) => {
    setItems((prev) => prev.map((it) => (it.page_slug === slug ? { ...it, ...patch } : it)));
  };

  const save = async (item: GamePageDescription) => {
    setSavingSlug(item.page_slug);
    try {
      await upsertGamePageDescription({
        page_slug: item.page_slug,
        title: item.title,
        description: item.description,
        is_active: item.is_active,
      });
      toast({ title: "Saved", description: `${item.page_slug} description updated` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSavingSlug(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Product Page Descriptions</h2>
        <p className="text-sm text-muted-foreground">
          Edit the description shown on each game/product page (Free Fire, Mobile Legends, PUBG…).
          Leave blank to hide on the page.
        </p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{item.page_slug}</p>
                <h3 className="font-medium">{item.title || item.page_slug}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${item.id}`} className="text-xs">Active</Label>
                <Switch
                  id={`active-${item.id}`}
                  checked={item.is_active}
                  onCheckedChange={(v) => update(item.page_slug, { is_active: v })}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <div>
                <Label htmlFor={`title-${item.id}`}>Title</Label>
                <Input
                  id={`title-${item.id}`}
                  value={item.title ?? ""}
                  onChange={(e) => update(item.page_slug, { title: e.target.value })}
                  placeholder="Heading shown above description"
                />
              </div>
              <div>
                <Label htmlFor={`desc-${item.id}`}>Description</Label>
                <Textarea
                  id={`desc-${item.id}`}
                  value={item.description}
                  onChange={(e) => update(item.page_slug, { description: e.target.value })}
                  rows={4}
                  placeholder="Tell users what this product is, delivery time, requirements, etc."
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => save(item)}
                  disabled={savingSlug === item.page_slug}
                >
                  {savingSlug === item.page_slug ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
