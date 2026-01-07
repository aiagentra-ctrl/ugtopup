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
              Welcome to our platform. By adding credits or purchasing any in-game items, 
              you agree to follow the rules mentioned below.
            </p>

            {/* Terms Sections */}
            <div className="space-y-10">
              
              {/* Section 1 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>1.</span> Account & Eligibility
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Users must create an account to add credits or place orders.</p>
                  <p>You are responsible for maintaining the confidentiality of your login details.</p>
                  <p>Any activity performed using your account will be considered your responsibility.</p>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>2.</span> Payment & Credit Verification
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>All payments are manually verified. Verification time depends on payment method and confirmation status.</p>
                  <p>Payment remarks must include your website username and your name.</p>
                  <p>Credits will be added only after successful payment confirmation.</p>
                  <p>Incomplete or unclear payment details may cause delays or rejection.</p>
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>3.</span> Incorrect Payment & Chargeback
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>If a user sends payment to the wrong account, wrong amount, or without required details, UG Gaming Store is not responsible.</p>
                  <p>Any chargeback, dispute, or payment reversal attempt may result in account suspension or permanent ban.</p>
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>4.</span> User Data Responsibility
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Users must provide correct and complete game details including Game ID, Username, Zone ID, Server, etc.</p>
                  <p>UG Gaming Store is not liable for losses caused by incorrect or incomplete information provided by the user.</p>
                </div>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>5.</span> Credit Usage Policy
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Credits can only be used on UG Gaming Store products and services.</p>
                  <p>Credits cannot be withdrawn, transferred, exchanged, gifted, or converted into cash.</p>
                  <p>Credits have no monetary value outside the platform.</p>
                </div>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>6.</span> Pricing & Availability
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Product prices, offers, bonuses, and availability may change at any time without prior notice.</p>
                  <p>UG Gaming Store reserves the right to cancel or refuse any order due to pricing errors, technical issues, or stock limitations.</p>
                </div>
              </div>

              {/* Section 7 - Warning */}
              <div className="py-6 px-5 rounded-xl bg-destructive/5 border border-destructive/20">
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>7.</span> No Refund & No Cancellation Policy
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>All payments, credits, and completed orders are final and non-refundable.</p>
                  <p>Orders cannot be cancelled once processing has started.</p>
                  <p>Refunds will not be issued after credit approval or order placement.</p>
                  <p>Only rare, exceptional cases may be reviewed by support—approval is not guaranteed.</p>
                </div>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>8.</span> Order Processing & Delivery
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Order delivery time may vary depending on game system, server response, or technical conditions.</p>
                  <p>Delays caused by incorrect user data, server maintenance, or third-party systems are not the responsibility of UG Gaming Store.</p>
                </div>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>9.</span> Fraud, Abuse & Misuse
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Any attempt to misuse the platform, exploit pricing errors, use fake payments, or perform fraudulent activity will result in:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Immediate account suspension or termination</li>
                    <li>Cancellation of credits or orders</li>
                    <li>Permanent ban without notice</li>
                  </ul>
                  <p>No explanation is required from UG Gaming Store in such cases.</p>
                </div>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>10.</span> Service Availability
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>UG Gaming Store services may be temporarily unavailable due to maintenance, upgrades, or technical issues.</p>
                  <p>We are not responsible for losses caused by downtime or service interruptions.</p>
                </div>
              </div>

              {/* Section 11 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>11.</span> Third-Party Services & Games
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>UG Gaming Store is not affiliated with or owned by any game publisher unless stated.</p>
                  <p>All trademarks, logos, and game names belong to their respective owners.</p>
                  <p>We are not responsible for actions taken by game developers, including bans, resets, or policy changes.</p>
                </div>
              </div>

              {/* Section 12 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>12.</span> Limitation of Liability
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>UG Gaming Store will not be liable for any direct, indirect, or consequential losses including account bans, data loss, or in-game penalties.</p>
                </div>
              </div>

              {/* Section 13 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>13.</span> Policy Updates & Modifications
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>UG Gaming Store reserves the right to modify these Terms & Conditions at any time without prior notice.</p>
                  <p>Continued use of the website means automatic acceptance of updated policies.</p>
                </div>
              </div>

              {/* Section 14 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>14.</span> Governing Authority
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Any disputes arising from the use of this website will be handled under applicable local laws and UG Gaming Store's internal decision will be final.</p>
                </div>
              </div>

              {/* Section 15 */}
              <div>
                <h2 className="text-lg font-bold text-destructive mb-3 flex items-center gap-2">
                  <span>15.</span> Acceptance of Terms
                </h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>By registering, adding credits, or placing an order, you fully agree to all terms and conditions listed above.</p>
                  <p className="font-medium">If you do not agree, do not use this website or its services.</p>
                </div>
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
