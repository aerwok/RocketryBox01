import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Mail, 
    Phone, 
    Calendar, 
    ClipboardList, 
    User2, 
    Building, 
    Briefcase,
    IdCard,
    UserCog,
    Lock,
    Clock
} from "lucide-react";
import { useEffect, useState } from "react";
import { ApiService } from "@/services/api.service";
import { toast } from "sonner";

// Define interface for orders
interface Order {
    id: string;
    date: string;
    status: string;
    amount: string;
}

// Define user data interface
interface AdminUser {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    status: "Active" | "Inactive" | "On Leave";
    joinDate: string;
    lastActive: string;
    department: string;
    role: "Admin" | "Manager" | "Support" | "Agent";
    isSuperAdmin: boolean;
    remarks: string;
    profileImage?: string;
    transactions: {
        total: number;
        successful: number;
        failed: number;
    };
    recentOrders: Order[];
}

const MyProfilePage = () => {
    const [userData, setUserData] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const apiService = new ApiService();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiService.get<AdminUser>('/admin/profile');
                setUserData(response.data);
            } catch (error) {
                toast.error('Failed to fetch profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!userData) {
        return <div>Failed to load profile data</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-semibold">
                        My Profile
                    </h1>
                    <p className="text-base lg:text-lg text-muted-foreground mt-1">
                        View your profile information and account details
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                    </Button>
                </div>
            </div>

            {/* User Info Card */}
            <Card className="shadow-none overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                <CardContent className="p-6 -mt-12">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                            {userData.profileImage ? (
                                <img 
                                    src={userData.profileImage} 
                                    alt={userData.fullName} 
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-2xl font-semibold text-purple-600">
                                        {userData.fullName.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 mt-4 sm:mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <h2 className="text-2xl font-semibold">
                                    {userData.fullName}
                                </h2>
                                <div className="flex gap-2">
                                    <Badge variant={userData.status === "Active" ? "secondary" : "outline"}>
                                        {userData.status}
                                    </Badge>
                                    {userData.isSuperAdmin && (
                                        <Badge variant="default" className="bg-purple-600">
                                            Super Admin
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {userData.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {userData.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                    <IdCard className="w-4 h-4" />
                                    {userData.employeeId}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.transactions.total} Actions</div>
                        <p className="text-xs text-muted-foreground">
                            <Clock className="inline mr-1 h-4 w-4 text-muted-foreground" /> Last active: {userData.lastActive}
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Successful Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.transactions.successful}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-500 font-medium">{Math.round((userData.transactions.successful / userData.transactions.total) * 100)}%</span> success rate
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userData.department}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">{userData.role}</span> level access
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">
                        <User2 className="w-4 h-4 mr-2" />
                        Personal Details
                    </TabsTrigger>
                    <TabsTrigger value="role">
                        <UserCog className="w-4 h-4 mr-2" />
                        Role & Access
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Recent Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User2 className="w-5 h-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Full Name
                                    </label>
                                    <div className="font-medium mt-1">
                                        {userData.fullName}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Employee ID
                                    </label>
                                    <div className="font-medium mt-1">
                                        {userData.employeeId}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Email Address
                                    </label>
                                    <div className="font-medium mt-1">
                                        {userData.email}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Phone Number
                                    </label>
                                    <div className="font-medium mt-1">
                                        {userData.phone}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm text-muted-foreground">
                                        Address
                                    </label>
                                    <div className="font-medium mt-1">
                                        {userData.address}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Join Date
                                    </label>
                                    <div className="flex items-center gap-2 mt-1 font-medium">
                                        <Calendar className="w-4 h-4 text-purple-600" />
                                        {userData.joinDate}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Last Active
                                    </label>
                                    <div className="flex items-center gap-2 mt-1 font-medium">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        {userData.lastActive}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="w-5 h-5" />
                                Remarks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{userData.remarks || "No remarks available."}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="role" className="space-y-4">
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" />
                                Role Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Department
                                    </label>
                                    <div className="flex items-center gap-2 mt-1 font-medium">
                                        <Building className="w-4 h-4 text-blue-600" />
                                        {userData.department}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Role
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="font-medium">
                                            {userData.role}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Admin Status
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={userData.status === "Active" ? "secondary" : "outline"}>
                                            {userData.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">
                                        Admin Type
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        {userData.isSuperAdmin ? (
                                            <Badge className="bg-purple-600">Super Admin</Badge>
                                        ) : (
                                            <Badge variant="outline">Regular Admin</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Account Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-muted-foreground">
                                    <strong>Join Date:</strong> {userData.joinDate}
                                </p>
                                <p className="text-muted-foreground mt-2">
                                    <strong>Last Active:</strong> {userData.lastActive}
                                </p>
                                <p className="text-muted-foreground mt-2">
                                    <strong>Account ID:</strong> {userData.id}
                                </p>
                                <p className="text-muted-foreground mt-4">
                                    For detailed information about your specific access rights or to request changes, please contact the system administrator.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="w-5 h-5" />
                                Recent Orders Handled
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {userData.recentOrders.length > 0 ? (
                                    userData.recentOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {order.id}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {order.date}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant={
                                                    order.status === "Completed" ? "secondary" : 
                                                    order.status === "Processing" ? "outline" : 
                                                    "destructive"
                                                }>
                                                    {order.status}
                                                </Badge>
                                                <div className="font-medium">
                                                    {order.amount}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-muted-foreground">No recent orders found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MyProfilePage; 