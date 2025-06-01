import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, MailIcon, PhoneIcon, Plus, User2Icon, UserIcon, Loader2, AlertCircle, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formSchema, type ProfileFormValues } from "@/lib/validations/profile";
import AddressModal from "@/components/customer/address-modal";
import { toast } from "sonner";
import { ServiceFactory } from "@/services/service-factory";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Address {
    id: string;
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    mobile?: string;
}

const CustomerProfilePage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
        },
    });

    // Fetch profile data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await ServiceFactory.customer.profile.get();
                if (response.success) {
                    form.reset({
                        fullName: response.data.name || response.data.fullName || "",
                        email: response.data.email || "",
                        phone: response.data.phone || "",
                    });
                    setProfileImage(response.data.profileImage || null);
                    
                    // Map addresses from backend (mobile) to frontend (phone)
                    const mappedAddresses = (response.data.addresses || []).map((addr: any) => ({
                        ...addr,
                        id: addr._id || addr.id,
                        phone: addr.mobile || addr.phone, // Map mobile to phone for frontend
                    }));
                    setAddresses(mappedAddresses);
                } else {
                    throw new Error(response.message || 'Failed to fetch profile data');
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to load profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [form]);

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setSaving(true);
            setError(null);
            
            const response = await ServiceFactory.customer.profile.update(data);
            if (response.success) {
                toast.success("Profile updated successfully");
            } else {
                throw new Error(response.message || 'Failed to update profile');
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile. Please try again.");
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        try {
            setUploadingImage(true);
            setError(null);
            
            const response = await ServiceFactory.customer.profile.uploadImage(file);
            if (response.success) {
                setProfileImage(response.data.imageUrl);
                toast.success("Profile picture updated successfully");
            } else {
                throw new Error(response.message || 'Failed to upload profile picture');
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            toast.error("Failed to upload profile picture");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddAddress = async (data: Omit<Address, "id">) => {
        try {
            setError(null);
            
            console.log('Adding address with data:', data);
            const response = await ServiceFactory.customer.profile.addAddress(data);
            console.log('Add address response:', response);
            
            if (response.success) {
                // The backend returns the full addresses array, so we need to update our state
                if (response.data.addresses) {
                    // Map addresses from backend (mobile) to frontend (phone)
                    const mappedAddresses = response.data.addresses.map((addr: any) => ({
                        ...addr,
                        id: addr._id || addr.id,
                        phone: addr.mobile || addr.phone, // Map mobile to phone for frontend
                    }));
                    setAddresses(mappedAddresses);
                } else {
                    // Fallback: add the new address to existing ones
                    setAddresses(prev => [...prev, { ...data, id: Date.now().toString() }]);
                }
                toast.success("Address added successfully");
            } else {
                throw new Error(response.message || 'Failed to add address');
            }
        } catch (err: any) {
            console.error("Error adding address:", err);
            const errorMessage = err.message || err.response?.data?.message || 'Failed to add address';
            setError(`Error adding address: ${errorMessage}`);
            toast.error(errorMessage);
            throw err; // Re-throw to prevent modal from closing
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            setDeletingAddressId(id);
            setError(null);
            
            console.log('Deleting address with id:', id);
            const response = await ServiceFactory.customer.profile.deleteAddress(id);
            console.log('Delete address response:', response);
            
            if (response.success) {
                // The backend returns the updated addresses array
                if (response.data.addresses) {
                    // Map addresses from backend (mobile) to frontend (phone)
                    const mappedAddresses = response.data.addresses.map((addr: any) => ({
                        ...addr,
                        id: addr._id || addr.id,
                        phone: addr.mobile || addr.phone, // Map mobile to phone for frontend
                    }));
                    setAddresses(mappedAddresses);
                } else {
                    // Fallback: remove from current state
                    setAddresses(addresses.filter(address => address.id !== id));
                }
                toast.success("Address deleted successfully");
            } else {
                throw new Error(response.message || 'Failed to delete address');
            }
        } catch (err: any) {
            console.error("Error deleting address:", err);
            const errorMessage = err.message || err.response?.data?.message || 'Failed to delete address';
            setError(`Error deleting address: ${errorMessage}`);
            toast.error(errorMessage);
        } finally {
            setDeletingAddressId(null);
        }
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            setError(null);
            
            await logout();
            toast.success("Logged out successfully");
            navigate("/customer/login");
        } catch (error: any) {
            console.error("Logout error:", error);
            const errorMessage = error.message || "Failed to logout. Please try again.";
            setError(`Logout failed: ${errorMessage}`);
            toast.error(errorMessage);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#412A5F] mb-4" />
                    <p className="text-lg text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="container mx-auto px-4 py-8"
        >
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setError(null)}
                        className="border-red-300 hover:bg-red-100"
                    >
                        Dismiss
                    </Button>
                </motion.div>
            )}
            
            {/* Header with Logout Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#412A5F]">My Profile</h1>
                    <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
                </div>
            </motion.div>
            
            <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Image */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative h-96 lg:h-[500px]"
                >
                    <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src="/images/customer/profile.png"
                        alt="Profile"
                        className="w-full h-full object-contain"
                    />
                </motion.div>

                {/* Right Side - Profile Form */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-[#99BCDD] rounded-lg lg:rounded-2xl p-4 lg:p-8"
                >
                    <motion.div
                        variants={itemVariants}
                        className="text-center space-y-2 text-[#412A5F]"
                    >
                        <h2 className="text-2xl font-semibold">
                            Profile
                        </h2>
                        <p className="font-normal">
                            Your profile information
                        </p>
                    </motion.div>

                    {/* Profile Image Upload */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col items-center justify-center pt-6"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative size-20 lg:size-28 rounded-full bg-neutral-200 cursor-pointer overflow-visible"
                            onClick={handleImageClick}
                        >
                            <AnimatePresence mode="wait">
                                {uploadingImage ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-center h-full"
                                    >
                                        <Loader2 className="h-8 w-8 animate-spin text-[#412A5F]" />
                                    </motion.div>
                                ) : profileImage ? (
                                    <motion.img
                                        key="profile-image"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <motion.div
                                        key="default-image"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center h-full relative"
                                    >
                                        <UserIcon strokeWidth={1.3} className="size-12 lg:size-20 text-[#412A5F]" />
                                        <motion.span
                                            whileHover={{ scale: 1.1 }}
                                            className="absolute right-0 bottom-0 size-8 flex items-center justify-center bg-[#412A5F] rounded-full"
                                        >
                                            <Camera className="size-5 text-[#412A5F] fill-white" />
                                        </motion.span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        <motion.span
                            variants={itemVariants}
                            className="text-sm text-center text-blue-500 mt-2"
                        >
                            Click the camera icon to update your photo
                        </motion.span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploadingImage}
                        />
                    </motion.div>

                    {/* Profile Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                            <motion.div variants={itemVariants} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#412A5F]">
                                                Full Name
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your full name"
                                                        className="pl-10 bg-white/80"
                                                    />
                                                    <User2Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#412A5F] size-5" />
                                                </div>
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
                                            <FormLabel className="text-[#412A5F]">
                                                Email
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your email"
                                                        className="pl-10 bg-white/80"
                                                    />
                                                    <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#412A5F] size-5" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#412A5F]">
                                                Phone
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your phone number"
                                                        className="pl-10 bg-white/80"
                                                    />
                                                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#412A5F] size-5" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants} className="pt-2">
                                <Button 
                                    type="submit" 
                                    className="w-full bg-[#412A5F] hover:bg-[#412A5F]/90"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                                
                                {/* Logout Button */}
                                <Button 
                                    variant="outline" 
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    {isLoggingOut ? "Logging out..." : "Logout"}
                                </Button>
                            </motion.div>
                        </form>
                    </Form>
                </motion.div>
            </div>

            {/* Saved Addresses Section */}
            <motion.div
                variants={itemVariants}
                className="mt-12 space-y-6"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#412A5F]">
                        Your Saved Addresses
                    </h2>
                    <Button
                        variant="outline"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="border-[#412A5F] text-[#412A5F] hover:bg-[#412A5F] hover:text-white"
                    >
                        <Plus className="size-4 mr-2" />
                        Add New Address
                    </Button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-full text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No saved addresses</p>
                            <Button
                                variant="outline"
                                onClick={() => setIsAddressModalOpen(true)}
                                className="mt-4"
                            >
                                Add Your First Address
                            </Button>
                        </div>
                    ) : (
                        addresses.map((address) => (
                            <motion.div
                                key={address.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white border rounded-lg p-4 shadow-sm relative"
                            >
                                <div className="absolute top-2 right-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="size-8 p-0 text-red-500 hover:text-red-700 border-red-200"
                                        onClick={() => handleDeleteAddress(address.id)}
                                        disabled={deletingAddressId === address.id}
                                    >
                                        {deletingAddressId === address.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="size-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className="text-main font-medium mb-1">{address.name}</div>
                                <div className="space-y-1 text-sm">
                                    <p>{address.address1}</p>
                                    {address.address2 && <p>{address.address2}</p>}
                                    <p>{address.city}, {address.state} - {address.pincode}</p>
                                    <p className="font-medium">Phone: {address.phone}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Address Modal */}
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSubmit={handleAddAddress}
            />
        </motion.div>
    );
};

export default CustomerProfilePage; 