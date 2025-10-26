import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

const formSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^@?[a-zA-Z0-9._]+$/, "Invalid TikTok username format"),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
  whatsapp: z.string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 10 && /^[0-9+\s()-]+$/.test(val)),
      { message: "Invalid WhatsApp number format" }
    ),
});

export type TikTokFormData = z.infer<typeof formSchema>;

interface TikTokUserInputFormProps {
  onDataChange: (data: TikTokFormData) => void;
  initialData?: TikTokFormData;
}

export const TikTokUserInputForm = ({ onDataChange, initialData }: TikTokUserInputFormProps) => {
  const [username, setUsername] = useState(initialData?.username || "");
  const [password, setPassword] = useState(initialData?.password || "");
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || "");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const formData = { username, password, whatsapp };
    
    try {
      formSchema.parse(formData);
      setErrors({});
      onDataChange(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  }, [username, password, whatsapp, onDataChange]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] text-white flex items-center justify-center font-bold text-lg">
            1
          </span>
          Enter TikTok Details
        </CardTitle>
        <CardDescription>
          Provide your TikTok account information for top-up processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* TikTok Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-base font-medium flex items-center gap-1">
            TikTok Username <span className="text-destructive">*</span>
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your TikTok username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={errors.username ? "border-destructive" : ""}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username}</p>
          )}
        </div>

        {/* TikTok Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-medium flex items-center gap-1">
            TikTok Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your TikTok password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Your credentials are used only to process the top-up securely.
          </p>
        </div>

        {/* WhatsApp Number (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-base font-medium">
            WhatsApp Number <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="+977 XXXXX XXXXX"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={errors.whatsapp ? "border-destructive" : ""}
          />
          {errors.whatsapp && (
            <p className="text-xs text-destructive">{errors.whatsapp}</p>
          )}
          <p className="text-xs text-muted-foreground">
            For order updates and support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
