import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Ticket, Gift, Users, ShieldCheck, AlertTriangle, Ban } from "lucide-react";

const CouponPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Ticket className="h-8 w-8 text-primary" /> Coupon Policy & Rules
        </h1>
        <p className="text-muted-foreground mb-8">
          Please read these guidelines carefully to understand how coupons, rewards, and referral offers work on UGTOPUPS.
        </p>

        {/* 1. How Coupons Work */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5" /> 1. How Coupons Work
          </h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p>Coupons are discount codes that can be applied during checkout to reduce the total price of your order. Coupons may offer percentage-based discounts or fixed amount discounts depending on the promotion.</p>
            <p>To use a coupon, enter the code in the coupon field on the order review page before placing your order. The discount will be calculated and shown before you confirm.</p>
          </div>
        </section>

        {/* 2. Coupon Usage Rules */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> 2. Coupon Usage Rules
          </h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p>Each coupon can only be used according to its specific terms and conditions. Some coupons are limited to a single use per account, while others may allow multiple uses.</p>
            <p>Coupons cannot be exchanged, transferred, or redeemed for cash under any circumstances. Once a coupon has expired, it cannot be used regardless of its remaining value.</p>
            <p>Some coupons may have minimum order requirements. If your order total does not meet the minimum amount, the coupon will not be applied.</p>
            <p>Certain coupons are restricted to specific product categories. These coupons will only work when purchasing eligible products.</p>
            <p>Only one coupon can be applied per order unless otherwise stated in the promotion terms.</p>
          </div>
        </section>

        {/* 3. How to Earn Coupons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5" /> 3. How to Earn Coupons
          </h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p><strong>Order Milestones:</strong> Complete a certain number of orders to automatically earn milestone reward coupons. The more you order, the better rewards you unlock.</p>
            <p><strong>Referral Program:</strong> Share your unique referral link with friends. When they sign up and make their first purchase, both you and your friend earn discount coupons.</p>
            <p><strong>Special Promotions:</strong> From time to time, we run seasonal campaigns and flash sales that include exclusive coupon codes. Follow our social media channels to stay updated.</p>
            <p><strong>Global Promo Codes:</strong> Occasionally, we release public promo codes that any user can apply during checkout.</p>
          </div>
        </section>

        {/* 4. Referral Rules */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" /> 4. Referral Program Rules
          </h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p>The referral program rewards users who invite genuine new users to the platform. Both the referrer and the referee receive discount coupons when the referred user completes their first qualifying purchase.</p>
            <p>Self-referrals are strictly prohibited. Creating multiple accounts to earn referral rewards is considered fraudulent activity.</p>
            <p>Referral rewards are only issued when the referred user makes a legitimate purchase that meets the minimum order amount set by the program.</p>
            <p>If suspicious referral activity is detected — such as fake accounts, shared devices with multiple sign-ups, or coordinated abuse — all related referral rewards may be cancelled without notice.</p>
          </div>
        </section>

        {/* 5. Prohibited Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3 flex items-center gap-2">
            <Ban className="h-5 w-5" /> 5. Prohibited Actions
          </h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p>The following activities are strictly prohibited and may result in account suspension or permanent ban:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Creating fake or duplicate accounts to earn coupons or referral rewards.</li>
              <li>Sharing, selling, or trading coupon codes obtained through personal rewards.</li>
              <li>Using automated tools, bots, or scripts to exploit the coupon or referral system.</li>
              <li>Manipulating order data or attempting to tamper with pricing through coupons.</li>
              <li>Any form of coordinated abuse involving multiple users or accounts.</li>
            </ul>
          </div>
        </section>

        {/* 6. Admin Rights */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> 6. Administrator Rights
          </h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p>UGTOPUPS administrators reserve the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Cancel, revoke, or void any coupon if misuse or fraudulent activity is detected.</li>
              <li>Modify, pause, or discontinue any promotion, offer, or referral program at any time without prior notice.</li>
              <li>Suspend or permanently ban accounts involved in fraudulent or abusive behavior.</li>
              <li>Adjust coupon terms, discount values, or validity periods as needed.</li>
              <li>Make the final decision in any dispute related to coupons, rewards, or referral benefits.</li>
            </ul>
          </div>
        </section>

        {/* 7. Contact */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-destructive mb-3">7. Questions or Concerns</h2>
          <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <p>If you have any questions about our coupon policy or believe there has been an error with your rewards, please contact our support team. We are committed to ensuring a fair and transparent experience for all users.</p>
          </div>
        </section>

        <div className="border-t border-border pt-6 text-xs text-muted-foreground text-center">
          This policy is effective as of March 2026 and may be updated at any time. Continued use of coupons and promotions constitutes acceptance of these terms.
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CouponPolicy;
