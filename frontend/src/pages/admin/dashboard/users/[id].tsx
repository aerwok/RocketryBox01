import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ServiceFactory } from "@/services/service-factory";
import { Mail, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import AdminBankDetails from "./components/admin-bank-details";
import AdminCompanyDetails from "./components/admin-company-details";
import AdminKycDetails from "./components/admin-kyc-details";
import AdminShopDetails from "./components/admin-shop-details";

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
  const [agreements, setAgreements] = useState<any[]>([]);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false);
  const [mongoId, setMongoId] = useState<string | null>(null);

  // Safe initials generation function to prevent null errors
  const getInitials = (fullName?: string | null): string => {
    if (!fullName || fullName.trim() === '') {
      return '??';
    }

    try {
      return fullName
        .trim()
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase() || '??';
    } catch (error) {
      console.warn('Error generating initials:', error);
      return '??';
    }
  };

  // Safe address formatting function to convert objects to strings
  const formatAddress = (address: any): string => {
    if (!address) {
      return '';
    }

    // If address is already a string, return it
    if (typeof address === 'string') {
      return address;
    }

    // If address is an object, format it nicely
    if (typeof address === 'object') {
      try {
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.landmark) parts.push(address.landmark);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        if (address.postalCode) parts.push(address.postalCode);

        return parts.filter(part => part && part.trim()).join(', ');
      } catch (error) {
        console.warn('Error formatting address object:', error);
        return 'Address format error';
      }
    }

    // Fallback for unexpected types
    return String(address);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        console.log('🔍 Fetching user data for ID:', id);

        const response = await ServiceFactory.admin.getTeamMember(id);
        console.log('📡 Full API Response:', response);
        console.log('📡 Response Status:', response.success);
        console.log('📡 Response Data:', response.data);

        // Handle nested response structure
        // For sellers: response.data.seller, for customers: response.data.customer
        let actualUserData;

        if (!response.success) {
          console.error('❌ API returned error:', response.message || 'Unknown error');
          toast.error(response.message || 'Failed to load user data');
          return;
        }

        if (!response.data) {
          console.error('❌ No data in API response');
          toast.error('No user data found');
          return;
        }

        if (response.data.seller) {
          console.log('✅ Found seller data:', response.data.seller);
          // Seller data structure
          const seller = response.data.seller;

          // Extract and store MongoDB ObjectId for API calls
          const sellerId = seller._id || seller.id;
          if (sellerId) {
            setMongoId(sellerId);
            console.log('🆔 Extracted MongoDB ObjectId:', sellerId);
          }
          // Determine KYC verification status based on documents
          let kycStatus = 'pending';
          if (seller.documents) {
            const gstStatus = seller.documents.gstin?.status || 'pending';
            const panStatus = seller.documents.pan?.status || 'pending';
            const aadhaarStatus = seller.documents.aadhaar?.status || 'pending';

            console.log('📄 Document verification status:', {
              gst: gstStatus,
              pan: panStatus,
              aadhaar: aadhaarStatus
            });

            if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
              kycStatus = 'verified';
            } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
              kycStatus = 'rejected';
            } else {
              kycStatus = 'pending';
            }
          }

          console.log('📋 Final KYC Status:', kycStatus);

          actualUserData = {
            name: seller.name || '',
            email: seller.email || '',
            phone: seller.phone || seller.supportContact || '',
            address: formatAddress(seller.address),
            status: kycStatus === 'verified' ? 'verified' :
              kycStatus === 'rejected' ? 'rejected' : 'pending',
            joinDate: seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '',
            lastActive: seller.lastActive ? new Date(seller.lastActive).toLocaleDateString() : seller.lastLogin ? new Date(seller.lastLogin).toLocaleDateString() : '',
            type: 'Seller',
            companyName: seller.businessName || seller.companyCategory || '',
            totalTransactions: seller.orderStats?.totalCount?.toString() || '0',
            totalAmountTransacted: seller.orderStats?.totalAmount ? `₹${seller.orderStats.totalAmount.toLocaleString()}` : '₹0',
            averageOrderValue: seller.orderStats?.averageValue ? `₹${seller.orderStats.averageValue.toLocaleString()}` : '₹0',
            rateBand: 'RBX1', // Default value
            paymentType: 'wallet', // Default value
            creditLimit: 10000, // Default value
            creditPeriod: 30 // Default value
          };
        } else if (response.data.customer) {
          console.log('✅ Found customer data:', response.data.customer);
          // Customer data structure
          const customer = response.data.customer;
          actualUserData = {
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: formatAddress(customer.address),
            status: customer.status === 'active' ? 'Active' : (customer.status || 'Active'),
            joinDate: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
            lastActive: customer.lastActive ? new Date(customer.lastActive).toLocaleDateString() : '',
            type: 'Customer',
            companyName: '',
            totalTransactions: '0', // Default for customers
            totalAmountTransacted: '₹0', // Default for customers
            averageOrderValue: '₹0', // Default for customers
            rateBand: 'RBX1', // Default value
            paymentType: 'wallet', // Default value
            creditLimit: 0, // Default value
            creditPeriod: 0 // Default value
          };
        } else {
          console.log('⚠️ No seller/customer data, trying fallback:', response.data);
          // Fallback: try to use response.data directly (in case of different structure)
          actualUserData = {
            name: response.data.name || response.data.fullName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            address: formatAddress(response.data.address),
            status: response.data.status || 'Active',
            joinDate: response.data.createdAt ? new Date(response.data.createdAt).toLocaleDateString() : '',
            lastActive: response.data.lastActive ? new Date(response.data.lastActive).toLocaleDateString() : '',
            type: response.data.type || response.data.userType || 'User',
            companyName: response.data.companyName || response.data.businessName || '',
            totalTransactions: response.data.totalTransactions || '0',
            totalAmountTransacted: response.data.totalAmountTransacted || '₹0',
            averageOrderValue: response.data.averageOrderValue || '₹0',
            rateBand: response.data.rateBand || 'RBX1',
            paymentType: response.data.paymentType || 'wallet',
            creditLimit: response.data.creditLimit || 0,
            creditPeriod: response.data.creditPeriod || 0
          };
        }

        console.log('👤 Processed user data:', actualUserData);

        if (!actualUserData || !actualUserData.name) {
          console.error('❌ Failed to extract valid user data');
          toast.error('Invalid user data received');
          return;
        }

        setUserData(actualUserData);

        // Fetch addresses if available
        if (response.data.addresses) {
          setAddresses(response.data.addresses);
        }

        // Set initial payment type
        if (actualUserData.paymentType) {
          setPaymentType(actualUserData.paymentType);
        }

        console.log('✅ User data set successfully');
      } catch (error) {
        console.error('❌ Failed to fetch user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [id]);

  // Fetch agreements when mongoId is available and tab is active
  useEffect(() => {
    if (mongoId && activeTab === 'agreement') {
      fetchAgreements();
    }
  }, [mongoId, activeTab]);

  const fetchAgreements = async () => {
    if (!mongoId) return;

    try {
      setIsLoadingAgreements(true);
      console.log('📋 Fetching agreements for seller:', mongoId);

      // Get agreements from the seller details API response
      const response = await ServiceFactory.admin.getTeamMember(mongoId);

      if (response.success && response.data) {
        const agreements = response.data.agreements || [];
        console.log('📋 Found agreements:', agreements);
        setAgreements(agreements);
      } else {
        console.warn('⚠️ No agreements found or API error');
        setAgreements([]);
      }
    } catch (error) {
      console.error('❌ Error fetching agreements:', error);
      setAgreements([]);
    } finally {
      setIsLoadingAgreements(false);
    }
  };

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
    if (type !== 'Seller' &&
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
              <h1 className="text-2xl font-bold">User Profile: {name || 'Unknown User'}</h1>
              <p className="text-gray-500">Manage user details and settings</p>
              {type === 'Seller' && (
                <p className="text-sm text-gray-400 mt-1">
                  KYC Status: {status === 'verified' ? '✅ Verified' : status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log('🔄 Refreshing user profile data...');
                  window.location.reload(); // Force refresh to get latest data
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                🔄 Refresh
              </Button>
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
                      {getInitials(name)}
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <h2 className="font-bold text-xl">{name || 'Unknown User'}</h2>
                    <p className="text-gray-500">{email || 'No email'}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === "verified"
                        ? "bg-green-100 text-green-800"
                        : status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {status === 'verified' ? 'KYC Verified' :
                          status === 'rejected' ? 'KYC Rejected' :
                            'KYC Pending'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                        {type || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-sm text-gray-500 mb-2">USER INFORMATION</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{phone || 'No phone'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Address:</span>
                        <span className="font-medium text-right">{formatAddress(address) || 'No address'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Join Date:</span>
                        <span className="font-medium">{joinDate || 'No join date'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Last Active:</span>
                        <span className="font-medium">{lastActive || 'No last active'}</span>
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
                        <span className="font-medium">{totalTransactions || 'No transactions'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Total Amount:</span>
                        <span className="font-medium">{totalAmountTransacted || 'No amount'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Avg. Order Value:</span>
                        <span className="font-medium">{averageOrderValue || 'No average order'}</span>
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

                      {type === 'Seller' && (
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
                      {type === 'Customer' ? (
                        /* Customer Profile - Simple Layout like actual customer profile */
                        <div className="space-y-8">
                          {/* Customer Profile Section */}
                          <div className="bg-[#99BCDD] rounded-lg p-6">
                            <div className="text-center space-y-2 text-[#412A5F] mb-6">
                              <h2 className="text-2xl font-semibold">Customer Profile</h2>
                              <p className="font-normal">Customer profile information</p>
                            </div>

                            {/* Profile Image Section */}
                            <div className="flex flex-col items-center justify-center mb-6">
                              <div className="relative size-20 lg:size-28 rounded-full bg-white flex items-center justify-center border-2 border-gray-200">
                                {getInitials(name)}
                              </div>
                              <span className="text-sm text-center text-blue-600 mt-2">
                                Profile picture can be updated by the customer
                              </span>
                            </div>

                            <form onSubmit={(e) => {
                              e.preventDefault();
                              handleSave("Customer profile information updated successfully");
                            }}>
                              <div className="space-y-4">
                                <div className="flex flex-col">
                                  <label className="mb-1 flex items-center text-[#412A5F]">
                                    <User className="size-4 mr-2" />
                                    Full Name
                                  </label>
                                  <Input
                                    placeholder="Enter customer's full name"
                                    defaultValue={name || ''}
                                    className="bg-white/80"
                                  />
                                </div>

                                <div className="flex flex-col">
                                  <label className="mb-1 flex items-center text-[#412A5F]">
                                    <Mail className="size-4 mr-2" />
                                    Email Address
                                  </label>
                                  <Input
                                    placeholder="Enter customer's email"
                                    defaultValue={email || ''}
                                    className="bg-white/80"
                                  />
                                </div>

                                <div className="flex flex-col">
                                  <label className="mb-1 flex items-center text-[#412A5F]">
                                    <Phone className="size-4 mr-2" />
                                    Phone Number
                                  </label>
                                  <Input
                                    placeholder="Enter customer's phone number"
                                    defaultValue={phone || ''}
                                    className="bg-white/80"
                                  />
                                </div>

                                <div className="pt-2">
                                  <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                  >
                                    Update Customer Profile
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </div>

                          {/* Customer Address Management Section */}
                          <div className="bg-[#E3F2FD] rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-xl font-bold">Customer Addresses</h2>
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
                              {addresses.length > 0 ? addresses.map(address => (
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
                                    <p>{formatAddress(address)}</p>
                                    <div className="flex items-center mt-1">
                                      <Phone className="size-3 mr-1" />
                                      <span className="text-sm">{address.phone}</span>
                                    </div>
                                  </div>
                                </div>
                              )) : (
                                <div className="bg-white rounded-lg p-8 text-center">
                                  <p className="text-gray-500">No addresses added yet</p>
                                  <p className="text-sm text-gray-400 mt-1">Customer can add addresses from their profile</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Customer Account Information */}
                          <div className="bg-white rounded-lg p-6 border shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="flex flex-col space-y-1">
                                <span className="text-sm text-gray-500">Customer ID</span>
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
                              <div className="flex flex-col space-y-1">
                                <span className="text-sm text-gray-500">Account Status</span>
                                <Select defaultValue={status?.toLowerCase() || 'active'} name="status">
                                  <SelectTrigger className="bg-[#F8F7FF]">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="deactivated">Deactivated</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Seller Profile - Complex Tabbed Layout like actual seller profile */
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
                                    defaultValue={name || ''}
                                    className="bg-[#F8F7FF]"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <span className="text-sm text-gray-500">Email Address</span>
                                  <Input
                                    name="email"
                                    defaultValue={email || ''}
                                    className="bg-[#F8F7FF]"
                                  />
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <span className="text-sm text-gray-500">Phone Number</span>
                                  <Input
                                    name="phone"
                                    defaultValue={phone || ''}
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

                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                                  <p>
                                    <span className="font-semibold">Note:</span> Payment type determines how the seller will be charged for transactions. Only administrators can change this setting.
                                  </p>
                                </div>
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
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                                  <p>
                                    <span className="font-semibold">Note:</span> The rate band determines pricing tiers and commission structures that apply to this seller.
                                  </p>
                                </div>
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
                                    defaultValue={formatAddress(address) || ''}
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
                                  <span className="text-sm text-gray-500">KYC Status:</span>
                                  <div className={`px-3 py-2 rounded-md text-sm font-medium ${status === 'verified'
                                    ? 'bg-green-100 text-green-800'
                                    : status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {status === 'verified' ? '✅ KYC Verified' :
                                      status === 'rejected' ? '❌ KYC Rejected' :
                                        '⏳ KYC Pending'}
                                  </div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-md">
                                  <p className="text-sm text-blue-700">
                                    <strong>Note:</strong> KYC status is determined by document verification.
                                    Use the KYC tab to verify individual documents.
                                  </p>
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <span className="text-sm text-gray-500">Last Active</span>
                                  <Input
                                    defaultValue={lastActive || ''}
                                    className="bg-[#F8F7FF] text-gray-500"
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end items-center mt-6 gap-4">
                            {hasProposedChanges && (
                              <Button
                                variant="outline"
                                className="flex items-center gap-2"
                                type="button"
                                onClick={createAgreementFromChanges}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="12" x2="12" y1="18" y2="12" />
                                  <line x1="9" x2="15" y1="15" y2="15" />
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
                          {type === 'Seller' && (
                            <Button
                              variant="outline"
                              className="flex items-center gap-2"
                              onClick={() => {
                                // This would open a form to create a new agreement
                                document.getElementById('new-agreement-form')?.classList.remove('hidden');
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" x2="12" y1="18" y2="12" />
                                <line x1="9" x2="15" y1="15" y2="15" />
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
                              onClick={async () => {
                                if (!mongoId) {
                                  toast.error('Unable to create agreement: Missing seller ID');
                                  return;
                                }

                                try {
                                  // Get form data
                                  const title = (document.getElementById('agreement-title') as HTMLInputElement)?.value;
                                  const description = (document.getElementById('agreement-description') as HTMLTextAreaElement)?.value;

                                  if (!title || !description) {
                                    toast.error('Please fill in title and description');
                                    return;
                                  }

                                  // Here you would call the create agreement API
                                  // await ServiceFactory.admin.createSellerAgreement(mongoId, {
                                  //   title,
                                  //   content: description,
                                  //   type: 'service',
                                  //   status: 'draft'
                                  // });

                                  document.getElementById('new-agreement-form')?.classList.add('hidden');
                                  setActiveTab("agreement");
                                  handleSave("Agreement created and sent to seller for approval");

                                  // Refresh agreements list
                                  fetchAgreements();
                                } catch (error) {
                                  console.error('Error creating agreement:', error);
                                  toast.error('Failed to create agreement');
                                }
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

                          {type === 'Seller' ? (
                            <div className="divide-y">
                              {isLoadingAgreements ? (
                                <div className="p-8 text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                  <p className="text-gray-500 mt-2">Loading agreements...</p>
                                </div>
                              ) : agreements.length > 0 ? (
                                agreements.map((agreement, index) => (
                                  <div key={agreement._id || index} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{agreement.title || 'Untitled Agreement'}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{agreement.content || 'No description available'}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${agreement.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : agreement.status === 'draft'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {agreement.status === 'active' ? 'Active' :
                                              agreement.status === 'draft' ? 'Pending Approval' :
                                                agreement.status || 'Unknown'}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {agreement.effectiveDate
                                              ? `Since: ${new Date(agreement.effectiveDate).toLocaleDateString()}`
                                              : agreement.createdAt
                                                ? `Created: ${new Date(agreement.createdAt).toLocaleDateString()}`
                                                : 'No date'}
                                          </span>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">View Details</Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center text-gray-500">
                                  <p>No agreements found for this seller.</p>
                                  <p className="text-sm mt-1">Create a new agreement to get started.</p>
                                </div>
                              )}
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
