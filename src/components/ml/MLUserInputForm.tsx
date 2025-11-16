import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MLUserInputFormProps {
  formData: {
    userId: string;
    zoneId: string;
    whatsapp: string;
  };
  onChange: (field: string, value: string) => void;
  errors: {
    userId?: string;
    zoneId?: string;
  };
}

export const MLUserInputForm = ({ formData, onChange, errors }: MLUserInputFormProps) => {
  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-slate-100">Enter Account Details</CardTitle>
        <CardDescription className="text-slate-400">
          Fill in your Mobile Legends account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId" className="text-slate-300">User ID *</Label>
          <Input
            id="userId"
            type="text"
            placeholder="Enter your User ID"
            value={formData.userId}
            onChange={(e) => onChange("userId", e.target.value.replace(/\D/g, ""))}
            className={`bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${
              errors.userId ? "border-red-500" : ""
            }`}
          />
          {errors.userId && (
            <p className="text-sm text-red-400">{errors.userId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zoneId" className="text-slate-300">Zone ID *</Label>
          <Input
            id="zoneId"
            type="text"
            placeholder="Enter 4-digit Zone ID"
            value={formData.zoneId}
            maxLength={4}
            onChange={(e) => onChange("zoneId", e.target.value.replace(/\D/g, ""))}
            className={`bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 ${
              errors.zoneId ? "border-red-500" : ""
            }`}
          />
          <p className="text-xs text-slate-400">{formData.zoneId.length}/4 digits • Must be exactly 4 digits</p>
          {errors.zoneId && (
            <p className="text-sm text-red-400">{errors.zoneId}</p>
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
