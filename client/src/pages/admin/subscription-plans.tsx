import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { SubscriptionPlan } from "@shared/schema";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  PencilLine, 
  Trash2, 
  CreditCard, 
  Tag, 
  Check, 
  X, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";

const subscriptionPlanSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(200),
  price: z.number().min(0).max(1000),
  stripePriceId: z.string().min(5),
  features: z.string(),
  active: z.boolean().default(true),
});

type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanSchema>;

const defaultFormValues: SubscriptionPlanFormValues = {
  name: "",
  description: "",
  price: 0,
  stripePriceId: "",
  features: "[]",
  active: true,
};

export default function SubscriptionPlansPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [addFeatureInput, setAddFeatureInput] = useState("");
  const [featuresList, setFeaturesList] = useState<string[]>([]);

  const form = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: defaultFormValues,
  });

  // Fetch all subscription plans
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create subscription plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: SubscriptionPlanFormValues) => {
      const res = await apiRequest("POST", "/api/admin/subscription-plans", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsDialogOpen(false);
      form.reset(defaultFormValues);
      setFeaturesList([]);
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription plan",
        variant: "destructive",
      });
    },
  });

  // Update subscription plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: SubscriptionPlanFormValues & { id: number }) => {
      const { id, ...planData } = data;
      const res = await apiRequest("PATCH", `/api/admin/subscription-plans/${id}`, planData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setIsDialogOpen(false);
      form.reset(defaultFormValues);
      setEditingPlan(null);
      setFeaturesList([]);
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  // Delete subscription plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/subscription-plans/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: SubscriptionPlanFormValues) {
    // Update features list in JSON format
    const formData = {
      ...values,
      features: JSON.stringify(featuresList),
    };

    if (editingPlan) {
      updatePlanMutation.mutate({
        id: editingPlan.id,
        ...formData,
      });
    } else {
      createPlanMutation.mutate(formData);
    }
  }

  // Open dialog for creating a new plan
  const openCreateDialog = () => {
    form.reset(defaultFormValues);
    setEditingPlan(null);
    setFeaturesList([]);
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing plan
  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    
    // Parse features from JSON string
    let features: string[] = [];
    try {
      features = JSON.parse(plan.features);
    } catch (e) {
      console.error("Error parsing features:", e);
    }
    
    setFeaturesList(features);
    
    form.reset({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      stripePriceId: plan.stripePriceId,
      features: plan.features,
      active: plan.active,
    });
    
    setIsDialogOpen(true);
  };

  // Handle feature input
  const addFeature = () => {
    if (addFeatureInput.trim() !== "") {
      setFeaturesList([...featuresList, addFeatureInput.trim()]);
      setAddFeatureInput("");
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    const newFeatures = [...featuresList];
    newFeatures.splice(index, 1);
    setFeaturesList(newFeatures);
  };

  // Handle delete plan
  const handleDeletePlan = (plan: SubscriptionPlan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.name}" plan?`)) {
      deletePlanMutation.mutate(plan.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Plan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Plans</CardTitle>
            <CardDescription>
              Create and manage subscription plans for your SaaS application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>List of available subscription plans.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans && plans.length > 0 ? (
                      plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>{plan.description}</TableCell>
                          <TableCell>${plan.price.toFixed(2)}/month</TableCell>
                          <TableCell>
                            {plan.active ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              try {
                                const features = JSON.parse(plan.features);
                                return features.length > 0 ? (
                                  <div className="text-sm">
                                    {features.slice(0, 2).map((feature: string, i: number) => (
                                      <div key={i} className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        <span className="truncate max-w-[200px]">{feature}</span>
                                      </div>
                                    ))}
                                    {features.length > 2 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{features.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No features</span>
                                );
                              } catch (e) {
                                return <span className="text-sm text-muted-foreground">Invalid features format</span>;
                              }
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(plan)}
                                title="Edit plan"
                              >
                                <PencilLine className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlan(plan)}
                                title="Delete plan"
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No subscription plans found. Create your first plan!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Edit the details of the subscription plan"
                : "Create a new subscription plan for your customers"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Pro Plan" {...field} />
                      </FormControl>
                      <FormDescription>
                        A short, distinctive name for the plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD/month)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="49.99"
                          min={0}
                          step={0.01}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Monthly subscription price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripePriceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe Price ID</FormLabel>
                      <FormControl>
                        <Input placeholder="price_..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Price ID from Stripe dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this plan available to customers
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full access to premium features with unlimited jobs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what users get with this plan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div>
                  <FormLabel>Features</FormLabel>
                  <FormDescription>
                    Add features included in this plan
                  </FormDescription>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a feature..."
                      value={addFeatureInput}
                      onChange={(e) => setAddFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button type="button" onClick={addFeature}>
                      Add
                    </Button>
                  </div>

                  <div className="rounded-md border p-4 space-y-2">
                    {featuresList.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        No features added yet
                      </div>
                    ) : (
                      featuresList.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(index)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                >
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}