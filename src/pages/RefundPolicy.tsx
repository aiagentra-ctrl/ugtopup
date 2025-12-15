import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertTriangle } from "lucide-react";

const RefundPolicy = () => {
  const policies = [
    {
      icon: "💳",
      title: "Payment & Credit Verification",
      items: [
        "After you add credit, our team will manually verify the payment.",
        "Verification may take some time depending on payment status.",
        <span key="remark"><strong className="text-primary">When sending payment, you must include your website login username and your name in the payment remark.</strong></span>,
        "Credits will be added only after successful payment confirmation."
      ]
    },
    {
      icon: "👤",
      title: "User Data & Responsibility",
      items: [
        <span key="wrong-id"><strong className="text-primary">If you provide wrong game ID or username, it will be your responsibility.</strong></span>,
        "We are not liable for incorrect IDs, usernames, or any mistakes in the details you provide.",
        "All user data must be correct and complete when placing orders."
      ]
    },
    {
      icon: "🎮",
      title: "Credit Usage",
      items: [
        "Added credits can be used to buy gaming items available on the website.",
        <span key="no-withdraw"><strong className="text-primary">Once credit is approved/added, it cannot be withdrawn or converted back to cash.</strong></span>
      ]
    },
    {
      icon: "🚫",
      title: "No Refund Policy",
      isWarning: true,
      items: [
        <span key="non-refund"><strong className="text-destructive">Once payment is sent and credit is added, it is non-refundable.</strong></span>,
        <span key="no-refund-order"><strong className="text-destructive">Refund will not be provided after placing an order.</strong></span>,
        "Only in rare special cases you may contact support team for help."
      ]
    },
    {
      icon: "📦",
      title: "Order Delivery",
      items: [
        "For every purchase made using credits, you must provide correct game ID and details.",
        <span key="wrong-details"><strong className="text-primary">Wrong details or missing information is not our responsibility.</strong></span>
      ]
    },
    {
      icon: "📞",
      title: "Support",
      items: [
        "If any issue occurs, please contact our admin/customer support.",
        "We will try our best to solve your problem quickly."
      ]
    },
    {
      icon: "✅",
      title: "Agreement",
      items: [
        "By using our website, you accept these policies and agree to follow them.",
        <span key="disagree"><strong className="text-muted-foreground">If you do not agree, please do not add credit or place an order.</strong></span>
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Important Policy</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              ⚔️ Battle Terms & Conditions ⚠️
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Read Before Adding Credit
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed text-center">
                Welcome to our platform. By adding credits or purchasing any in-game items 
                (like Free Fire Diamonds), you agree to follow the rules mentioned below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Sections */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {policies.map((policy, index) => (
              <div
                key={index}
                className={`
                  relative p-6 md:p-8 rounded-2xl transition-all duration-300
                  ${policy.isWarning 
                    ? 'bg-destructive/5 border-2 border-destructive/30 hover:border-destructive/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
                    : 'glass-card border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30'
                  }
                `}
              >
                {/* Warning Badge for No Refund */}
                {policy.isWarning && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    IMPORTANT
                  </div>
                )}

                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl md:text-3xl">{policy.icon}</span>
                  <h2 className={`text-xl md:text-2xl font-bold ${policy.isWarning ? 'text-destructive' : 'text-foreground'}`}>
                    {index + 1}. {policy.title}
                  </h2>
                </div>

                {/* Section Content */}
                <ul className="space-y-3 ml-2">
                  {policy.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${policy.isWarning ? 'bg-destructive' : 'bg-primary'}`} />
                      <span className="text-muted-foreground text-base leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
