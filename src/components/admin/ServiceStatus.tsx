import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Zap, CreditCard, Bell, Gift, Server, AlertTriangle, CheckCircle } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  ai_chatbot: Bot,
  liana_api: Zap,
  payment_gateway: CreditCard,
  push_notifications: Bell,
  promotion_system: Gift,
};

export function ServiceStatus() {
  const { flags, loading } = useFeatureFlags();
  const disabledFlags = flags.filter(f => !f.is_enabled);
  const hasDisabled = disabledFlags.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Reminder Banner */}
      {hasDisabled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some features are inactive</AlertTitle>
          <AlertDescription>
            {disabledFlags.length} feature(s) are currently disabled. Some advanced features require ongoing API maintenance payments to stay active. Contact the developer if services are unexpectedly inactive.
          </AlertDescription>
        </Alert>
      )}

      {!hasDisabled && (
        <Alert className="border-green-500/30 bg-green-500/5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600">All systems operational</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            All features are currently active and running normally.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Banner */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>About service costs</AlertTitle>
        <AlertDescription>
          Some advanced features depend on external API services which have ongoing costs. These are managed by the developer. If a feature becomes inactive, it may require maintenance payment to resume.
        </AlertDescription>
      </Alert>

      {/* Feature Status Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flags.map((flag) => {
          const Icon = iconMap[flag.feature_key] || Server;
          return (
            <Card key={flag.id} className={!flag.is_enabled ? 'border-destructive/30' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${flag.is_enabled ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{flag.feature_name}</CardTitle>
                  </div>
                  <Badge variant={flag.is_enabled ? 'default' : 'destructive'} className="text-[10px]">
                    {flag.is_enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{flag.description}</p>
                {flag.depends_on && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Dependency: <span className="font-medium">{flag.depends_on}</span>
                  </p>
                )}
                {flag.monthly_cost_note && (
                  <p className="text-xs text-amber-500 mt-1">💰 {flag.monthly_cost_note}</p>
                )}
                {!flag.is_enabled && flag.disabled_message && (
                  <p className="text-xs text-destructive mt-2 font-medium">{flag.disabled_message}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
