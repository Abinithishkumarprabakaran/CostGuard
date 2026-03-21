import { SignUp } from "@clerk/nextjs";
import { PricingPlans } from "@/components/pricing/PricingPlans";

export default function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background">
      {/* Left Side: Pricing */}
      <div className="flex-1 border-r bg-muted/30 p-8 lg:p-12 xl:p-16 overflow-y-auto">
        <PricingPlans />
      </div>

      {/* Right Side: Sign Up Form */}
      <div className="lg:w-[500px] xl:w-[600px] flex items-center justify-center p-8 lg:p-12 shrink-0 bg-background shadow-lg z-10">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="lg:hidden text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">Start optimizing your AWS costs today.</p>
          </div>
          <div className="flex justify-center flex-col items-center">
            <SignUp appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "w-full shadow-none sm:shadow-none border-none p-0 bg-transparent rounded-none",
                headerTitle: "hidden lg:block",
                headerSubtitle: "hidden lg:block",
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
