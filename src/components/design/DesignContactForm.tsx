import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DesignContactFormProps {
  formData: {
    email: string;
    whatsapp: string;
  };
  onChange: (field: string, value: string) => void;
  errors: {
    email?: string;
    whatsapp?: string;
  };
}

export const DesignContactForm = ({ formData, onChange, errors }: DesignContactFormProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            1
          </div>
          <div>
            <CardTitle className="text-foreground">Enter Contact Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              We'll reach out to discuss your design requirements
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
              errors.email ? "border-destructive" : ""
            }`}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-foreground">WhatsApp Number *</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={formData.whatsapp}
            onChange={(e) => onChange("whatsapp", e.target.value)}
            className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary ${
              errors.whatsapp ? "border-destructive" : ""
            }`}
          />
          {errors.whatsapp && (
            <p className="text-sm text-destructive">{errors.whatsapp}</p>
          )}
          <p className="text-xs text-muted-foreground">We'll contact you on WhatsApp to discuss your requirements</p>
        </div>
      </CardContent>
    </Card>
  );
};
