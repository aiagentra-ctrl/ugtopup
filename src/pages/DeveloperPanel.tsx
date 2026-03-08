import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Zap, CreditCard, Bell, Gift, Bot, Server } from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  ai_chatbot: Bot,
  liana_api: Zap,
  payment_gateway: CreditCard,
  push_notifications: Bell,
  promotion_system: Gift,
};

const DeveloperPanel = () => {
  const { flags, loading, toggleFeature } = useFeatureFlags();
  const navigate = useNavigate();

  const handleToggle = async (flag: FeatureFlag, enabled: boolean) => {
    const { error } = await toggleFeature(flag.id, enabled);
    if (error) {
      toast.error('Failed to update feature flag');
    } else {
      toast.success(`${flag.feature_name} ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const disabledCount = flags.filter(f => !f.is_enabled).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Developer Panel</h1>
              <p className="text-xs text-muted-foreground">Manage system features & API services</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-foreground">{flags.length}</p>
              <p className="text-xs text-muted-foreground">Total Features</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-500">{flags.length - disabledCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-destructive">{disabledCount}</p>
              <p className="text-xs text-muted-foreground">Disabled</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Flags */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Feature Flags</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            flags.map((flag) => {
              const Icon = iconMap[flag.feature_key] || Server;
              return (
                <Card key={flag.id} className={!flag.is_enabled ? 'opacity-70 border-destructive/30' : ''}>
                  <CardContent className="py-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${flag.is_enabled ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{flag.feature_name}</h3>
                        <Badge variant={flag.is_enabled ? 'default' : 'destructive'} className="text-[10px]">
                          {flag.is_enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{flag.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                      {flag.depends_on && (
                        <p className="text-xs text-muted-foreground mt-1">Depends on: <span className="font-medium">{flag.depends_on}</span></p>
                      )}
                      {flag.monthly_cost_note && (
                        <p className="text-xs text-amber-500 mt-1">💰 {flag.monthly_cost_note}</p>
                      )}
                    </div>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={(checked) => handleToggle(flag, checked)}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default DeveloperPanel;
