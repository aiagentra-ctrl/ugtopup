import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  month: string;
  feature_area: string;
  description: string;
  hours_spent: number;
  created_at: string;
}

export function MaintenanceLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('developer_maintenance_log' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setLogs(data as unknown as LogEntry[]);
      setLoading(false);
    };
    load();
  }, []);

  const totalHours = logs.reduce((sum, l) => sum + l.hours_spent, 0);
  const groupedByMonth: Record<string, LogEntry[]> = {};
  logs.forEach(l => {
    if (!groupedByMonth[l.month]) groupedByMonth[l.month] = [];
    groupedByMonth[l.month].push(l);
  });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Total Entries</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total Hours</p>
        </CardContent></Card>
        <Card className="col-span-2 sm:col-span-1"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{Object.keys(groupedByMonth).length}</p>
          <p className="text-xs text-muted-foreground">Months Logged</p>
        </CardContent></Card>
      </div>

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 flex items-start gap-3">
          <Wrench className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Monthly Developer Maintenance</p>
            <p className="text-xs text-muted-foreground mt-1">
              This log tracks ongoing developer maintenance work including bug fixes, API monitoring, UI improvements, security updates, and performance optimization. These services are billed as monthly developer maintenance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logs by Month */}
      {logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No maintenance logs yet</CardContent></Card>
      ) : (
        Object.entries(groupedByMonth).map(([month, entries]) => (
          <div key={month} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{month}</h3>
              <Badge variant="outline">{entries.reduce((s, e) => s + e.hours_spent, 0)}h</Badge>
            </div>
            {entries.map(entry => (
              <Card key={entry.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="text-[10px] mb-1">{entry.feature_area}</Badge>
                      <p className="text-sm">{entry.description}</p>
                    </div>
                    <Badge variant="outline">{entry.hours_spent}h</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
