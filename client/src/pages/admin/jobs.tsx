import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { User, Job, OptimizationResult } from "@shared/schema";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPercent } from "@/lib/utils";
import { Search, BarChart3, FileDown, EyeIcon, Activity } from "lucide-react";

export default function AdminJobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);

  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch all jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch job results when a job is selected
  const { data: jobResult, isLoading: isLoadingJobResult } = useQuery<OptimizationResult>({
    queryKey: ["/api/admin/jobs", selectedJob?.id, "result"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedJob,
  });

  // Filter jobs based on search term
  const filteredJobs = jobs?.filter(
    (job) =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(job.id).includes(searchTerm) ||
      (users?.find(u => u.id === job.userId)?.username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString() + " " + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Open job dialog
  const openJobDialog = (job: Job) => {
    setSelectedJob(job);
    setIsJobDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Job Management</h1>
          <Button className="gap-2">
            <FileDown className="h-4 w-4" /> Export Jobs
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search jobs by name, ID or username..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableCaption>A list of all cutting optimization jobs in the system.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Stock Length</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading jobs...
                      </TableCell>
                    </TableRow>
                  ) : filteredJobs && filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => {
                      const user = users?.find(u => u.id === job.userId);
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.name}</TableCell>
                          <TableCell>{formatDate(job.createdAt)}</TableCell>
                          <TableCell>
                            {user ? (
                              <div className="flex items-center gap-2">
                                <span>{user.username}</span>
                                {user.role === "admin" && (
                                  <Badge className="bg-purple-500">Admin</Badge>
                                )}
                              </div>
                            ) : (
                              "Unknown"
                            )}
                          </TableCell>
                          <TableCell>
                            {job.stockLength ? `${job.stockLength} mm` : "N/A"}
                          </TableCell>
                          <TableCell>
                            {job.efficiency ? formatPercent(job.efficiency) : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openJobDialog(job)}
                              >
                                <span className="sr-only">View job details</span>
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">View job activity</span>
                                <Activity className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No jobs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected cutting optimization job.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingJobResult ? (
            <div className="flex justify-center py-8">
              <BarChart3 className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Job Name</div>
                  <div className="text-sm text-muted-foreground">{selectedJob?.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(selectedJob?.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">User</div>
                  <div className="text-sm text-muted-foreground">
                    {users?.find(u => u.id === selectedJob?.userId)?.username || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Stock Length</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedJob?.stockLength ? `${selectedJob.stockLength} mm` : "N/A"}
                  </div>
                </div>
              </div>

              {jobResult && (
                <>
                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Optimization Results</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                        <div className="text-lg font-bold">
                          {formatPercent(jobResult.metrics.efficiency)}
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Stock Used</div>
                        <div className="text-lg font-bold">
                          {jobResult.metrics.stockUsed} pipes
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Total Stock</div>
                        <div className="text-lg font-bold">
                          {jobResult.metrics.stockTotal} mm
                        </div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Waste</div>
                        <div className="text-lg font-bold">
                          {jobResult.metrics.wasteTotal} mm
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-medium mb-2">Cutting Patterns</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pattern #</TableHead>
                            <TableHead>Pipe</TableHead>
                            <TableHead>Efficiency</TableHead>
                            <TableHead>Waste</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobResult.patterns.map(({ pattern }, index) => (
                            <TableRow key={pattern.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{pattern.stockPipeIndex + 1}</TableCell>
                              <TableCell>{formatPercent(pattern.efficiency)}</TableCell>
                              <TableCell>{pattern.waste} mm</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}