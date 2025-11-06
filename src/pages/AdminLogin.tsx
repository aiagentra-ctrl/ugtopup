import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkAdminAccess } from "@/lib/adminApi";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // If already authenticated, check if admin and redirect
    const checkAndRedirect = async () => {
      if (isAuthenticated) {
        const isAdmin = await checkAdminAccess();
        if (isAdmin) {
          navigate("/admin");
        } else {
          toast.error("You don't have admin access");
        }
      }
    };
    checkAndRedirect();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        toast.error(error.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Check if user has admin access
      const isAdmin = await checkAdminAccess();
      
      if (!isAdmin) {
        toast.error("Access denied. You don't have admin privileges.");
        setLoading(false);
        return;
      }

      toast.success("Admin login successful!");
      navigate("/admin");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-neutral-950 via-blue-950/20 to-neutral-950">
      {/* Animated Blue Gradient Background for Admin */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-background to-indigo-500/20 animate-gradient" />
      
      {/* Multiple Animated Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-indigo-600/30 rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl from-blue-600/25 to-indigo-400/25 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s', animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Admin Login Card with Floating Animation */}
        <div className="bg-gradient-to-br from-neutral-900/70 via-neutral-900/60 to-neutral-900/70 backdrop-blur-2xl rounded-3xl p-8 border border-blue-500/20 shadow-2xl shadow-blue-500/10 animate-float-slow hover:shadow-blue-500/20 transition-shadow duration-700">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl mb-4 border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              Admin Panel
            </h1>
            <p className="text-neutral-400 text-sm font-medium">
              Secure administrative access only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-neutral-300 font-medium">
                Admin Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 transition-all group-hover:text-blue-300 group-hover:scale-110" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-12 bg-neutral-900/50 border-neutral-700 rounded-xl text-neutral-200 placeholder:text-neutral-500 focus:border-blue-400 focus:ring-blue-400/20 transition-all hover:border-blue-400/50 hover:bg-neutral-900/70"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-neutral-300 font-medium">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 transition-all group-hover:text-blue-300 group-hover:scale-110" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-12 bg-neutral-900/50 border-neutral-700 rounded-xl text-neutral-200 placeholder:text-neutral-500 focus:border-blue-400 focus:ring-blue-400/20 transition-all hover:border-blue-400/50 hover:bg-neutral-900/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button with Enhanced Glow */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-500 hover:scale-[1.03] shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/60 animate-gradient bg-[length:200%_auto]"
            >
              {loading ? "Authenticating..." : "Access Admin Panel"}
            </Button>

            {/* Security Notice */}
            <div className="text-center pt-4">
              <p className="text-xs text-neutral-500">
                🔒 This is a secure administrative area
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
