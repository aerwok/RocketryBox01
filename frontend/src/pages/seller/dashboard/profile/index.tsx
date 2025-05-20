import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2Icon, User, Mail, Phone, Building2, CreditCard, FileText, MapPin, ScrollText } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Agreement from "./components/agreement";
import { ServiceFactory } from "@/services/service-factory";
import { Seller } from "@/types/api";

const STORE_LINKS = [
    { icon: "/icons/web.svg", label: "Website", placeholder: "Enter website URL" },
    { icon: "/icons/amazon.svg", label: "Amazon Store", placeholder: "Enter Amazon store URL" },
    { icon: "/icons/shopify.svg", label: "Shopify Store", placeholder: "Enter Shopify store URL" },
    { icon: "/icons/opencart.svg", label: "OpenCart Store", placeholder: "Enter OpenCart store URL" },
];

const SellerProfilePage = () => {
    const [activeTab, setActiveTab] = useState("company-details");
    const [profile, setProfile] = useState<Seller | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await ServiceFactory.seller.profile.get();
                if (!response.success) {
                    throw new Error(response.message || 'Failed to fetch profile');
                }
                setProfile(response.data as Seller);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    const handleEditRequest = async () => {
        try {
            const response = await ServiceFactory.seller.profile.update({ editRequested: true });
            if (!response.success) {
                throw new Error(response.message || 'Failed to send edit request');
            }
            toast.info("Your edit request has been sent to the admin for approval");
        } catch (err) {
            console.error('Error sending edit request:', err);
            toast.error('Failed to send edit request. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-red-500 text-center mb-4">{error}</div>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-4">No profile data found</div>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full lg:p-4">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Profile Section */}
                <div className="w-full lg:w-[30%] space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex flex-col items-center text-center">
                            {/* Profile Image Container */}
                            <div className="relative w-32 h-32 mb-4">
                                <div className="w-full h-full rounded-full bg-[#F8F7FF] flex items-center justify-center">
                                    {profile.profileImage ? (
                                        <img
                                            src={profile.profileImage}
                                            alt={profile.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                    <User className="w-16 h-16 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Profile Info */}
                            <h2 className="text-xl font-semibold">{profile.name}</h2>
                            <p className="text-gray-600 mt-1">{profile.companyName}</p>
                            <div className="mt-2 text-sm text-gray-500">
                                <p>Seller ID</p>
                                <p className="font-medium">@{profile.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{profile.phone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Store Links Card */}
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
                        <h3 className="text-lg font-semibold mb-4">Store Links</h3>
                        <div className="space-y-4">
                            {STORE_LINKS.map((store) => (
                                <div key={store.label} className="flex items-center gap-3 px-3 py-2 bg-[#F8F7FF] rounded-lg">
                                    <img
                                        src={store.icon}
                                        alt={store.label}
                                        width={20}
                                        height={20}
                                        className="size-5"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm text-gray-600">
                                            {profile.storeLinks?.[store.label.toLowerCase() as keyof typeof profile.storeLinks] || "Not provided"}
                                        </span>
                                    </div>
                                    <Link2Icon className="w-4 h-4 text-gray-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className="w-full lg:w-[70%]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Profile Details</h2>
                        <Button onClick={handleEditRequest} variant="outline">
                            Request Edit
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <div className="w-full">
                            <div className="w-full overflow-auto scrollbar-hide max-w-[calc(100vw-64px-4rem)] mx-auto">
                                <TabsList className="w-max min-w-full p-0 h-12 bg-white rounded-none relative justify-start">
                                    <div className="absolute bottom-0 w-full h-px bg-violet-200"></div>
                                    <TabsTrigger
                                        value="company-details"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                        <Building2 className="w-4 h-4 mr-2" />
                                        Company
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="primary-address"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Address
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="documents"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Documents
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="bank-details"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Bank
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="agreement"
                                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                                    >
                                        <ScrollText className="w-4 h-4 mr-2" />
                                        Agreement
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        <div className="mt-8">
                            <TabsContent value="company-details">
                                <div className="bg-white rounded-lg p-6 shadow-sm border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                                            <p className="mt-1">{profile.companyName}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Company Category</h3>
                                            <p className="mt-1">{profile.companyCategory}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Brand Name</h3>
                                            <p className="mt-1">{profile.brandName || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Website</h3>
                                            <p className="mt-1">{profile.website || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Support Contact</h3>
                                            <p className="mt-1">{profile.supportContact || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Support Email</h3>
                                            <p className="mt-1">{profile.supportEmail || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Operations Email</h3>
                                            <p className="mt-1">{profile.operationsEmail || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Finance Email</h3>
                                            <p className="mt-1">{profile.financeEmail || "Not provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="primary-address">
                                <div className="bg-white rounded-lg p-6 shadow-sm border">
                                    {profile.address ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Street Address</h3>
                                                    <p className="mt-1">{profile.address.street}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Landmark</h3>
                                                    <p className="mt-1">{profile.address.landmark || "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">City</h3>
                                                    <p className="mt-1">{profile.address.city}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">State</h3>
                                                    <p className="mt-1">{profile.address.state}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Country</h3>
                                                    <p className="mt-1">{profile.address.country}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Postal Code</h3>
                                                    <p className="mt-1">{profile.address.postalCode}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No address information available</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="documents">
                                <div className="bg-white rounded-lg p-6 shadow-sm border">
                                    {profile.documents ? (
                                        <div className="space-y-6">
                                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                                <p className="text-sm text-blue-700">
                                                    These documents were collected during your registration process. Any updates to these documents require admin approval.
                                                </p>
                                            </div>

                                            {/* Registration Numbers */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">GSTIN</h3>
                                                    <p className="mt-1">{profile.documents.gstin}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">PAN</h3>
                                                    <p className="mt-1">{profile.documents.pan}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500">Aadhaar</h3>
                                                    <p className="mt-1">{profile.documents.aadhaar}</p>
                                                </div>
                                            </div>

                                            {/* Document List */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
                                                <div className="space-y-4">
                                                    {profile.documents.documents.map((doc, index) => (
                                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="w-5 h-5 text-gray-400" />
                                                                <div>
                                                                    <p className="font-medium">{doc.name}</p>
                                                                    <p className="text-sm text-gray-500">{doc.type}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                                    doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                                    doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                                </span>
                                                                <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                                                                    View
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No document information available</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="bank-details">
                                <div className="bg-white rounded-lg p-6 shadow-sm border">
                                    {profile.bankDetails && profile.bankDetails.length > 0 ? (
                                        <div className="space-y-6">
                                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                                <p className="text-sm text-blue-700">
                                                    Bank account details and cancelled cheque were collected during your registration process. Any updates require admin approval.
                                                </p>
                                            </div>
                                            {profile.bankDetails.map((bank, index) => (
                                                <div key={index} className="p-4 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-semibold">{bank.bankName}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Account Name</h4>
                                                            <p className="mt-1">{bank.accountName}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Account Number</h4>
                                                            <p className="mt-1">{bank.accountNumber}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Branch</h4>
                                                            <p className="mt-1">{bank.branch}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">Account Type</h4>
                                                            <p className="mt-1">{bank.accountType}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500">IFSC Code</h4>
                                                            <p className="mt-1">{bank.ifscCode}</p>
                                                        </div>
                                                    </div>

                                                    {/* Cancelled Cheque Section */}
                                                    {bank.cancelledCheque && (
                                                        <div className="mt-4 pt-4 border-t">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <FileText className="w-5 h-5 text-gray-400" />
                                                                    <div>
                                                                        <h4 className="font-medium">Cancelled Cheque</h4>
                                                                        <p className="text-sm text-gray-500">Required for bank verification</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                                        bank.cancelledCheque.status === 'verified' ? 'bg-green-100 text-green-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {bank.cancelledCheque.status.charAt(0).toUpperCase() + bank.cancelledCheque.status.slice(1)}
                                                                    </span>
                                                                    <Button variant="ghost" size="sm" onClick={() => window.open(bank.cancelledCheque?.url, '_blank')}>
                                                                        View
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No bank details available</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="agreement">
                                <div className="bg-white rounded-lg p-6 shadow-sm border">
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-blue-700">
                                                View and manage your agreements with RocketryBox. You can view agreement details, download copies, and respond to new agreement requests.
                                            </p>
                                        </div>
                                        <Agreement onSave={() => {}} />
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default SellerProfilePage; 