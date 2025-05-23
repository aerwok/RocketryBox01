import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, EyeIcon, EyeOffIcon, UserIcon, FileText, UploadCloud, Loader2, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminRegisterSchema, type AdminRegisterInput } from "@/lib/validations/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { z } from "zod";

// Document upload interface
interface UploadedFile {
    name: string;
    size: number;
    type: string;
    preview?: string;
}

// Allowed file types
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// API functions for future implementation
// --------------------------------------
// async function registerAdmin(formData: FormData): Promise<{ success: boolean; message: string; adminId?: string }> {
//   try {
//     const response = await fetch('/api/admin/register', {
//       method: 'POST',
//       body: formData,
//     });
//     
//     const data = await response.json();
//     
//     if (!response.ok) {
//       throw new Error(data.message || 'Failed to register admin');
//     }
//     
//     return data;
//   } catch (error) {
//     console.error('Error registering admin:', error);
//     throw error;
//   }
// }
// --------------------------------------

const AdminRegisterPage = () => {

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileUploadError, setFileUploadError] = useState<string | null>(null);

    const form = useForm<AdminRegisterInput>({
        resolver: zodResolver(adminRegisterSchema),
        defaultValues: {
            fullName: "",
            email: "",
            role: "Admin",
            department: "",
            phoneNumber: "",
            address: "",
            dateOfJoining: format(new Date(), "yyyy-MM-dd"),
            employeeId: "",
            isSuperAdmin: false,
            remarks: "",
            password: "",
            confirmPassword: "",
        },
    });

    const handleSuperAdminToggle = (checked: boolean) => {
        setIsSuperAdmin(checked);
        form.setValue("isSuperAdmin", checked);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error("Profile image is too large", {
                description: "Maximum file size is 5MB"
            });
            return;
        }
        
        // Check file type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            toast.error("Invalid file type", {
                description: "Only JPEG, JPG and PNG images are allowed"
            });
            return;
        }
        
            form.setValue("profileImage", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileUploadError(null);
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        // Validate each file
        const validFiles: UploadedFile[] = [];
        const errors: string[] = [];
        
        Array.from(files).forEach(file => {
            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name} exceeds the maximum file size of 5MB`);
                return;
            }
            
            // Check file type
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                errors.push(`${file.name} has an invalid file type`);
                return;
            }
            
            validFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
            });
        });
        
        if (errors.length > 0) {
            setFileUploadError(errors.join('\n'));
            return;
        }
        
        setUploadedFiles(prev => [...prev, ...validFiles]);
        
        // Reset the input so the same file can be uploaded again if needed
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: z.infer<typeof adminRegisterSchema>) => {
        try {
            setSubmitting(true);
            setError(null);
            
            // When API is ready, this section would create a FormData object
            // const formData = new FormData();
            // Object.entries(data).forEach(([key, value]) => {
            //   if (key !== "profileImage" && value !== undefined) {
            //     formData.append(key, String(value));
            //   }
            // });
            // 
            // if (data.profileImage) {
            //   formData.append("profileImage", data.profileImage);
            // }
            // 
            // // Add documents
            // uploadedFiles.forEach((file, index) => {
            //   if (file instanceof File) {
            //     formData.append(`document_${index}`, file);
            //   }
            // });
            // 
            // const result = await registerAdmin(formData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Log the data that would be sent to the API
            console.log("Form data:", {
                ...data,
                profileImage: previewImage ? "Profile image uploaded" : "No profile image",
                documents: uploadedFiles
            });
            
            toast.success("Registration Successful", {
                description: "The new admin account has been created!"
            });
            
            // Reset form
            form.reset();
            setPreviewImage(null);
            setUploadedFiles([]);
            setIsSuperAdmin(false);
            
        } catch (err) {
            console.error("Registration error:", err);
            setError(err instanceof Error ? err.message : "Failed to register admin. Please try again.");
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
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight mb-2">
                            Register New Team Member
                            </h1>
                            <p className="text-sm text-muted-foreground">
                            Add a new administrator to the team with appropriate access level
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

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {/* Profile Image Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <input
                                    type="file"
                                    id="profileImage"
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleImageChange}
                                    disabled={submitting}
                                />
                                <label
                                    htmlFor="profileImage"
                                    className={cn(
                                        "cursor-pointer block", 
                                        submitting && "opacity-70 pointer-events-none"
                                    )}
                                >
                                    <div className="size-24 rounded-full bg-[#F4F2FF] border-2 border-dashed border-purple-300 hover:border-purple-500 flex items-center justify-center overflow-hidden">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <UserIcon strokeWidth={1.5} className="size-10 text-purple-500 mb-1" />
                                                <span className="text-xs text-purple-500">Upload Photo</span>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <p className="text-xs text-center mt-2 text-muted-foreground">
                                    Max 5MB (JPG, PNG)
                                </p>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Document Upload Section */}
                                <div className="space-y-4 md:col-span-2 mb-6">
                                    <h2 className="text-lg font-medium border-b pb-2">Document Upload</h2>
                                    
                                    <div className="border-2 border-dashed rounded-md p-6 bg-slate-50 flex flex-col items-center justify-center">
                                        <UploadCloud className="h-10 w-10 text-purple-500 mb-2" />
                                        <p className="text-sm font-medium mb-1">Drag & Drop Files or</p>
                                        
                                        <input
                                            type="file"
                                            id="documentUpload"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={submitting}
                                            accept={ALLOWED_FILE_TYPES.join(',')}
                                        />
                                        
                                        <label htmlFor="documentUpload">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="mt-2"
                                                disabled={submitting}
                                            >
                                                <UploadCloud className="h-4 w-4 mr-2" />
                                                Browse Files
                                            </Button>
                                        </label>
                                        
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Supported formats: PDF, Word, JPEG, PNG (Max 5MB per file)
                                        </p>
                                        
                                        {fileUploadError && (
                                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded w-full">
                                                {fileUploadError.split('\n').map((err, i) => (
                                                    <p key={i}>{err}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Show uploaded files */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <h3 className="text-sm font-medium">Uploaded Documents ({uploadedFiles.length})</h3>
                                            <div className="space-y-2">
                                                {uploadedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                                                        <div className="flex items-center">
                                                            <FileText className="h-5 w-5 text-purple-500 mr-2" />
                                                            <div>
                                                                <p className="text-sm font-medium line-clamp-1">{file.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(file.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFile(index)}
                                                            disabled={submitting}
                                                        >
                                                            <X className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                            <FormLabel>
                                                            Full Name *
                                            </FormLabel>
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
                                                name="employeeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                            Employee ID
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                                placeholder="Auto-generated if left empty"
                                                                className="bg-[#F8F7FF]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <p className="text-xs text-muted-foreground">
                                                Leave empty to auto-generate based on department and year
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                                name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                            Email *
                                            </FormLabel>
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
                                            <FormLabel>
                                                            Phone Number *
                                            </FormLabel>
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
                                                        <FormLabel>
                                                            Role *
                                                        </FormLabel>
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
                                                        <FormLabel>
                                                            Department *
                                                        </FormLabel>
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
                                                        <FormLabel>
                                                            Date of Joining *
                                                        </FormLabel>
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

                                            <FormField
                                                control={form.control}
                                                name="isSuperAdmin"
                                                render={() => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-4 hover:bg-purple-100 transition-colors">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-purple-800 font-medium cursor-pointer" onClick={() => handleSuperAdminToggle(!isSuperAdmin)}>
                                                                Super Admin
                                                            </FormLabel>
                                                            <p className="text-xs text-purple-700">
                                                                Grant full system access with all privileges
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-medium ${isSuperAdmin ? 'text-green-600' : 'text-gray-500'}`}>
                                                                {isSuperAdmin ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={isSuperAdmin}
                                                                    onCheckedChange={handleSuperAdminToggle}
                                                                    className="data-[state=checked]:bg-purple-600"
                                                                />
                                                            </FormControl>
                                                        </div>
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
                                                    <FormLabel>
                                                        Address *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter full address"
                                                            className="bg-[#F8F7FF] min-h-[100px]"
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
                                                    <FormLabel>
                                                        Remarks
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter additional remarks (optional)"
                                                            className="bg-[#F8F7FF]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Security */}
                                    <div className="space-y-4 md:col-span-2">
                                        <h2 className="text-lg font-medium border-b pb-2">Security Details</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                            Password *
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Create a password"
                                                                    className="bg-[#F8F7FF]"
                                                        {...field}
                                                    />
                                                    <Button
                                                        size="icon"
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <EyeIcon className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Password must be at least 8 characters with one uppercase, one lowercase, one number and one special character.
                                                        </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                            Confirm Password *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Confirm your password"
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
                                </div>

                                <div className="flex justify-between pt-6 mt-6 border-t">
                                    <Button type="button" variant="outline" disabled={submitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="default" className="bg-purple-600 hover:bg-purple-700" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Registering...
                                            </>
                                        ) : (
                                            'Complete Registration'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRegisterPage; 