import { useState, useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Zap, CreditCard, Bell, Gift, Server, AlertTriangle, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInMonths } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  ai_chatbot: Bot,
  liana_api: Zap,
  payment_gateway: CreditCard,
  push_notifications: Bell,
  promotion_system: Gift,
};

interface ServicePricing {
  id: string;
  service_name: string;
  description: string | null;
  monthly_price: number;
  currency: string;
  is_active: boolean;
  billing_start_date: string;
  category: string;
}

const categoryLabels: Record<string, string> = {
  api: 'API Services',
  automation: 'Automation',
  advanced: 'Advanced Features',
  maintenance: 'Maintenance',
};

export function ServiceStatus() {
  const { flags, loading } = useFeatureFlags();
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const disabledFlags = flags.filter(f => !f.is_enabled);
  const hasDisabled = disabledFlags.length > 0;

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('developer_service_pricing' as any)
        .select('*')
        .order('display_order');
      if (!error && data) setServices(data as unknown as ServicePricing[]);
      setServicesLoading(false);
    };
    load();
  }, []);

  const activeServices = services.filter(s => s.is_active);
  const totalMonthly = activeServices.reduce((sum, s) => sum + s.monthly_price, 0);

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
      {/* Status Banners */}
      {hasDisabled ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some features are inactive</AlertTitle>
          <AlertDescription>
            {disabledFlags.length} feature(s) are currently disabled. Contact the developer if services are unexpectedly inactive.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500/30 bg-green-500/5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600">All systems operational</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            All features are currently active and running normally.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-primary/20 bg-primary/5">
        <Server className="h-4 w-4" />
        <AlertTitle>Monthly Developer Maintenance</AlertTitle>
        <AlertDescription>
          All systems are maintained under a monthly developer service plan including bug fixes, API monitoring, UI improvements, security updates, and performance optimization.
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

      {/* Monthly Maintenance Costs */}
      {!servicesLoading && activeServices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Monthly Maintenance Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeServices.map(s => {
              const months = Math.max(differenceInMonths(new Date(), new Date(s.billing_start_date)), 0);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{s.service_name}</p>
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[s.category] || s.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Since {format(new Date(s.billing_start_date), 'MMM d, yyyy')} · {months} month{months !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <p className="text-sm font-mono font-semibold text-foreground ml-3">NPR {s.monthly_price.toLocaleString()}</p>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-sm font-semibold text-foreground">Total Monthly Cost</p>
              <p className="text-base font-bold text-primary">NPR {totalMonthly.toLocaleString()}/mo</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
