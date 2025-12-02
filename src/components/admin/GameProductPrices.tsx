import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2 } from "lucide-react";
import { FreefirePricing } from "./FreefirePricing";

export const GameProductPrices = () => {
  const [activeGame, setActiveGame] = useState("freefire");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gamepad2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Game Product Pricing</CardTitle>
              <CardDescription>
                Manage real-time prices for all game products. Changes reflect instantly on the website.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Game Tabs */}
      <Tabs value={activeGame} onValueChange={setActiveGame}>
        <TabsList className="grid w-full max-w-md grid-cols-1">
          <TabsTrigger value="freefire" className="flex items-center gap-2">
            <span className="text-lg">🎮</span>
            Free Fire
          </TabsTrigger>
          {/* Future games can be added here */}
        </TabsList>

        <TabsContent value="freefire" className="mt-6">
          <FreefirePricing />
        </TabsContent>
      </Tabs>
    </div>
  );
};
