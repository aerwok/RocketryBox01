import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, User, Camera } from "lucide-react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import AdminCompanyDetails from "./components/admin-company-details";
import AdminBankDetails from "./components/admin-bank-details";
import { Input } from "@/components/ui/input";
import AdminShopDetails from "./components/admin-shop-details";
import AdminKycDetails from "./components/admin-kyc-details";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceFactory } from "@/services/service-factory";

// Define the AdminUserTab type for tab navigation
type AdminUserTab = "profile" | "company" | "bank" | "shop" | "kyc" | "activity" | "agreement";

// const STORE_LINKS = [
//     { icon: "/icons/web.svg", label: "Website", placeholder: "Enter website URL" },
//     { icon: "/icons/amazon.svg", label: "Amazon Store", placeholder: "Enter Amazon store URL" },
//     { icon: "/icons/shopify.svg", label: "Shopify Store", placeholder: "Enter Shopify store URL" },
//     { icon: "/icons/opencart.svg", label: "OpenCart Store", placeholder: "Enter OpenCart store URL" },
// ];

interface UserData {
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    joinDate: string;
    lastActive: string;
    type: string;
    companyName?: string;
    totalTransactions: string;
    totalAmountTransacted: string;
    averageOrderValue: string;
    rateBand: string;
    paymentType: string;
    creditLimit: number;
    creditPeriod: number;
}

interface Address {
    id: number;
    title: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
}

const AdminUserProfilePage = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState<AdminUserTab>("profile");
    const [paymentType, setPaymentType] = useState<"wallet" | "credit">("wallet");
    const [proposedChanges, setProposedChanges] = useState<Record<string, any>>({});
    const [hasProposedChanges, setHasProposedChanges] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await ServiceFactory.admin.getTeamMember(id);
                setUserData(response.data);
                
                // Fetch addresses if available
                if (response.data.addresses) {
                    setAddresses(response.data.addresses);
                }
                
                // Set initial payment type
                if (response.data.paymentDetails?.paymentMode) {
                    setPaymentType(response.data.paymentDetails.paymentMode);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                toast.error('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">User not found</p>
            </div>
        );
    }

    // Now we can safely use userData as it's guaranteed to be non-null
    const { name, email, phone, address, status, joinDate, lastActive, type, companyName, 
            totalTransactions, totalAmountTransacted, averageOrderValue } = userData;

    // Handler for tab changes
    const handleTabChange = (tab: AdminUserTab) => {
        if (!id?.includes("SELLER") && 
            (tab === "company" || tab === "bank" || tab === "shop" || tab === "kyc" || tab === "agreement")) {
            setActiveTab("profile");
            return;
        }
        setActiveTab(tab);
    };

    // Handler for saving proposed changes
    const handleSaveProposed = async (message?: string) => {
        if (!id || !userData) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { 
                ...proposedChanges,
                paymentDetails: {
                    paymentMode: paymentType,
                    ...proposedChanges.paymentDetails
                }
            });
            setHasProposedChanges(true);
            toast.success(message || "Changes saved temporarily. Create an agreement to apply them.");
        } catch (error) {
            console.error('Failed to save changes:', error);
            toast.error('Failed to save changes');
        }
    };

    // Handler for collecting proposed changes from profile form
    const handleProfileChanges = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData(e.currentTarget);
        const changes: Record<string, any> = {};
        
        // Collect form data
        changes.name = formData.get('name')?.toString();
        changes.email = formData.get('email')?.toString();
        changes.phone = formData.get('phone')?.toString();
        changes.address = formData.get('address')?.toString();
        changes.status = formData.get('status')?.toString();
        
        // Collect payment and rate band settings
        changes.paymentDetails = {
            paymentMode: paymentType,
            rateBand: formData.get('rateBand')?.toString()
        };
        
        if (paymentType === 'credit') {
            changes.paymentDetails.creditLimit = Number(formData.get('creditLimit'));
            changes.paymentDetails.creditPeriod = Number(formData.get('creditPeriod'));
        }
        
        // Save changes to state
        setProposedChanges(changes);
        await handleSaveProposed("Profile changes saved. Create an agreement to apply these changes.");
    };

    // Handler for creating a new agreement from proposed changes
    const createAgreementFromChanges = () => {
        // Check if we have proposed changes to include in the agreement
        if (!hasProposedChanges) {
            toast.error("No changes have been proposed. Please save changes first.");
            return;
        }
        
        // Open the agreement form
        const agreementForm = document.getElementById('new-agreement-form');
        if (agreementForm) {
            agreementForm.classList.remove('hidden');
            
            // Pre-fill the agreement form with changes
            const title = document.getElementById('agreement-title') as HTMLInputElement;
            if (title) title.value = "Updated Terms Agreement";
            
            // Check the appropriate checkboxes based on what changed
            if (proposedChanges.paymentDetails && proposedChanges.paymentDetails.paymentMode !== userData.paymentType) {
                const paymentTypeCheckbox = document.getElementById('change-payment-type') as HTMLInputElement;
                if (paymentTypeCheckbox) paymentTypeCheckbox.checked = true;
                
                const label = document.querySelector('label[for="change-payment-type"]');
                if (label) label.textContent = `Change payment type from ${userData.paymentType} to ${proposedChanges.paymentDetails.paymentMode}`;
            }
            
            if (proposedChanges.paymentDetails && proposedChanges.paymentDetails.rateBand && proposedChanges.paymentDetails.rateBand !== userData.rateBand) {
                const rateBandCheckbox = document.getElementById('change-rate-band') as HTMLInputElement;
                if (rateBandCheckbox) {
                    rateBandCheckbox.checked = true;
                    const label = document.querySelector('label[for="change-rate-band"]');
                    if (label) label.textContent = `Change Rate Band to ${proposedChanges.rateBand}`;
                }
            }
            
            // Update the description to reflect all changes
            const description = document.getElementById('agreement-description') as HTMLTextAreaElement;
            if (description) {
                let descText = "This agreement includes the following changes:\n";
                
                for (const [key, value] of Object.entries(proposedChanges)) {
                    if (key === 'paymentType' && value !== userData.paymentType) {
                        descText += `- Change payment type from ${userData.paymentType} to ${value}\n`;
                    } else if (key === 'rateBand' && value !== userData.rateBand) {
                        descText += `- Change rate band from ${userData.rateBand} to ${value}\n`;
                    } else if (key === 'creditLimit' && proposedChanges.paymentType === 'credit') {
                        descText += `- Set credit limit to ₹${value}\n`;
                    } else if (key === 'creditPeriod' && proposedChanges.paymentType === 'credit') {
                        descText += `- Set credit period to ${value} days\n`;
                    } else if (key !== 'creditLimit' && key !== 'creditPeriod' && value !== (userData as any)[key]) {
                        descText += `- Update ${key} to ${value}\n`;
                    }
                }
                
                description.value = descText;
            }
        }
    };

    // Handler for form save operations (legacy - keep for other tabs)
    const handleSave = (message?: string) => {
        // Show a success toast with the provided message or a default one
        toast.success(message || "Changes saved successfully");
    };

    // Handle adding new address
    const handleAddAddress = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        
        // Create new address object
        const newAddress = {
            id: addresses.length + 1,
            title: `Address ${addresses.length + 1}`,
            street: formData.get('street')?.toString() || '',
            area: formData.get('area')?.toString() || '',
            city: formData.get('city')?.toString() || '',
            state: formData.get('state')?.toString() || '',
            pincode: formData.get('pincode')?.toString() || '',
            phone: formData.get('phone')?.toString() || ''
        };
        
        // Add to addresses array
        setAddresses([...addresses, newAddress]);
        setShowAddressForm(false);
        toast.success("New address added successfully");
    };
    
    // Handle deleting an address
    const handleDeleteAddress = (id: number) => {
        setAddresses(addresses.filter(address => address.id !== id));
        toast.success("Address deleted successfully");
    };

    return (
        <div className="container p-6 mx-auto">
            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">User Profile: {name}</h1>
                            <p className="text-gray-500">Manage user details and settings</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Info Panel */}
                    <div className="w-full lg:w-[30%]">
                        <Card className="w-full rounded-xl shadow-sm overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="size-24 rounded-full bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-700">
                                            {name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                    </div>
                                    
                                    <div className="text-center mb-4">
                                        <h2 className="font-bold text-xl">{name}</h2>
                                        <p className="text-gray-500">{email}</p>
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                status === "Active" 
                                                    ? "bg-green-100 text-green-800" 
                                                    : "bg-red-100 text-red-800"
                                            }`}>
                                                {status}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                                                {type}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-4">
                                        <h3 className="font-medium text-sm text-gray-500 mb-2">USER INFORMATION</h3>
                                        <ul className="space-y-2">
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Phone:</span>
                                                <span className="font-medium">{phone}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Address:</span>
                                                <span className="font-medium text-right">{address}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Join Date:</span>
                                                <span className="font-medium">{joinDate}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Last Active:</span>
                                                <span className="font-medium">{lastActive}</span>
                                            </li>
                                            {companyName && (
                                                <li className="flex justify-between">
                                                    <span className="text-gray-500">Company:</span>
                                                    <span className="font-medium">{companyName}</span>
                                                </li>
                                            )}
                                        </ul>
                                </div>
                                    
                                    <div className="border-t pt-4">
                                        <h3 className="font-medium text-sm text-gray-500 mb-2">TRANSACTIONS</h3>
                                        <ul className="space-y-2">
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Total Transactions:</span>
                                                <span className="font-medium">{totalTransactions}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Total Amount:</span>
                                                <span className="font-medium">{totalAmountTransacted}</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span className="text-gray-500">Avg. Order Value:</span>
                                                <span className="font-medium">{averageOrderValue}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Form Section */}
                    <div className="w-full lg:w-[70%]">
                        <Card className="w-full rounded-xl shadow-sm">
                            <CardContent className="p-0">
                                <Tabs 
                                    defaultValue="profile" 
                                    value={activeTab} 
                                    onValueChange={(value) => handleTabChange(value as AdminUserTab)}
                                    className="w-full"
                                >
                                    <div className="border-b border-violet-200">
                                        <TabsList className="relative h-12 bg-transparent">
                                    <div className="absolute bottom-0 w-full h-px bg-violet-200"></div>
                                    <TabsTrigger
                                                value="profile"
                                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                            >
                                                Profile
                                            </TabsTrigger>
                                            
                                            {id?.includes("SELLER") && (
                                                <>
                                                    <TabsTrigger
                                                        value="company"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                                        Company
                                    </TabsTrigger>
                                    <TabsTrigger
                                                        value="bank"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                                        Bank
                                    </TabsTrigger>
                                    <TabsTrigger
                                                        value="shop"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                                        Shop
                                    </TabsTrigger>
                                    <TabsTrigger
                                                        value="kyc"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                                        KYC
                                    </TabsTrigger>
                                    <TabsTrigger
                                                        value="agreement"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                                        Agreement
                                    </TabsTrigger>
                                                </>
                                            )}
                                            
                                    <TabsTrigger
                                                value="activity"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                                Activity
                                    </TabsTrigger>
                                </TabsList>
                                    </div>

                                    <div className="p-6">
                                        <TabsContent value="profile">
                                            {!id?.includes("SELLER") ? (
                                                <div className="space-y-8">
                                                    {/* Customer Profile UI for non-seller accounts */}
                                                    <div className="bg-[#E3F2FD] rounded-lg p-6">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h2 className="text-xl font-bold">Profile</h2>
                                                        </div>
                                                        <p className="text-gray-600 text-sm mb-6">Your profile information</p>
                                                        
                                                        <div className="flex flex-col items-center mb-6">
                                                            <div className="relative mb-3">
                                                                <div className="size-32 rounded-full bg-white flex items-center justify-center border-2 border-gray-200">
                                                                    <User className="size-16 text-gray-400" />
                                                                </div>
                                                                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 cursor-pointer">
                                                                    <Camera className="size-4 text-white" />
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-blue-600">Click the camera icon to update your photo</p>
                                                        </div>
                                                        
                                                        <form onSubmit={(e) => {
                                                            e.preventDefault();
                                                            handleSave("Profile information updated successfully");
                                                        }}>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col">
                                                                    <label className="mb-1 flex items-center">
                                                                        <User className="size-4 mr-2" /> 
                                                                        Full Name
                                                                    </label>
                                                                    <Input 
                                                                        placeholder="Enter your full name"
                                                                        defaultValue={name}
                                                                        className="bg-white"
                                                                    />
                                                                </div>
                                                                
                                                                <div className="flex flex-col">
                                                                    <label className="mb-1 flex items-center">
                                                                        <Mail className="size-4 mr-2" /> 
                                                                        Email Address
                                                                    </label>
                                                                    <Input 
                                                                        placeholder="Enter your email"
                                                                        defaultValue={email}
                                                                        className="bg-white"
                                                                    />
                                                                </div>
                                                                
                                                                <div className="flex flex-col">
                                                                    <label className="mb-1 flex items-center">
                                                                        <Phone className="size-4 mr-2" /> 
                                                                        Phone Number
                                                                    </label>
                                                                    <Input 
                                                                        placeholder="Enter your phone number"
                                                                        defaultValue={phone}
                                                                        className="bg-white"
                                                                    />
                                                                </div>
                                                                
                                                                <div className="pt-2">
                                                                    <Button 
                                                                        type="submit" 
                                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                                    >
                                                                        Save Changes
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </form>
                                                    </div>
                                                    
                                                    {/* Address Management Section */}
                                                    <div className="bg-[#E3F2FD] rounded-lg p-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h2 className="text-xl font-bold">My Address</h2>
                                                            <Button 
                                                                size="sm"
                                                                variant="outline"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full size-8 p-0 flex items-center justify-center"
                                                                onClick={() => setShowAddressForm(true)}
                                                            >
                                                                <span className="text-lg">+</span>
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Address cards */}
                                                        <div className="space-y-4">
                                                            {addresses.map(address => (
                                                                <div key={address.id} className="bg-white rounded-lg p-4 shadow-sm">
                                                                    <div className="flex justify-between">
                                                                        <h3 className="font-semibold">{address.title}</h3>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            className="h-auto p-0 text-red-500 hover:text-red-700"
                                                                            onClick={() => handleDeleteAddress(address.id)}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </div>
                                                                    <div className="mt-2 text-gray-600">
                                                                        <p>{address.street}, {address.area}, {address.city}, {address.state} - {address.pincode}</p>
                                                                        <div className="flex items-center mt-1">
                                                                            <Phone className="size-3 mr-1" />
                                                                            <span className="text-sm">{address.phone}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <form onSubmit={handleProfileChanges}>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Personal Information Section */}
                                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Full Name</span>
                                                                    <Input 
                                                                        name="name"
                                                                        defaultValue={name} 
                                                                        className="bg-[#F8F7FF]" 
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Email Address</span>
                                                                    <Input 
                                                                        name="email"
                                                                        defaultValue={email} 
                                                                        className="bg-[#F8F7FF]" 
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Phone Number</span>
                                                                    <Input 
                                                                        name="phone"
                                                                        defaultValue={phone} 
                                                                        className="bg-[#F8F7FF]" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Account Information Section */}
                                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                                            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">User ID</span>
                                                                    <Input 
                                                                        defaultValue={id} 
                                                                        className="bg-[#F8F7FF] text-gray-500" 
                                                                        disabled 
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Account Type</span>
                                                                    <Input 
                                                                        defaultValue={type} 
                                                                        className="bg-[#F8F7FF] text-gray-500" 
                                                                        disabled 
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Join Date</span>
                                                                    <Input 
                                                                        defaultValue={joinDate} 
                                                                        className="bg-[#F8F7FF] text-gray-500" 
                                                                        disabled 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Payment Type Section */}
                                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                                            <h3 className="text-lg font-semibold mb-4">Payment Type</h3>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">
                                                                        Select Payment Mode
                                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Admin Only</span>
                                                                    </span>
                                                                    <Select 
                                                                        defaultValue="wallet"
                                                                        onValueChange={(value) => {
                                                                            setPaymentType(value as "wallet" | "credit");
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="bg-[#F8F7FF]">
                                                                            <SelectValue placeholder="Select payment type" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="wallet">Wallet</SelectItem>
                                                                            <SelectItem value="credit">Credit</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                
                                                                {/* Credit Limit Section - Only shown when credit is selected */}
                                                                {paymentType === 'credit' && (
                                                                    <div className="space-y-4 mt-4 p-4 border border-blue-100 rounded-md bg-blue-50/30">
                                                                        <h4 className="font-semibold text-sm text-blue-700">Credit Settings</h4>
                                                                        <div className="flex flex-col space-y-1">
                                                                            <span className="text-sm text-gray-500">Credit Limit (₹)</span>
                                                                            <Input 
                                                                                name="creditLimit"
                                                                                type="number"
                                                                                placeholder="Enter credit limit" 
                                                                                defaultValue="10000"
                                                                                className="bg-[#F8F7FF]" 
                                                                            />
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Maximum amount that can be credited to this seller.
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        <div className="flex flex-col space-y-1">
                                                                            <span className="text-sm text-gray-500">Credit Period (Days)</span>
                                                                            <Select defaultValue="30" name="creditPeriod">
                                                                                <SelectTrigger className="bg-[#F8F7FF]">
                                                                                    <SelectValue placeholder="Select credit period" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="15">15 Days</SelectItem>
                                                                                    <SelectItem value="30">30 Days</SelectItem>
                                                                                    <SelectItem value="45">45 Days</SelectItem>
                                                                                    <SelectItem value="60">60 Days</SelectItem>
                                                                                    <SelectItem value="90">90 Days</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                Time period for settling credited amount.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {id?.includes("SELLER") && (
                                                                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                                                                        <p>
                                                                            <span className="font-semibold">Note:</span> Payment type determines how the seller will be charged for transactions. Only administrators can change this setting.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Rate Band Section */}
                                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                                            <h3 className="text-lg font-semibold mb-4">Rate Band</h3>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Assigned Rate Band</span>
                                                                    <Select defaultValue="RBX1" name="rateBand">
                                                                        <SelectTrigger className="bg-[#F8F7FF]">
                                                                            <SelectValue placeholder="Select rate band" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="RBX1">RBX1</SelectItem>
                                                                            <SelectItem value="RBX2">RBX2</SelectItem>
                                                                            <SelectItem value="RBX3">RBX3</SelectItem>
                                                                            <SelectItem value="custom">Custom Rate Band</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                {id?.includes("SELLER") && (
                                                                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                                                                        <p>
                                                                            <span className="font-semibold">Note:</span> The rate band determines pricing tiers and commission structures that apply to this seller.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Address Information Section */}
                                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                                            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                                                            <div className="space-y-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Address</span>
                                                                    <Textarea 
                                                                        name="address"
                                                                        defaultValue={userData.address} 
                                                                        className="bg-[#F8F7FF]" 
                                                                    />
                                                                </div>
                            </div>
                        </div>

                                                        {/* Account Status Section */}
                                                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                                                            <h3 className="text-lg font-semibold mb-4">Account Status</h3>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-sm text-gray-500">Status:</span>
                                                                    <Select defaultValue={userData.status.toLowerCase()} name="status">
                                                                        <SelectTrigger className="w-40 bg-[#F8F7FF]">
                                                                            <SelectValue placeholder="Select status" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="active">Active</SelectItem>
                                                                            <SelectItem value="suspended">Suspended</SelectItem>
                                                                            <SelectItem value="deactivated">Deactivated</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className="text-sm text-gray-500">Last Active</span>
                                                                    <Input 
                                                                        defaultValue={userData.lastActive} 
                                                                        className="bg-[#F8F7FF] text-gray-500" 
                                                                        disabled 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end items-center mt-6 gap-4">
                                                        {hasProposedChanges && id?.includes("SELLER") && (
                                                            <Button 
                                                                variant="outline" 
                                                                className="flex items-center gap-2"
                                                                type="button"
                                                                onClick={createAgreementFromChanges}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus">
                                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                                    <polyline points="14 2 14 8 20 8"/>
                                                                    <line x1="12" x2="12" y1="18" y2="12"/>
                                                                    <line x1="9" x2="15" y1="15" y2="15"/>
                                                                </svg>
                                                                Create Agreement from Changes
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="purple" 
                                                            type="submit"
                                                        >
                                                            Save Proposed Changes
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="company">
                                            <AdminCompanyDetails onSave={handleSave} />
                            </TabsContent>

                                        <TabsContent value="bank">
                                            <AdminBankDetails onSave={handleSave} />
                            </TabsContent>

                                        <TabsContent value="shop">
                                            <AdminShopDetails onSave={handleSave} />
                            </TabsContent>

                                        <TabsContent value="kyc">
                                            <AdminKycDetails onSave={handleSave} />
                            </TabsContent>

                                        <TabsContent value="activity">
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-bold">User Activity</h2>
                                                <p className="text-gray-500">
                                                    View the user's recent activity and login history.
                                                </p>
                                                {/* Placeholder for activity content, will be implemented later */}
                                                <p className="py-8 text-center text-gray-500">
                                                    Activity log will be implemented in a future update.
                                                </p>
                                            </div>
                            </TabsContent>

                                        <TabsContent value="agreement">
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h2 className="text-xl font-bold">User Agreements</h2>
                                                        <p className="text-gray-500">
                                                            Manage agreements with this seller. Upon approval, the seller's profile settings will be updated accordingly.
                                                        </p>
                                                    </div>
                                                    {id?.includes("SELLER") && (
                                                        <Button 
                                                            variant="outline" 
                                                            className="flex items-center gap-2"
                                                            onClick={() => {
                                                                // This would open a form to create a new agreement
                                                                document.getElementById('new-agreement-form')?.classList.remove('hidden');
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus">
                                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                                <polyline points="14 2 14 8 20 8"/>
                                                                <line x1="12" x2="12" y1="18" y2="12"/>
                                                                <line x1="9" x2="15" y1="15" y2="15"/>
                                                            </svg>
                                                            Create New Agreement
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                {/* New Agreement Form - Initially Hidden */}
                                                <div id="new-agreement-form" className="hidden bg-white p-6 rounded-lg border shadow-sm space-y-5">
                                                    <h3 className="text-lg font-semibold">Create New Agreement</h3>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-sm text-gray-500">Agreement Title</span>
                                                            <Input 
                                                                id="agreement-title"
                                                                placeholder="Enter agreement title" 
                                                                className="bg-[#F8F7FF]" 
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-sm text-gray-500">Agreement Type</span>
                                                            <Select defaultValue="payment_terms">
                                                                <SelectTrigger className="bg-[#F8F7FF]">
                                                                    <SelectValue placeholder="Select agreement type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="payment_terms">Payment Terms</SelectItem>
                                                                    <SelectItem value="rate_change">Rate Change</SelectItem>
                                                                    <SelectItem value="service_terms">Service Terms</SelectItem>
                                                                    <SelectItem value="special_conditions">Special Conditions</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-sm text-gray-500">Description</span>
                                                            <Textarea 
                                                                id="agreement-description"
                                                                placeholder="Enter agreement details" 
                                                                className="bg-[#F8F7FF] min-h-32" 
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-sm text-gray-500">Proposed Changes</span>
                                                            <div className="bg-[#F8F7FF] p-4 rounded-md space-y-3">
                                                                <div className="flex items-center">
                                                                    <input type="checkbox" id="change-payment-type" className="mr-2" />
                                                                    <label htmlFor="change-payment-type" className="text-sm">Change Payment Type to Credit</label>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <input type="checkbox" id="change-rate-band" className="mr-2" />
                                                                    <label htmlFor="change-rate-band" className="text-sm">Change Rate Band to RBX2</label>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <input type="checkbox" id="change-credit-limit" className="mr-2" />
                                                                    <label htmlFor="change-credit-limit" className="text-sm">Set Credit Limit: ₹25,000</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-sm text-gray-500">Valid Until</span>
                                                            <Input 
                                                                type="date" 
                                                                className="bg-[#F8F7FF]" 
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm text-yellow-800">
                                                        <p><span className="font-semibold">Note:</span> The changes will not be applied to the seller's profile until the agreement is approved by the seller. Until then, the changes will only be visible in this agreement.</p>
                                                    </div>
                                                    
                                                    <div className="flex justify-end gap-3">
                                                        <Button 
                                                            variant="outline" 
                                                            onClick={() => {
                                                                document.getElementById('new-agreement-form')?.classList.add('hidden');
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button 
                                                            variant="purple"
                                                            onClick={() => {
                                                                document.getElementById('new-agreement-form')?.classList.add('hidden');
                                                                setActiveTab("agreement");
                                                                handleSave("Agreement created and sent to seller for approval");
                                                            }}
                                                        >
                                                            Send to Seller
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                {/* Existing Agreements List */}
                                                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                                    <div className="p-4 border-b bg-gray-50">
                                                        <h3 className="font-semibold">Active & Pending Agreements</h3>
                                                    </div>
                                                    
                                                    {id?.includes("SELLER") ? (
                                                        <div className="divide-y">
                                                            {/* Example Agreement 1 */}
                                                            <div className="p-4 hover:bg-gray-50">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className="font-medium">Credit Terms Agreement</h4>
                                                                        <p className="text-sm text-gray-500 mt-1">Change payment type from Wallet to Credit with limit of ₹15,000</p>
                                                                        <div className="flex items-center gap-3 mt-2">
                                                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pending Approval</span>
                                                                            <span className="text-xs text-gray-500">Created: 12 Aug 2023</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button variant="outline" size="sm">View Details</Button>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Example Agreement 2 */}
                                                            <div className="p-4 hover:bg-gray-50">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className="font-medium">Rate Band Update</h4>
                                                                        <p className="text-sm text-gray-500 mt-1">Changed rate band from RBX1 to RBX2 with improved commission structure</p>
                                                                        <div className="flex items-center gap-3 mt-2">
                                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Active</span>
                                                                            <span className="text-xs text-gray-500">Since: 5 Apr 2023</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button variant="outline" size="sm">View Details</Button>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Example Agreement 3 */}
                                                            <div className="p-4 hover:bg-gray-50">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className="font-medium">Initial Service Agreement</h4>
                                                                        <p className="text-sm text-gray-500 mt-1">Standard terms and conditions for platform usage</p>
                                                                        <div className="flex items-center gap-3 mt-2">
                                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Active</span>
                                                                            <span className="text-xs text-gray-500">Since: 15 Apr 2023</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button variant="outline" size="sm">View Details</Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-gray-500">
                                                            <p>Agreements are only applicable for seller accounts.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
            {/* Address Form Modal */}
            {showAddressForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add New Address</h3>
                            <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={() => setShowAddressForm(false)}
                            >
                                &times;
                            </Button>
                        </div>
                        
                        <form onSubmit={handleAddAddress}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Street Address</label>
                                    <Input 
                                        name="street" 
                                        placeholder="Enter street address" 
                                        required 
                                        className="w-full"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Area/Landmark (Optional)</label>
                                    <Input 
                                        name="area" 
                                        placeholder="Enter area or landmark"
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">City</label>
                                        <Input 
                                            name="city" 
                                            placeholder="Enter city" 
                                            required 
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">State</label>
                                        <Input 
                                            name="state" 
                                            placeholder="Enter state" 
                                            required 
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pincode</label>
                                        <Input 
                                            name="pincode" 
                                            placeholder="Enter pincode" 
                                            required 
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                                        <Input 
                                            name="phone" 
                                            placeholder="Enter phone number" 
                                            required 
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowAddressForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                        Save Address
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserProfilePage;