import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseManagement } from "@/components/admin/DatabaseManagement";
import { SupabaseLimits } from "@/components/admin/SupabaseLimits";

export const DatabaseHub = ({ defaultTab = "tables" }: { defaultTab?: string }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Database Management</h2>
        <p className="text-sm text-muted-foreground">Tables, usage limits, and storage</p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="limits">Supabase Limits</TabsTrigger>
        </TabsList>
        <TabsContent value="tables" className="mt-4"><DatabaseManagement /></TabsContent>
        <TabsContent value="limits" className="mt-4"><SupabaseLimits /></TabsContent>
      </Tabs>
    </div>
  );
};
