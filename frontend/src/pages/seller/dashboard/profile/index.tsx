import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamMemberProfile } from "@/services/profile.service";
import { ServiceFactory } from "@/services/service-factory";
import { Seller } from "@/types/api";
import { Building2, Check, CreditCard, Edit2, FileText, Link2Icon, Mail, MapPin, Phone, ScrollText, Shield, User, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Agreement from "./components/agreement";

const STORE_LINKS = [
  { icon: "/icons/web.svg", label: "Website", key: "website", placeholder: "Enter website URL" },
  { icon: "/icons/amazon.svg", label: "Amazon Store", key: "amazon", placeholder: "Enter Amazon store URL" },
  { icon: "/icons/shopify.svg", label: "Shopify Store", key: "shopify", placeholder: "Enter Shopify store URL" },
  { icon: "/icons/opencart.svg", label: "OpenCart Store", key: "opencart", placeholder: "Enter OpenCart store URL" },
];

// Store Links validation schema
const storeLinksSchema = z.object({
  website: z.string().optional().refine(val => !val || val === '' || /^https?:\/\/.+/.test(val), {
    message: "Website URL must be valid (starting with http:// or https://)"
  }),
  amazon: z.string().optional().refine(val => !val || val === '' || /^https?:\/\/.+/.test(val), {
    message: "Amazon Store URL must be valid (starting with http:// or https://)"
  }),
  shopify: z.string().optional().refine(val => !val || val === '' || /^https?:\/\/.+/.test(val), {
    message: "Shopify Store URL must be valid (starting with http:// or https://)"
  }),
  opencart: z.string().optional().refine(val => !val || val === '' || /^https?:\/\/.+/.test(val), {
    message: "OpenCart Store URL must be valid (starting with http:// or https://)"
  }),
});

type StoreLinksInput = z.infer<typeof storeLinksSchema>;

const SellerProfilePage = () => {
  const [activeTab, setActiveTab] = useState("company-details");
  const [profile, setProfile] = useState<Seller | TeamMemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingStoreLinks, setIsEditingStoreLinks] = useState(false);
  const [storeLinksLoading, setStoreLinksLoading] = useState(false);
  const [storeLinksForm, setStoreLinksForm] = useState<StoreLinksInput>({
    website: "",
    amazon: "",
    shopify: "",
    opencart: ""
  });
  const [storeLinksErrors, setStoreLinksErrors] = useState<Partial<StoreLinksInput>>({});

  // Type guard to check if profile is a team member
  const isTeamMemberProfile = (profile: Seller | TeamMemberProfile): profile is TeamMemberProfile => {
    return 'isTeamMember' in profile && profile.isTeamMember === true;
  };

  // Store Links functions
  const validateUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty URLs are allowed
    return /^https?:\/\/.+/.test(url);
  };

  const handleStoreLinksEdit = () => {
    if (profile && !isTeamMemberProfile(profile)) {
      setStoreLinksForm({
        website: profile.storeLinks?.website || "",
        amazon: profile.storeLinks?.amazon || "",
        shopify: profile.storeLinks?.shopify || "",
        opencart: profile.storeLinks?.opencart || ""
      });
      setStoreLinksErrors({});
      setIsEditingStoreLinks(true);
    }
  };

  const handleStoreLinksCancel = () => {
    setIsEditingStoreLinks(false);
    setStoreLinksForm({
      website: "",
      amazon: "",
      shopify: "",
      opencart: ""
    });
    setStoreLinksErrors({});
  };

  const handleStoreLinksSubmit = async () => {
    // Validate all URLs
    const errors: Partial<StoreLinksInput> = {};

    if (storeLinksForm.website && !validateUrl(storeLinksForm.website)) {
      errors.website = "Website URL must be valid (starting with http:// or https://)";
    }
    if (storeLinksForm.amazon && !validateUrl(storeLinksForm.amazon)) {
      errors.amazon = "Amazon Store URL must be valid (starting with http:// or https://)";
    }
    if (storeLinksForm.shopify && !validateUrl(storeLinksForm.shopify)) {
      errors.shopify = "Shopify Store URL must be valid (starting with http:// or https://)";
    }
    if (storeLinksForm.opencart && !validateUrl(storeLinksForm.opencart)) {
      errors.opencart = "OpenCart Store URL must be valid (starting with http:// or https://)";
    }

    if (Object.keys(errors).length > 0) {
      setStoreLinksErrors(errors);
      return;
    }

        try {
      setStoreLinksLoading(true);

      // Prepare the links object, including empty strings to clear existing links
      const linksToUpdate = {
        website: storeLinksForm.website?.trim() || "",
        amazon: storeLinksForm.amazon?.trim() || "",
        shopify: storeLinksForm.shopify?.trim() || "",
        opencart: storeLinksForm.opencart?.trim() || ""
      };

      await ServiceFactory.seller.profile.updateStoreLinks(linksToUpdate);

      // Update the local profile state
      if (profile && !isTeamMemberProfile(profile)) {
        setProfile({
          ...profile,
          storeLinks: linksToUpdate
        });
      }

      setIsEditingStoreLinks(false);
      toast.success('Store links updated successfully!');
    } catch (error) {
      console.error('Error updating store links:', error);
      toast.error('Failed to update store links. Please try again.');
    } finally {
      setStoreLinksLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await ServiceFactory.seller.profile.get();
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch profile');
        }
        const profileData = response.data as Seller | TeamMemberProfile;
        setProfile(profileData);

        // Set default tab based on profile type
        if (isTeamMemberProfile(profileData)) {
          setActiveTab("team-details");
        } else {
          setActiveTab("company-details");
        }
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
      // TODO: Implement proper edit request endpoint
      if (profile && isTeamMemberProfile(profile)) {
        toast.info("Team member profile changes must be requested through the main account holder.");
      } else {
        toast.info("Edit request functionality will be available soon. Please contact support for profile changes.");
      }
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
              {isTeamMemberProfile(profile) ? (
                <>
                  <p className="text-gray-600 mt-1">{profile.jobRole}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Team Member</p>
                    <p className="font-medium">@{profile.id}</p>
                  </div>
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Working for: {profile.parentSellerName}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mt-1">{profile.companyName}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Seller ID</p>
                    <p className="font-medium">@{profile.id}</p>
                  </div>
                </>
              )}
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

          {/* Team Member Permissions Card (only for team members) */}
          {isTeamMemberProfile(profile) && (
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permissions
              </h3>
              <div className="space-y-2">
                {profile.teamMemberPermissions?.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Links Card (only for main sellers) */}
          {!isTeamMemberProfile(profile) && (
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Store Links</h3>
                {!isEditingStoreLinks && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStoreLinksEdit}
                    className="text-sm"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Update
                  </Button>
                )}
              </div>

              {isEditingStoreLinks ? (
                <div className="space-y-4">
                  {STORE_LINKS.map((store) => (
                    <div key={store.key} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <img
                          src={store.icon}
                          alt={store.label}
                          width={16}
                          height={16}
                          className="size-4"
                        />
                        {store.label}
                      </label>
                      <input
                        type="url"
                        placeholder={store.placeholder}
                        value={storeLinksForm[store.key as keyof StoreLinksInput] || ""}
                        onChange={(e) => {
                          setStoreLinksForm(prev => ({
                            ...prev,
                            [store.key]: e.target.value
                          }));
                          // Clear error when user starts typing
                          if (storeLinksErrors[store.key as keyof StoreLinksInput]) {
                            setStoreLinksErrors(prev => ({
                              ...prev,
                              [store.key]: undefined
                            }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          storeLinksErrors[store.key as keyof StoreLinksInput]
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                      {storeLinksErrors[store.key as keyof StoreLinksInput] && (
                        <p className="text-red-500 text-xs">{storeLinksErrors[store.key as keyof StoreLinksInput]}</p>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleStoreLinksSubmit}
                      disabled={storeLinksLoading}
                      size="sm"
                      className="text-sm"
                    >
                      {storeLinksLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleStoreLinksCancel}
                      disabled={storeLinksLoading}
                      size="sm"
                      className="text-sm"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
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
                          {profile.storeLinks?.[store.key as keyof typeof profile.storeLinks] || "Not provided"}
                        </span>
                      </div>
                      <Link2Icon className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Form Section */}
        <div className="w-full lg:w-[70%]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Profile Details</h2>
            <Button onClick={handleEditRequest} variant="outline">
              {isTeamMemberProfile(profile) ? "Request Changes" : "Request Edit"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="w-full">
              <div className="w-full overflow-auto scrollbar-hide max-w-[calc(100vw-64px-4rem)] mx-auto">
                <TabsList className="w-max min-w-full p-0 h-12 bg-white rounded-none relative justify-start">
                  <div className="absolute bottom-0 w-full h-px bg-violet-200"></div>

                  {/* Team Member Specific Tabs */}
                  {isTeamMemberProfile(profile) ? (
                    <>
                      <TabsTrigger
                        value="team-details"
                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Team Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="permissions"
                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Permissions
                      </TabsTrigger>
                    </>
                  ) : (
                    <>
                      {/* Main Seller Tabs */}
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
                    </>
                  )}
                </TabsList>
              </div>
            </div>

            <div className="mt-8">
              {/* Team Member Tabs Content */}
              {isTeamMemberProfile(profile) ? (
                <>
                  <TabsContent value="team-details">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                          <p className="mt-1">{profile.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Job Role</h3>
                          <p className="mt-1">{profile.jobRole}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                          <p className="mt-1">{profile.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                          <p className="mt-1">{profile.phone || "Not provided"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Working For</h3>
                          <p className="mt-1">{profile.parentSellerName}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${profile.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {profile.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="permissions">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-700">
                            These permissions determine which sections and features you can access in the dashboard.
                            Changes to permissions must be requested through the main account holder.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Current Permissions</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {profile.teamMemberPermissions?.map((permission, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-green-800 font-medium">{permission}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </>
              ) : (
                <>
                  {/* Main Seller Tabs Content */}
                  <TabsContent value="company-details">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                          <p className="mt-1">{profile.companyName || profile.businessName || "Not provided"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Company Category</h3>
                          <p className="mt-1">{profile.companyCategory || "Not provided"}</p>
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
                              <p className="mt-1">{profile.address.street || `${(profile.address as any)?.address1 || ''} ${(profile.address as any)?.address2 || ''}`.trim() || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Landmark</h3>
                              <p className="mt-1">{profile.address.landmark || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">City</h3>
                              <p className="mt-1">{profile.address.city || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">State</h3>
                              <p className="mt-1">{profile.address.state || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Country</h3>
                              <p className="mt-1">{profile.address.country || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Postal Code</h3>
                              <p className="mt-1">{profile.address.postalCode || (profile.address as any)?.pincode || "Not provided"}</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">GSTIN</h3>
                          <p className="mt-1">{profile.documents?.gstin || "Not provided"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">PAN</h3>
                          <p className="mt-1">{profile.documents?.pan || "Not provided"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Aadhaar</h3>
                          <p className="mt-1">{profile.documents?.aadhaar || "Not provided"}</p>
                        </div>
                      </div>

                      {/* Document List */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
                        <div className="space-y-4">
                          {profile.documents?.documents && Array.isArray(profile.documents.documents) && profile.documents.documents.length > 0 ? (
                            profile.documents.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{doc.name}</p>
                                    <p className="text-sm text-gray-500">{doc.type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-md text-xs ${doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                                    doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                    {doc.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">No documents uploaded yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank-details">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      {profile.bankDetails && typeof profile.bankDetails === 'object' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                            <p className="mt-1">{(profile.bankDetails as any)?.accountType || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Bank Name</h3>
                            <p className="mt-1">{(profile.bankDetails as any)?.bankName || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Account Number</h3>
                            <p className="mt-1">{(profile.bankDetails as any)?.accountNumber || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Account Holder Name</h3>
                            <p className="mt-1">{(profile.bankDetails as any)?.accountHolderName || (profile.bankDetails as any)?.accountName || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">IFSC Code</h3>
                            <p className="mt-1">{(profile.bankDetails as any)?.ifscCode || "Not provided"}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Cancelled Cheque Status</h3>
                            <p className="mt-1">
                              <span className={`px-2 py-1 rounded-md text-xs ${(profile.bankDetails as any)?.cancelledCheque?.status === 'verified' ? 'bg-green-100 text-green-800' :
                                (profile.bankDetails as any)?.cancelledCheque?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {(profile.bankDetails as any)?.cancelledCheque?.status || "Not provided"}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No bank details available</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="agreement">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <Agreement onSave={() => { }} />
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
