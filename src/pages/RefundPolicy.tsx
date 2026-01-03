import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertTriangle } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Read Carefully</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
              ⚔️ Battle Terms & Conditions ⚔️
            </h1>
            <p className="text-base text-muted-foreground">
              Read Before Adding Credit
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            
            {/* Introduction */}
            <p className="text-muted-foreground mb-10 text-center">
              Welcome to our platform. By adding credits or purchasing any in-game items 
              (like Free Fire Diamonds), you agree to follow the rules mentioned below.
            </p>

            {/* Terms Sections */}
            <div className="space-y-10">
              
              {/* Section 1 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">1.</span> Payment & Credit Verification
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  After you add credit, our team will manually verify the payment. Verification may take some time depending on payment status. <strong className="text-primary">When sending payment, you must include your website login username and your name in the payment remark.</strong> Credits will be added only after successful payment confirmation.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">2.</span> User Data & Responsibility
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-primary">If you provide wrong game ID or username, it will be your responsibility.</strong> We are not liable for incorrect IDs, usernames, or any mistakes in the details you provide. All user data must be correct and complete when placing orders.
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">3.</span> Credit Usage
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Added credits can be used to buy gaming items available on the website. <strong className="text-primary">Once credit is approved/added, it cannot be withdrawn or converted back to cash.</strong>
                </p>
              </div>

              {/* Section 4 - Warning */}
              <div className="py-6 px-5 rounded-xl bg-destructive/5 border border-destructive/20">
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>4.</span> No Refund Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-destructive">Once payment is sent and credit is added, it is non-refundable. Refund will not be provided after placing an order.</strong> Only in rare special cases you may contact support team for help.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">5.</span> Order Delivery
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  For every purchase made using credits, you must provide correct game ID and details. <strong className="text-primary">Wrong details or missing information is not our responsibility.</strong>
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">6.</span> Support
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If any issue occurs, please contact our admin/customer support. We will try our best to solve your problem quickly.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">7.</span> Agreement
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By using our website, you accept these policies and agree to follow them. <strong className="text-muted-foreground">If you do not agree, please do not add credit or place an order.</strong>
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
