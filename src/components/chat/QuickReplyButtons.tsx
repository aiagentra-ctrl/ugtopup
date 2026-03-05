import { MessageCircle, Package, CreditCard } from 'lucide-react';

interface QuickReplyButtonsProps {
  button1Label: string;
  button1Enabled: boolean;
  button2Label: string;
  button2Enabled: boolean;
  button3Label: string;
  button3Enabled: boolean;
  onSelect: (mode: 'faq' | 'order' | 'payment') => void;
}

export const QuickReplyButtons = ({
  button1Label, button1Enabled,
  button2Label, button2Enabled,
  button3Label, button3Enabled,
  onSelect,
}: QuickReplyButtonsProps) => {
  const buttons = [
    { label: button1Label, enabled: button1Enabled, mode: 'faq' as const, icon: MessageCircle },
    { label: button2Label, enabled: button2Enabled, mode: 'order' as const, icon: Package },
    { label: button3Label, enabled: button3Enabled, mode: 'payment' as const, icon: CreditCard },
  ];

  const activeButtons = buttons.filter(b => b.enabled);
  if (activeButtons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeButtons.map((btn) => (
        <button
          key={btn.mode}
          onClick={() => onSelect(btn.mode)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full
                     bg-gradient-to-r from-primary/10 to-secondary/10
                     border border-primary/20 text-primary
                     hover:from-primary/20 hover:to-secondary/20 hover:border-primary/40
                     transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <btn.icon className="h-3.5 w-3.5" />
          {btn.label}
        </button>
      ))}
    </div>
  );
};
