import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Gamepad2 } from "lucide-react";
import { FreefirePricing } from "./FreefirePricing";
import { MobileLegendsPricing } from "./MobileLegendsPricing";
import { TikTokPricing } from "./TikTokPricing";
import { RobloxPricing } from "./RobloxPricing";
import { PubgPricing } from "./PubgPricing";
import { NetflixPricing } from "./NetflixPricing";
import { YouTubePricing } from "./YouTubePricing";
import { ChatGPTPricing } from "./ChatGPTPricing";
import { GarenaPricing } from "./GarenaPricing";
import { SmileCoinPricing } from "./SmileCoinPricing";
import { UnipinPricing } from "./UnipinPricing";

export const GameProductPrices = () => {
  const [activeGame, setActiveGame] = useState("freefire");

  const games = [
    { id: "freefire", label: "Free Fire", icon: "🎮" },
    { id: "mobile_legends", label: "Mobile Legends", icon: "⚔️" },
    { id: "tiktok", label: "TikTok", icon: "🎵" },
    { id: "roblox", label: "Roblox", icon: "🎮" },
    { id: "pubg", label: "PUBG", icon: "🎯" },
    { id: "netflix", label: "Netflix", icon: "🎬" },
    { id: "youtube", label: "YouTube", icon: "▶️" },
    { id: "chatgpt", label: "ChatGPT", icon: "🤖" },
    { id: "garena", label: "Garena", icon: "🎮" },
    { id: "smilecoin", label: "SmileCoin", icon: "😊" },
    { id: "unipin", label: "Unipin", icon: "🎁" },
  ];

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
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max">
            {games.map((game) => (
              <TabsTrigger
                key={game.id}
                value={game.id}
                className="inline-flex items-center gap-1.5 px-3 text-sm"
              >
                <span>{game.icon}</span>
                <span className="hidden sm:inline">{game.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="freefire" className="mt-6">
          <FreefirePricing />
        </TabsContent>

        <TabsContent value="mobile_legends" className="mt-6">
          <MobileLegendsPricing />
        </TabsContent>

        <TabsContent value="tiktok" className="mt-6">
          <TikTokPricing />
        </TabsContent>

        <TabsContent value="roblox" className="mt-6">
          <RobloxPricing />
        </TabsContent>

        <TabsContent value="pubg" className="mt-6">
          <PubgPricing />
        </TabsContent>

        <TabsContent value="netflix" className="mt-6">
          <NetflixPricing />
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <YouTubePricing />
        </TabsContent>

        <TabsContent value="chatgpt" className="mt-6">
          <ChatGPTPricing />
        </TabsContent>

        <TabsContent value="garena" className="mt-6">
          <GarenaPricing />
        </TabsContent>

        <TabsContent value="smilecoin" className="mt-6">
          <SmileCoinPricing />
        </TabsContent>

        <TabsContent value="unipin" className="mt-6">
          <UnipinPricing />
        </TabsContent>
      </Tabs>
    </div>
  );
};
