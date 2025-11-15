import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  whatsapp: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit WhatsApp number"),
  email: z.string().email("Invalid email address"),
});

export type NetflixFormData = z.infer<typeof formSchema>;

interface NetflixUserInputFormProps {
  onDataChange: (data: NetflixFormData | null, isValid: boolean) => void;
  initialData?: NetflixFormData;
}

export const NetflixUserInputForm = ({ onDataChange, initialData }: NetflixUserInputFormProps) => {
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [errors, setErrors] = useState<{ whatsapp?: string; email?: string }>({});

  useEffect(() => {
    const result = formSchema.safeParse({ whatsapp, email });
    
    if (result.success) {
      setErrors({});
      onDataChange(result.data, true);
    } else {
      const fieldErrors: { whatsapp?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "whatsapp") fieldErrors.whatsapp = err.message;
        if (err.path[0] === "email") fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      onDataChange(null, false);
    }
  }, [whatsapp, email, onDataChange]);

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
          Provide your contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp Number</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="Enter 10-digit WhatsApp number"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={errors.whatsapp ? "border-destructive" : ""}
            maxLength={10}
          />
          {errors.whatsapp && (
            <p className="text-xs text-destructive">{errors.whatsapp}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Your Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
