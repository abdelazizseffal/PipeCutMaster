import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Job, User } from "@shared/schema";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Search, BarChart3, Download, Filter } from "lucide-react";

// Sample data for activity graphs
const activityData = [
  { date: "2025-04-20", jobs: 5, users: 2 },
  { date: "2025-04-21", jobs: 8, users: 3 },
  { date: "2025-04-22", jobs: 12, users: 5 },
  { date: "2025-04-23", jobs: 15, users: 4 },
  { date: "2025-04-24", jobs: 18, users: 7 },
  { date: "2025-04-25", jobs: 25, users: 9 },
  { date: "2025-04-26", jobs: 30, users: 12 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Subscription distribution data
const subscriptionData = [
  { name: "Active", value: 68 },
  { name: "Inactive", value: 12 },
  { name: "Free", value: 20 },
];

export default function AdminActivityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  
  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch all jobs
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter jobs based on date
  const getFilteredJobs = () => {
    if (!jobs) return [];
    
    let filteredJobs = [...jobs];
    
    if (searchTerm) {
      filteredJobs = filteredJobs.filter(
        job => job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        users?.find(u => u.id === job.userId)?.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (filter) {
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredJobs = filteredJobs.filter(job => 
          job.createdAt && new Date(job.createdAt) >= today
        );
        break;
      case "week":
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        filteredJobs = filteredJobs.filter(job => 
          job.createdAt && new Date(job.createdAt) >= lastWeek
        );
        break;
      case "month":
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        filteredJobs = filteredJobs.filter(job => 
          job.createdAt && new Date(job.createdAt) >= lastMonth
        );
        break;
      default:
        break;
    }
    
    // Sort by most recent
    return filteredJobs.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Activity</h1>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>

        {/* Activity Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Activities Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs?.filter(job => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return job.createdAt && new Date(job.createdAt) >= today;
                }).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Jobs processed today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(jobs?.map(job => job.userId)).size || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Users who have created jobs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8s</div>
              <p className="text-xs text-muted-foreground">
                Per optimization job
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      stroke="#8884d8"
                      name="Jobs"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#82ca9d"
                      name="Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search activity..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("today")}
                >
                  Today
                </Button>
                <Button
                  variant={filter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("week")}
                >
                  This Week
                </Button>
                <Button
                  variant={filter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("month")}
                >
                  This Month
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableCaption>Recent user activity and job logs</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredJobs().map((job) => {
                    const user = users?.find(u => u.id === job.userId);
                    return (
                      <TableRow key={job.id}>
                        <TableCell>{formatDate(job.createdAt)}</TableCell>
                        <TableCell>{formatTime(job.createdAt)}</TableCell>
                        <TableCell>{user?.username || "Unknown"}</TableCell>
                        <TableCell>Created job: {job.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">View details</span>
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {getFilteredJobs().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No activity found for the selected period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}