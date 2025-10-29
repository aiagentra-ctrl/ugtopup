import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type YouTubeFormData = z.infer<typeof formSchema>;

interface YouTubeUserInputFormProps {
  onDataChange: (data: YouTubeFormData | null) => void;
  initialData?: YouTubeFormData;
}

export const YouTubeUserInputForm = ({ onDataChange, initialData }: YouTubeUserInputFormProps) => {
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState(initialData?.password || "");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const result = formSchema.safeParse({ email, password });
    
    if (result.success) {
      setErrors({});
      onDataChange(result.data);
    } else {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      onDataChange(null);
    }
  }, [email, password, onDataChange]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg">
            1
          </span>
          Enter Details
        </CardTitle>
        <CardDescription>
          Provide your YouTube account credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">YT Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your YouTube email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">YT Email Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your email password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
