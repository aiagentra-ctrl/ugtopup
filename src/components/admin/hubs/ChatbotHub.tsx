import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatbotSettings } from "@/components/admin/ChatbotSettings";
import { ChatbotFeedback } from "@/components/admin/ChatbotFeedback";

export const ChatbotHub = ({ defaultTab = "settings" }: { defaultTab?: string }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">AI Chatbot</h2>
        <p className="text-sm text-muted-foreground">Bot configuration and user feedback</p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="feedback">Chat Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="mt-4"><ChatbotSettings /></TabsContent>
        <TabsContent value="feedback" className="mt-4"><ChatbotFeedback /></TabsContent>
      </Tabs>
    </div>
  );
};
