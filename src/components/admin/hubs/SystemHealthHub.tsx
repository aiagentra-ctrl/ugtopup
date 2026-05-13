import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemHealthMonitor } from "@/components/admin/SystemHealthMonitor";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { MaintenanceLog } from "@/components/admin/MaintenanceLog";

export const SystemHealthHub = ({ defaultTab = "overview" }: { defaultTab?: string }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">System Health</h2>
        <p className="text-sm text-muted-foreground">Live status, activity logs, and maintenance history</p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Log</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><SystemHealthMonitor /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityLogs /></TabsContent>
        <TabsContent value="maintenance" className="mt-4"><MaintenanceLog /></TabsContent>
      </Tabs>
    </div>
  );
};
