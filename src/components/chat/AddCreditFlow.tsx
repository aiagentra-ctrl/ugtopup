import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { submitCreditRequest } from '@/utils/chatApi';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AddCreditFlowProps {
  onResult: (message: string) => void;
}

type Step = 'details' | 'qr' | 'screenshot' | 'submitting' | 'done';

export const AddCreditFlow = ({ onResult }: AddCreditFlowProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetailsSubmit = () => {
    if (!name.trim() || !email.trim() || !amount.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setError(null);
    setStep('qr');
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload PNG, JPG, or JPEG only.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('File size must be under 3MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop();
      const path = `chat-credits/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(path);

      setScreenshotUrl(urlData.publicUrl);
      setStep('screenshot');
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setStep('submitting');
    try {
      const result = await submitCreditRequest({
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        amount: amount.trim(),
        screenshot_url: screenshotUrl || undefined,
      });

      if (result.success) {
        setStep('done');
        onResult(`✅ ${result.message}`);
      } else {
        setError(result.error || result.message || 'Failed to submit request.');
        setStep('screenshot');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('screenshot');
    }
  };

  if (step === 'done') return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 max-w-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Step 1: Details */}
      {step === 'details' && (
        <>
          <h4 className="text-sm font-semibold text-foreground">💳 Add Credit</h4>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">WhatsApp Number</Label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+977..." className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Amount (NPR) *</Label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" type="number" className="h-8 text-xs" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={handleDetailsSubmit} size="sm" className="w-full text-xs">
              Continue to Payment
            </Button>
          </div>
        </>
      )}

      {/* Step 2: QR Payment */}
      {step === 'qr' && (
        <>
          <h4 className="text-sm font-semibold text-foreground">📱 Make Payment</h4>
          <div className="bg-muted rounded-lg p-3 text-center space-y-2">
            <img 
              src="/logo.jpg" 
              alt="Payment QR" 
              className="w-40 h-40 mx-auto rounded-lg object-cover"
            />
            <p className="text-xs text-foreground font-medium">
              Send NPR {amount} via QR code
            </p>
            <p className="text-xs text-destructive font-semibold">
              ⚠️ Add your name "{name}" in payment remarks!
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            After payment, upload screenshot below:
          </p>
          <div className="relative">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleScreenshotUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button variant="outline" size="sm" className="w-full text-xs" disabled={uploading}>
              {uploading ? (
                <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="h-3 w-3 mr-1.5" /> Upload Screenshot</>
              )}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}

      {/* Step 3: Confirm */}
      {step === 'screenshot' && (
        <>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Screenshot Uploaded
          </h4>
          {screenshotUrl && (
            <img src={screenshotUrl} alt="Payment screenshot" className="w-full h-24 object-cover rounded-lg" />
          )}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Amount:</strong> NPR {amount}</p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={handleSubmit} size="sm" className="w-full text-xs">
            Submit Credit Request
          </Button>
        </>
      )}

      {/* Submitting */}
      {step === 'submitting' && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Submitting request...</span>
        </div>
      )}
    </div>
  );
};
