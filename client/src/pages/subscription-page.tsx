import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPlan } from "@shared/schema";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// Features with icons
const features = {
  basic: [
    { name: "Basic cutting optimization", included: true },
    { name: "Limited to 5 jobs", included: true },
    { name: "Standard support", included: true },
    { name: "Advanced optimization algorithms", included: false },
    { name: "Unlimited jobs", included: false },
    { name: "Priority support", included: false },
  ],
  pro: [
    { name: "Basic cutting optimization", included: true },
    { name: "Unlimited jobs", included: true },
    { name: "Standard support", included: true },
    { name: "Advanced optimization algorithms", included: true },
    { name: "Custom cutting patterns", included: true },
    { name: "Priority support", included: true },
  ],
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/create-subscription", { planId });
      return await res.json();
    },
    onSuccess: async (data) => {
      if (data.clientSecret) {
        const stripe = await stripePromise;
        if (!stripe) {
          toast({
            title: "Error",
            description: "Stripe is not available",
            variant: "destructive",
          });
          return;
        }

        setIsCheckingOut(true);

        // Redirect to Stripe Checkout
        const { error } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: {
              token: "tok_visa", // Only for testing
            },
          },
        });

        if (error) {
          toast({
            title: "Payment failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Subscription active",
            description: "Your subscription is now active. Thank you!",
          });
        }
        
        setIsCheckingOut(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    createSubscriptionMutation.mutate(plan.id);
  };

  // Helper function to determine if a user has an active subscription
  const hasActiveSubscription = user?.subscriptionStatus === "active";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Select the right subscription plan for your pipe cutting optimization needs
          </p>
        </div>

        {hasActiveSubscription && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center">
            <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
            <div>
              <h3 className="font-medium text-green-800">Active Subscription</h3>
              <p className="text-green-700">You currently have an active subscription. Enjoy all premium features!</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {plans?.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden ${
                plan.name.toLowerCase().includes("pro") ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.name.toLowerCase().includes("pro") && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                  RECOMMENDED
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(features[plan.name.toLowerCase().includes("pro") ? "pro" : "basic"] || []).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe(plan)}
                  disabled={
                    hasActiveSubscription || 
                    createSubscriptionMutation.isPending || 
                    isCheckingOut
                  }
                  className="w-full"
                  variant={plan.name.toLowerCase().includes("pro") ? "default" : "outline"}
                >
                  {createSubscriptionMutation.isPending && selectedPlan?.id === plan.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {hasActiveSubscription ? "Current Plan" : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}