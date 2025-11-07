import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RobloxUserInputFormProps {
  formData: {
    username: string;
    password: string;
    whatsapp: string;
  };
  onChange: (field: string, value: string) => void;
  errors: {
    username?: string;
    password?: string;
  };
}

export const RobloxUserInputForm = ({ formData, onChange, errors }: RobloxUserInputFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-slate-100">Enter Account Details</CardTitle>
        <CardDescription className="text-slate-400">
          Fill in your Roblox account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-sm text-blue-400">
            Your password is encrypted and used only for purchase verification. We never store your password.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-slate-300">Username *</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your Roblox username"
            value={formData.username}
            onChange={(e) => onChange("username", e.target.value)}
            className={`bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${
              errors.username ? "border-red-500" : ""
            }`}
          />
          {errors.username && (
            <p className="text-sm text-red-400">{errors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your Roblox password"
              value={formData.password}
              onChange={(e) => onChange("password", e.target.value)}
              className={`bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 pr-10 ${
                errors.password ? "border-red-500" : ""
              }`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-slate-400" />
              ) : (
                <Eye className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-slate-300">WhatsApp Number (Optional)</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="Enter WhatsApp number"
            value={formData.whatsapp}
            onChange={(e) => onChange("whatsapp", e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};
