import { useState, useEffect, useCallback } from 'react';
import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Zap, CreditCard, Bell, Gift, Bot, Server,
  CheckCircle, XCircle, Activity, DollarSign, Plus, Pencil, Trash2,
  Save, X, Calendar, Loader2, LayoutDashboard, Settings, Receipt, Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceLog } from '@/components/admin/MaintenanceLog';
import { differenceInMonths, differenceInDays, format } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  ai_chatbot: Bot,
  liana_api: Zap,
  payment_gateway: CreditCard,
  push_notifications: Bell,
  promotion_system: Gift,
};

const categoryLabels: Record<string, string> = {
  api: 'API Services',
  automation: 'Automation',
  advanced: 'Advanced Features',
  maintenance: 'Maintenance',
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
  display_order: number;
  created_at: string;
  updated_at: string;
}

const DeveloperPanel = () => {
  const { flags, loading: flagsLoading, toggleFeature } = useFeatureFlags();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ service_name: '', description: '', monthly_price: 0, category: 'maintenance', billing_start_date: '' });
  const [addingNew, setAddingNew] = useState(false);

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from('developer_service_pricing' as any)
      .select('*')
      .order('display_order');
    if (!error && data) setServices(data as unknown as ServicePricing[]);
    setServicesLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleToggle = async (flag: FeatureFlag, enabled: boolean) => {
    const { error } = await toggleFeature(flag.id, enabled);
    if (error) toast.error('Failed to update feature flag');
    else toast.success(`${flag.feature_name} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const activeFlags = flags.filter(f => f.is_enabled).length;
  const disabledFlags = flags.length - activeFlags;
  const activeServices = services.filter(s => s.is_active);
  const totalMonthlyRevenue = activeServices.reduce((sum, s) => sum + s.monthly_price, 0);

  const groupedFlags = flags.reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    const cat = f.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const startEdit = (s: ServicePricing) => {
    setEditingId(s.id);
    setEditForm({ service_name: s.service_name, description: s.description || '', monthly_price: s.monthly_price, category: s.category, billing_start_date: s.billing_start_date });
  };

  const startAdd = () => {
    setAddingNew(true);
    setEditForm({ service_name: '', description: '', monthly_price: 0, category: 'maintenance', billing_start_date: new Date().toISOString().split('T')[0] });
  };

  const cancelEdit = () => { setEditingId(null); setAddingNew(false); };

  const saveService = async () => {
    if (!editForm.service_name.trim()) { toast.error('Service name required'); return; }
    if (addingNew) {
      const { error } = await supabase.from('developer_service_pricing' as any).insert({
        service_name: editForm.service_name,
        description: editForm.description || null,
        monthly_price: editForm.monthly_price,
        category: editForm.category,
        billing_start_date: editForm.billing_start_date,
        display_order: services.length + 1,
      } as any);
      if (error) { toast.error('Failed to add service'); return; }
      toast.success('Service added');
    } else if (editingId) {
      const { error } = await supabase.from('developer_service_pricing' as any)
        .update({ service_name: editForm.service_name, description: editForm.description || null, monthly_price: editForm.monthly_price, category: editForm.category, billing_start_date: editForm.billing_start_date, updated_at: new Date().toISOString() } as any)
        .eq('id', editingId);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Service updated');
    }
    cancelEdit();
    fetchServices();
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('developer_service_pricing' as any).delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Service deleted');
    fetchServices();
  };

  const toggleServiceActive = async (s: ServicePricing) => {
    const { error } = await supabase.from('developer_service_pricing' as any)
      .update({ is_active: !s.is_active, updated_at: new Date().toISOString() } as any)
      .eq('id', s.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(`${s.service_name} ${!s.is_active ? 'activated' : 'deactivated'}`);
    fetchServices();
  };

  const getMonthsElapsed = (startDate: string) => {
    const months = differenceInMonths(new Date(), new Date(startDate));
    return Math.max(months, 0);
  };

  const getDaysElapsed = (startDate: string) => {
    return Math.max(differenceInDays(new Date(), new Date(startDate)), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Developer Control Panel</h1>
              <p className="text-xs text-muted-foreground">System management & service configuration</p>
            </div>
          </div>
          <Badge variant={disabledFlags === 0 ? 'default' : 'destructive'} className="hidden sm:flex">
            {disabledFlags === 0 ? <><CheckCircle className="h-3 w-3 mr-1" /> All Systems Go</> : <><XCircle className="h-3 w-3 mr-1" /> {disabledFlags} Disabled</>}
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <LayoutDashboard className="h-4 w-4 hidden sm:block" /> Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <Settings className="h-4 w-4 hidden sm:block" /> Services
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <Receipt className="h-4 w-4 hidden sm:block" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-1.5 py-2.5 text-xs sm:text-sm">
              <Wrench className="h-4 w-4 hidden sm:block" /> Logs
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{flags.length}</p>
                      <p className="text-xs text-muted-foreground">Total Features</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{activeFlags}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{disabledFlags}</p>
                      <p className="text-xs text-muted-foreground">Disabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">NPR {totalMonthlyRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" /> System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flagsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {flags.map(flag => {
                      const Icon = iconMap[flag.feature_key] || Server;
                      return (
                        <div key={flag.id} className={`flex items-center gap-3 p-3 rounded-lg border ${flag.is_enabled ? 'border-border bg-card' : 'border-destructive/20 bg-destructive/5'}`}>
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${flag.is_enabled ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{flag.feature_name}</p>
                            <p className="text-[10px] text-muted-foreground">{flag.category}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${flag.is_enabled ? 'bg-green-500' : 'bg-destructive'}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Services Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Active Billing Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : activeServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active services configured</p>
                ) : (
                  <div className="space-y-2">
                    {activeServices.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.service_name}</p>
                          <p className="text-[10px] text-muted-foreground">{categoryLabels[s.category] || s.category} · Since {format(new Date(s.billing_start_date), 'MMM d, yyyy')}</p>
                        </div>
                        <Badge variant="outline" className="font-mono">NPR {s.monthly_price.toLocaleString()}/mo</Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <p className="text-sm font-semibold text-foreground">Total Monthly</p>
                      <p className="text-sm font-bold text-primary">NPR {totalMonthlyRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVICES TAB */}
          <TabsContent value="services" className="space-y-6">
            {flagsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              Object.entries(groupedFlags).map(([category, categoryFlags]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base capitalize">{category.replace('_', ' ')}</CardTitle>
                    <CardDescription>{categoryFlags.length} feature{categoryFlags.length !== 1 ? 's' : ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead className="hidden sm:table-cell">Description</TableHead>
                          <TableHead className="w-24 text-center">Status</TableHead>
                          <TableHead className="w-20 text-center">Toggle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryFlags.map(flag => {
                          const Icon = iconMap[flag.feature_key] || Server;
                          return (
                            <TableRow key={flag.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="font-medium text-sm">{flag.feature_name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className="text-xs text-muted-foreground line-clamp-1">{flag.description}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={flag.is_enabled ? 'default' : 'destructive'} className="text-[10px]">
                                  {flag.is_enabled ? 'Active' : 'Off'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch checked={flag.is_enabled} onCheckedChange={(c) => handleToggle(flag, c)} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* PRICING TAB */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Service Pricing</h2>
                <p className="text-xs text-muted-foreground">Define monthly maintenance costs for each service</p>
              </div>
              {!addingNew && (
                <Button size="sm" onClick={startAdd} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Service
                </Button>
              )}
            </div>

            {/* Add New Form */}
            {addingNew && (
              <Card className="border-primary/30">
                <CardContent className="pt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Service Name</label>
                      <Input value={editForm.service_name} onChange={e => setEditForm(f => ({ ...f, service_name: e.target.value }))} placeholder="Service name" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Monthly Price (NPR)</label>
                      <Input type="number" value={editForm.monthly_price} onChange={e => setEditForm(f => ({ ...f, monthly_price: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                        <option value="api">API Services</option>
                        <option value="automation">Automation</option>
                        <option value="advanced">Advanced Features</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Billing Start Date</label>
                      <Input type="date" value={editForm.billing_start_date} onChange={e => setEditForm(f => ({ ...f, billing_start_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
                    <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                    <Button size="sm" onClick={saveService}><Save className="h-4 w-4 mr-1" /> Save</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service List */}
            {servicesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : services.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No services configured yet</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead>Price/mo</TableHead>
                        <TableHead className="hidden sm:table-cell">Billing Since</TableHead>
                        <TableHead className="hidden lg:table-cell">Months</TableHead>
                        <TableHead className="hidden lg:table-cell">Total Billed</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map(s => {
                        const months = getMonthsElapsed(s.billing_start_date);
                        const isEditing = editingId === s.id;
                        if (isEditing) {
                          return (
                            <TableRow key={s.id}>
                              <TableCell colSpan={8}>
                                <div className="space-y-3 py-2">
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <Input value={editForm.service_name} onChange={e => setEditForm(f => ({ ...f, service_name: e.target.value }))} placeholder="Name" />
                                    <Input type="number" value={editForm.monthly_price} onChange={e => setEditForm(f => ({ ...f, monthly_price: parseFloat(e.target.value) || 0 }))} />
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                                      <option value="api">API Services</option>
                                      <option value="automation">Automation</option>
                                      <option value="advanced">Advanced</option>
                                      <option value="maintenance">Maintenance</option>
                                    </select>
                                    <Input type="date" value={editForm.billing_start_date} onChange={e => setEditForm(f => ({ ...f, billing_start_date: e.target.value }))} />
                                  </div>
                                  <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                                    <Button size="sm" onClick={saveService}><Save className="h-3 w-3" /></Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{s.service_name}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{s.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="text-[10px]">{categoryLabels[s.category] || s.category}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">NPR {s.monthly_price.toLocaleString()}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(s.billing_start_date), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">{months} mo ({getDaysElapsed(s.billing_start_date)} days)</TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-sm">NPR {(months * s.monthly_price).toLocaleString()}</TableCell>
                            <TableCell>
                              <Switch checked={s.is_active} onCheckedChange={() => toggleServiceActive(s)} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(s)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteService(s.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm font-semibold">Total Active Monthly Cost</p>
                  <p className="text-sm font-bold text-primary">NPR {totalMonthlyRevenue.toLocaleString()}</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* MAINTENANCE LOG TAB */}
          <TabsContent value="maintenance">
            <MaintenanceLog />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DeveloperPanel;
