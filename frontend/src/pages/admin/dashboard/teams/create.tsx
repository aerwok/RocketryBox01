import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { teamMemberRegisterSchema, type TeamMemberRegisterInput } from "@/lib/validations/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ServiceFactory } from "@/services/service-factory";
import { useNavigate } from "react-router-dom";

const TeamMemberCreatePage = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sendInvitation, setSendInvitation] = useState<boolean>(true);

    const form = useForm<TeamMemberRegisterInput>({
        resolver: zodResolver(teamMemberRegisterSchema),
        defaultValues: {
            fullName: "",
            email: "",
            role: "Agent",
            department: "",
            phoneNumber: "",
            address: "",
            dateOfJoining: format(new Date(), "yyyy-MM-dd"),
            designation: "",
            remarks: "",
            sendInvitation: true,
        },
    });

    const handleSendInvitationToggle = (checked: boolean) => {
        setSendInvitation(checked);
        form.setValue("sendInvitation", checked);
    };

    const onSubmit = async (data: TeamMemberRegisterInput) => {
        try {
            setSubmitting(true);
            setError(null);
            
            const response = await ServiceFactory.admin.registerAdminTeamMember(data);
            
            if (response.success) {
                toast.success("Team Member Registered", {
                    description: data.sendInvitation 
                        ? "Team member registered successfully. Welcome email with login credentials sent to their email address."
                        : "Team member registered successfully. Please provide login credentials manually."
                });
                
                // Navigate back to team list
                navigate("/admin/dashboard/teams");
            } else {
                throw new Error(response.message || "Failed to register team member");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err instanceof Error ? err.message : "Failed to register team member. Please try again.");
            toast.error("Registration Failed", {
                description: "There was an error processing your request."
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pt-10 bg-white">
            <div className="container mx-auto p-4 h-full">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/dashboard/teams")}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Team
                        </Button>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">
                            Add New Team Member
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Register a new team member with auto-generated Employee ID and credentials
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <span className="font-medium">Registration Error</span>
                            </div>
                            <p className="mt-1 text-sm">{error}</p>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="space-y-4 md:col-span-2">
                                    <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter full name"
                                                            className="bg-[#F8F7FF]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="Enter email address"
                                                            className="bg-[#F8F7FF]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phoneNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter phone number"
                                                            className="bg-[#F8F7FF]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="designation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Designation</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter designation"
                                                            className="bg-[#F8F7FF]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Role and Department */}
                                <div className="space-y-4 md:col-span-2">
                                    <h2 className="text-lg font-medium border-b pb-2">Role Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                                <SelectValue placeholder="Select a role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Admin">Admin</SelectItem>
                                                            <SelectItem value="Manager">Manager</SelectItem>
                                                            <SelectItem value="Support">Support</SelectItem>
                                                            <SelectItem value="Agent">Agent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Department *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                                <SelectValue placeholder="Select a department" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Executive">Executive</SelectItem>
                                                            <SelectItem value="Finance">Finance</SelectItem>
                                                            <SelectItem value="IT">IT</SelectItem>
                                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                                            <SelectItem value="Sales">Sales</SelectItem>
                                                            <SelectItem value="Customer Support">Customer Support</SelectItem>
                                                            <SelectItem value="Human Resources">Human Resources</SelectItem>
                                                            <SelectItem value="Logistics">Logistics</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dateOfJoining"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Date of Joining</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal bg-[#F8F7FF]",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(new Date(field.value), "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="space-y-4 md:col-span-2">
                                    <h2 className="text-lg font-medium border-b pb-2">Additional Information</h2>
                                    
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter address"
                                                        className="bg-[#F8F7FF] resize-none"
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="remarks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Remarks</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter any additional remarks"
                                                        className="bg-[#F8F7FF] resize-none"
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Invitation Settings */}
                                <div className="space-y-4 md:col-span-2">
                                    <h2 className="text-lg font-medium border-b pb-2">Invitation Settings</h2>
                                    
                                    <FormField
                                        control={form.control}
                                        name="sendInvitation"
                                        render={() => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-4 hover:bg-purple-100 transition-colors">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-purple-800 font-medium cursor-pointer" onClick={() => handleSendInvitationToggle(!sendInvitation)}>
                                                        Send Invitation Email
                                                    </FormLabel>
                                                    <p className="text-xs text-purple-700">
                                                        Send welcome email with auto-generated Employee ID, temporary password, and admin login URL
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium ${sendInvitation ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {sendInvitation ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                    <FormControl>
                                                        <Switch
                                                            checked={sendInvitation}
                                                            onCheckedChange={handleSendInvitationToggle}
                                                            className="data-[state=checked]:bg-purple-600"
                                                        />
                                                    </FormControl>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Auto-Generated Information Notice */}
                                <div className="md:col-span-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-blue-800 mb-2">Auto-Generated Information</h3>
                                        <ul className="text-xs text-blue-700 space-y-1">
                                            <li>• Employee ID will be auto-generated based on department and year (e.g., FIN24001)</li>
                                            <li>• Temporary password will be generated and sent via email</li>
                                            <li>• Welcome email will include admin login URL and all credentials</li>
                                            <li>• User will be prompted to change password on first login</li>
                                            <li>• Default permissions will be assigned based on role</li>
                                            <li>• Email verification OTP will be included for account activation</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/admin/dashboard/teams")}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="purple"
                                    disabled={submitting}
                                    className="min-w-[120px]"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Registering...
                                        </>
                                    ) : (
                                        "Register Team Member"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default TeamMemberCreatePage; 