import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, PlusCircle, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema for creating a new super admin
const createSuperAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
});

// Schema for creating a plan
const createPlanSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  stripePriceId: z.string().min(5),
  features: z.string(),
  active: z.boolean().default(true),
});

type CreateSuperAdminFormValues = z.infer<typeof createSuperAdminSchema>;
type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export default function SuperAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const [isCreateSuperAdminDialogOpen, setIsCreateSuperAdminDialogOpen] = useState(false);
  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  
  // Only super admins should access this page
  if (user?.role !== "superadmin") {
    return (
      <AdminLayout>
        <div className="container py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Only super administrators can access this page.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Form for creating a super admin
  const superAdminForm = useForm<CreateSuperAdminFormValues>({
    resolver: zodResolver(createSuperAdminSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Form for creating a plan
  const planForm = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stripePriceId: "",
      features: "[]",
      active: true,
    },
  });

  // Mutation to create a super admin
  const createSuperAdminMutation = useMutation({
    mutationFn: async (data: CreateSuperAdminFormValues) => {
      const res = await apiRequest("POST", "/api/admin/super-admin", {
        ...data,
        role: "superadmin",
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsCreateSuperAdminDialogOpen(false);
      superAdminForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Super admin created",
        description: "The super admin has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create super admin",
        variant: "destructive",
      });
    },
  });

  // Mutation to create a plan
  const createPlanMutation = useMutation({
    mutationFn: async (data: CreatePlanFormValues) => {
      const res = await apiRequest("POST", "/api/admin/subscription-plans", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsCreatePlanDialogOpen(false);
      planForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      toast({
        title: "Plan created",
        description: "The subscription plan has been created successfully",
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

  // Handle form submissions
  const onCreateSuperAdminSubmit = (data: CreateSuperAdminFormValues) => {
    createSuperAdminMutation.mutate(data);
  };

  const onCreatePlanSubmit = (data: CreatePlanFormValues) => {
    // Ensure features is a valid JSON string
    try {
      const features = data.features.trim();
      if (features.startsWith('[') && features.endsWith(']')) {
        JSON.parse(features);
      } else {
        // If not a valid JSON array, convert it to one
        const featuresList = features.split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0);
        data.features = JSON.stringify(featuresList);
      }
    } catch (e) {
      // If there's an error parsing JSON, wrap it as an array
      const featuresList = data.features.split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      data.features = JSON.stringify(featuresList);
    }
    
    createPlanMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage super admin users, subscription plans and system settings
            </p>
          </div>
          <div className="space-x-2">
            <Button 
              onClick={() => setIsCreateSuperAdminDialogOpen(true)}
              variant="outline"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Create Super Admin
            </Button>
            <Button 
              onClick={() => setIsCreatePlanDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Super Admins
            </TabsTrigger>
            <TabsTrigger value="plans">
              <RefreshCw className="mr-2 h-4 w-4" />
              Subscription Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Super Admin Users</CardTitle>
                <CardDescription>
                  Super admins have full control over the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : users ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 p-4 font-medium bg-muted">
                      <div>Username</div>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Created At</div>
                    </div>
                    <div className="divide-y">
                      {Array.isArray(users) && users.filter((u: any) => u.role === "superadmin").map((user: any) => (
                        <div key={user.id} className="grid grid-cols-4 p-4">
                          <div>{user.username}</div>
                          <div>{user.email}</div>
                          <div>
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {user.role}
                            </span>
                          </div>
                          <div>
                            {user.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString() 
                              : "N/A"}
                          </div>
                        </div>
                      ))}
                      
                      {Array.isArray(users) && users.filter((u: any) => u.role === "superadmin").length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                          No super admin users found. Create one to get started.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Failed to load user data
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Manage subscription plans and pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPlans ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : plans ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-5 p-4 font-medium bg-muted">
                      <div>Name</div>
                      <div>Description</div>
                      <div>Price</div>
                      <div>Status</div>
                      <div>Features</div>
                    </div>
                    <div className="divide-y">
                      {Array.isArray(plans) && plans.map((plan: any) => (
                        <div key={plan.id} className="grid grid-cols-5 p-4">
                          <div>{plan.name}</div>
                          <div className="truncate max-w-xs">{plan.description}</div>
                          <div>${plan.price.toFixed(2)}</div>
                          <div>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              plan.active 
                                ? "bg-green-50 text-green-700 ring-green-700/10"
                                : "bg-gray-50 text-gray-700 ring-gray-700/10"
                            }`}>
                              {plan.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div>
                            <div className="max-h-20 overflow-y-auto">
                              <ul className="list-disc list-inside text-sm">
                                {JSON.parse(plan.features).map((feature: string, i: number) => (
                                  <li key={i}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {Array.isArray(plans) && plans.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                          No subscription plans found. Create one to get started.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Failed to load subscription plans
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Super Admin Dialog */}
        <Dialog 
          open={isCreateSuperAdminDialogOpen} 
          onOpenChange={setIsCreateSuperAdminDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Super Admin</DialogTitle>
              <DialogDescription>
                Add a new super admin user with full access to the platform
              </DialogDescription>
            </DialogHeader>
            <Form {...superAdminForm}>
              <form onSubmit={superAdminForm.handleSubmit(onCreateSuperAdminSubmit)} className="space-y-4">
                <FormField
                  control={superAdminForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={superAdminForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={superAdminForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={superAdminForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateSuperAdminDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createSuperAdminMutation.isPending}
                  >
                    {createSuperAdminMutation.isPending ? "Creating..." : "Create Super Admin"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Create Plan Dialog */}
        <Dialog 
          open={isCreatePlanDialogOpen} 
          onOpenChange={setIsCreatePlanDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>
                Add a new subscription plan with custom features and pricing
              </DialogDescription>
            </DialogHeader>
            <Form {...planForm}>
              <form onSubmit={planForm.handleSubmit(onCreatePlanSubmit)} className="space-y-4">
                <FormField
                  control={planForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Pro Plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={planForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Advanced features for professional users" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={planForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="stripePriceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Price ID</FormLabel>
                        <FormControl>
                          <Input placeholder="price_..." {...field} />
                        </FormControl>
                        <FormDescription>
                          From Stripe dashboard
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={planForm.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter features (one per line) or a JSON array" 
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter one feature per line or a JSON array
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={planForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <FormDescription>
                          Make this plan available to users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreatePlanDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPlanMutation.isPending}
                  >
                    {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}