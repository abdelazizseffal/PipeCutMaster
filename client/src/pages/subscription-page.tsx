import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionPlan } from "@shared/schema";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Check, 
  CreditCard, 
  Shield, 
  Crown,
  Sparkles,
  Tag 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Make sure to load Stripe outside of component render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile?tab=billing&success=true`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || "An unexpected error occurred.");
        toast({
          title: "Payment failed",
          description: error.message || "Your payment could not be processed.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment successful",
          description: "Your subscription has been activated!",
        });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="text-sm text-red-500 mt-2">{errorMessage}</div>
      )}
      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Subscribe Now"}
        </Button>
      </div>
    </form>
  );
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [currentTab, setCurrentTab] = useState("monthly");

  // Fetch available subscription plans
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create or get subscription
  const subscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/create-subscription", { planId });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setIsPaymentModalOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  // Handle subscription purchase
  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    subscriptionMutation.mutate(plan.id);
  };

  // Close payment modal and refresh user data
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };

  // Filter plans by billing period
  const filteredPlans = plans?.filter(plan => {
    // This is where you would filter by billing period if you have that data
    return true;
  });

  // Parse features for a plan
  const getFeatures = (plan: SubscriptionPlan) => {
    try {
      return JSON.parse(plan.features) as string[];
    } catch (e) {
      return [];
    }
  };

  // Check if a plan is the user's current plan
  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return user?.stripePlanId === plan.stripePriceId;
  };

  return (
    <div className="container py-10">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock advanced features and optimize your pipe cutting process with our premium plans
          </p>
        </div>

        <Tabs 
          defaultValue="monthly" 
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-fit mx-auto"
        >
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
            <TabsTrigger value="annually">Annual Billing (Save 20%)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPlans && filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => {
              const features = getFeatures(plan);
              const isCurrent = isCurrentPlan(plan);
              
              return (
                <Card 
                  key={plan.id} 
                  className={`border-2 overflow-hidden flex flex-col ${
                    isCurrent ? "border-primary" : ""
                  }`}
                >
                  {isCurrent && (
                    <div className="bg-primary text-center py-1 text-white text-sm font-medium">
                      Your Current Plan
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      {plan.price === 0 ? (
                        <Tag className="h-8 w-8 text-primary" />
                      ) : plan.price < 50 ? (
                        <Crown className="h-8 w-8 text-primary" />
                      ) : (
                        <Sparkles className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center flex-1">
                    <div className="mb-6">
                      <p className="text-4xl font-bold">${plan.price.toFixed(2)}</p>
                      <p className="text-muted-foreground">per month</p>
                    </div>
                    
                    <div className="space-y-3 text-left">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={isCurrent ? "outline" : "default"} 
                      className="w-full"
                      disabled={isCurrent || subscriptionMutation.isPending}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {isCurrent 
                        ? "Current Plan" 
                        : subscriptionMutation.isPending && selectedPlan?.id === plan.id
                          ? "Processing..." 
                          : plan.price === 0 
                            ? "Get Started" 
                            : "Subscribe"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-muted-foreground">No subscription plans available</p>
            </div>
          )}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <div className="border rounded-lg p-8 bg-background/50">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Secure Payment Processing</h3>
                <p className="text-muted-foreground">
                  All payments are securely processed by Stripe. Your card information is never stored on our servers.
                  We offer a 30-day money-back guarantee for all subscription plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog 
        open={isPaymentModalOpen && !!clientSecret} 
        onOpenChange={setIsPaymentModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <div className="mt-2">
                  <p>You are subscribing to the <strong>{selectedPlan.name}</strong> plan.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You will be charged ${selectedPlan.price.toFixed(2)} per month.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handlePaymentSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}