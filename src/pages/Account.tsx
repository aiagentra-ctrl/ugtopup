import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Link as LinkIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PasswordManagement } from "@/components/account/PasswordManagement";

const Account = () => {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [balance, setBalance] = useState(profile?.balance || 0);

  // Real-time balance updates
  useEffect(() => {
    if (!user?.id) return;

    // Set initial balance from profile
    if (profile?.balance !== undefined) {
      setBalance(profile.balance);
    }

    // Subscribe to real-time balance changes
    const channel = supabase
      .channel('account-balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Account] Balance updated:', payload.new.balance);
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.balance]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    const { error } = await updateProfile({
      full_name: fullName,
      username: username,
    });

    if (!error) {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    }
    setIsLoading(false);
  };

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
      });

      if (error) throw error;

      toast({
        title: "Google account linked",
        description: "Your Google account has been successfully connected.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to link Google account",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLinking(false);
  };

  const handleUnlinkGoogle = async () => {
    setIsLinking(true);
    try {
      // Get user's identity providers
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const googleIdentity = currentUser?.identities?.find(
        (identity) => identity.provider === 'google'
      );

      if (!googleIdentity) {
        throw new Error('No Google account linked');
      }

      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);

      if (error) throw error;

      toast({
        title: "Google account unlinked",
        description: "Your Google account has been disconnected.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to unlink Google account",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLinking(false);
  };

  const isGoogleUser = profile?.provider === 'google';
  const hasGoogleLinked = user?.app_metadata?.providers?.includes('google') || isGoogleUser;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <div className="space-y-6 animate-fade-in">
          {/* Profile Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{profile?.full_name || "User"}</p>
                  <p className="text-sm text-muted-foreground">@{profile?.username || "username"}</p>
                  {profile?.provider && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Signed in with {profile.provider.charAt(0).toUpperCase() + profile.provider.slice(1)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

                <div className="space-y-2">
                <Label>Account Balance</Label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-2xl font-bold text-primary">₹{balance || 0}</span>
                  <span className="text-sm text-muted-foreground">Credits</span>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="neon-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Connected Accounts
              </CardTitle>
              <CardDescription>Manage your linked authentication providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">Google</p>
                    <p className="text-sm text-muted-foreground">
                      {hasGoogleLinked ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {hasGoogleLinked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkGoogle}
                    disabled={isLinking || isGoogleUser}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    {isLinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLinkGoogle}
                    disabled={isLinking}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    {isLinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                )}
              </div>
              {isGoogleUser && (
                <p className="text-xs text-muted-foreground">
                  You cannot disconnect your primary authentication method.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Security - Password Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                {isGoogleUser 
                  ? "Set a password to enable email login" 
                  : "Manage your password and security settings"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordManagement isGoogleUser={isGoogleUser} />
            </CardContent>
          </Card>

          {/* Terms & Conditions Acceptance */}
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <Link 
              to="/refund-policy" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              I accept the <span className="text-primary font-medium underline underline-offset-2">Terms & Conditions</span> of payment and I agree
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Account;
