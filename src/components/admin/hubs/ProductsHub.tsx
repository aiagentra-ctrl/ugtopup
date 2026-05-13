import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsList } from "@/components/admin/ProductsList";
import { GamePageDescriptionsManager } from "@/components/admin/GamePageDescriptionsManager";

export const ProductsHub = ({ defaultTab = "products" }: { defaultTab?: string }) => {
  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="descriptions">Page Descriptions</TabsTrigger>
      </TabsList>
      <TabsContent value="products"><ProductsList /></TabsContent>
      <TabsContent value="descriptions"><GamePageDescriptionsManager /></TabsContent>
    </Tabs>
  );
};
