import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchUserSubscriptions, toggleSubscription, deleteSubscription, type Subscription } from "@/lib/subscriptionApi";

const Subscriptions = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setSubs(await fetchUserSubscriptions()); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string, active: boolean) => {
    try { await toggleSubscription(id, active); toast.success(active ? 'Activated' : 'Paused'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteSubscription(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-primary" /> Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground">Manage your recurring top-up plans</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : subs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No subscriptions</h3>
              <p className="text-muted-foreground text-sm">Recurring top-up plans will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {subs.map(sub => (
              <Card key={sub.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{sub.product_name}</p>
                      <p className="text-sm text-muted-foreground">{sub.package_name} · ₹{sub.price}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{sub.frequency}</Badge>
                        <Badge variant={sub.is_active ? 'default' : 'secondary'}>{sub.is_active ? 'Active' : 'Paused'}</Badge>
                      </div>
                      {sub.next_run_at && (
                        <p className="text-xs text-muted-foreground mt-1">Next: {format(new Date(sub.next_run_at), 'MMM dd, yyyy')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={sub.is_active} onCheckedChange={v => handleToggle(sub.id, v)} />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Subscriptions;
