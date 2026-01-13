import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Home, ShieldCheck } from "lucide-react";

const LoginRequired = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Login Required</CardTitle>
          <CardDescription className="text-base">
            You need to be logged in to access this page. Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/login" className="block">
            <Button className="w-full gap-2" size="lg">
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>
          </Link>
          <Link to="/signup" className="block">
            <Button variant="outline" className="w-full gap-2" size="lg">
              Create Account
            </Button>
          </Link>
          <div className="pt-4 border-t border-border">
            <Link to="/">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginRequired;
