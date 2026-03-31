import { SignUp } from "@clerk/nextjs";
import { PricingPlans } from "@/components/pricing/PricingPlans";

export default function SignUpPage() {
  return (
    <div className="flex flex-col lg:flex-row bg-background">
      {/* Left Side: Pricing — scrollable */}
      <div className="flex-1 border-r bg-muted/30 p-8 lg:p-12 xl:p-16">
        <PricingPlans />
      </div>

      {/* Right Side: Sign Up Form — sticky, never scrolls away */}
      <div className="lg:w-[500px] xl:w-[560px] shrink-0 lg:sticky lg:top-0 lg:h-screen flex items-center justify-center p-8 lg:p-12 bg-background border-l shadow-xl z-10">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground text-sm">Start your 14-day free trial. No credit card required.</p>
          </div>
          <div className="flex justify-center flex-col items-center">
            <SignUp appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "w-full shadow-none sm:shadow-none border-none p-0 bg-transparent rounded-none",
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
