import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface CreditBalanceCardProps {
  balance: number;
  email?: string;
  loading?: boolean;
  onTopUpClick: () => void;
}

export const CreditBalanceCard = ({ balance, email, loading, onTopUpClick }: CreditBalanceCardProps) => {
  return (
    <Card className="bg-card border-border dashboard-card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-semibold">Credit Balance</CardTitle>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div>
            <p className="text-sm text-muted-foreground">Loading balance...</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Available Balance
              </p>
              <p className="text-4xl font-bold text-foreground">
                {balance} Cr.
              </p>
              {email && (
                <p className="text-xs text-muted-foreground mt-2">
                  {email}
                </p>
              )}
            </div>
            
            <Button 
              onClick={onTopUpClick}
              className="w-full topup-submit-button text-white font-semibold py-6 text-base rounded-lg transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              + Credit Topup
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
