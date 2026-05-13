import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralManager } from "@/components/admin/ReferralManager";
import { RewardMilestoneManager } from "@/components/admin/RewardMilestoneManager";

export const ReferralsRewardsHub = ({ defaultTab = "referrals" }: { defaultTab?: string }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Referrals & Rewards</h2>
        <p className="text-sm text-muted-foreground">Referral program and reward milestones</p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="referrals">Referral Program</TabsTrigger>
          <TabsTrigger value="milestones">Reward Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="referrals" className="mt-4"><ReferralManager /></TabsContent>
        <TabsContent value="milestones" className="mt-4"><RewardMilestoneManager /></TabsContent>
      </Tabs>
    </div>
  );
};
