import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfferManager } from "@/components/admin/OfferManager";
import { CouponRulesManager } from "@/components/admin/CouponRulesManager";

export const OffersCouponsHub = ({ defaultTab = "offers" }: { defaultTab?: string }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Offers & Coupons</h2>
        <p className="text-sm text-muted-foreground">Manage promotional offers and coupon rules in one place</p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="offers">Active Offers</TabsTrigger>
          <TabsTrigger value="coupons">Coupon Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="offers" className="mt-4"><OfferManager /></TabsContent>
        <TabsContent value="coupons" className="mt-4"><CouponRulesManager /></TabsContent>
      </Tabs>
    </div>
  );
};
