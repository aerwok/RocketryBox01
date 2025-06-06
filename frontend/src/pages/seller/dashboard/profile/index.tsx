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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const refreshProfile = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Manual profile refresh triggered');

      // Force refresh by adding timestamp to avoid cached responses
      const response = await ServiceFactory.seller.profile.get();
      if (!response.success) {
        throw new Error(response.message || 'Failed to refresh profile');
      }

      const profileData = response.data as Seller | TeamMemberProfile;
      const prevProfile = profile;

      setProfile(profileData);

      // Check if any documents status changed and show specific notification
      if (prevProfile && !isTeamMemberProfile(prevProfile) && !isTeamMemberProfile(profileData)) {
        const prevDocs = (prevProfile as any)?.documents;
        const newDocs = (profileData as any)?.documents;

        if (prevDocs && newDocs) {
          const changes = [];
          if (prevDocs.gstin?.status !== newDocs.gstin?.status) {
            changes.push(`GST: ${newDocs.gstin?.status || 'pending'}`);
          }
          if (prevDocs.pan?.status !== newDocs.pan?.status) {
            changes.push(`PAN: ${newDocs.pan?.status || 'pending'}`);
          }
          if (prevDocs.aadhaar?.status !== newDocs.aadhaar?.status) {
            changes.push(`Aadhaar: ${newDocs.aadhaar?.status || 'pending'}`);
          }

          if (changes.length > 0) {
            toast.success('Document Status Updated!', {
              description: `Latest status: ${changes.join(', ')}`
            });
          } else {
            toast.success('Profile refreshed successfully!', {
              description: 'Your profile data is now up to date.'
            });
          }
        } else {
          toast.success('Profile refreshed successfully!');
        }
      } else {
        toast.success('Profile refreshed successfully!');
      }

      console.log('✅ Profile refresh completed');
    } catch (err) {
      console.error('❌ Error refreshing profile:', err);
      toast.error('Failed to refresh profile data', {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setIsRefreshing(false);
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

    // Set up automatic refresh every 30 seconds to catch admin updates
    const refreshInterval = setInterval(async () => {
      try {
        const response = await ServiceFactory.seller.profile.get();
        if (response.success) {
          const profileData = response.data as Seller | TeamMemberProfile;
          setProfile(prevProfile => {
            // Check if documents have been updated by comparing KYC status
            if (prevProfile && !isTeamMemberProfile(prevProfile) && !isTeamMemberProfile(profileData)) {
              const prevDocs = (prevProfile as any)?.documents;
              const newDocs = (profileData as any)?.documents;

              if (prevDocs && newDocs) {
                // Check specific document status changes
                const gstChanged = prevDocs.gstin?.status !== newDocs.gstin?.status;
                const panChanged = prevDocs.pan?.status !== newDocs.pan?.status;
                const aadhaarChanged = prevDocs.aadhaar?.status !== newDocs.aadhaar?.status;

                if (gstChanged || panChanged || aadhaarChanged) {
                  console.log('📄 Document status updated by admin:', {
                    gst: { from: prevDocs.gstin?.status, to: newDocs.gstin?.status },
                    pan: { from: prevDocs.pan?.status, to: newDocs.pan?.status },
                    aadhaar: { from: prevDocs.aadhaar?.status, to: newDocs.aadhaar?.status }
                  });

                  let updateMessage = 'KYC document status updated!';
                  if (gstChanged) updateMessage += ` GST: ${newDocs.gstin?.status || 'pending'}`;
                  if (panChanged) updateMessage += ` PAN: ${newDocs.pan?.status || 'pending'}`;
                  if (aadhaarChanged) updateMessage += ` Aadhaar: ${newDocs.aadhaar?.status || 'pending'}`;

                  toast.success('Document Status Updated!', {
                    description: updateMessage
                  });
                }
              }
            }

            return profileData;
          });
        }
      } catch (err) {
        console.error('Background refresh failed:', err);
        // Silently fail for background refresh
      }
    }, 30000); // 30 seconds

    // Set up real-time updates via WebSocket (optional enhancement)
    let socket: any = null;
    try {
      const setupWebSocket = async () => {
        try {
          // Import socket.io-client dynamically (only if available)
          const io = (await import('socket.io-client')).default;

          socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            timeout: 5000
          });

          // Join seller-specific room for updates
          if (profile && !isTeamMemberProfile(profile)) {
            socket.emit('join', `seller:${profile.id}`);
            console.log('🔌 Joined seller room for real-time updates');
          }

          // Listen for profile updates from admin
          socket.on('profile:updated', (data: any) => {
            console.log('📡 Real-time profile update received:', data);

            // Trigger immediate refresh
            fetchProfile();

            toast.success('Profile Updated!', {
              description: data.message || 'Your profile has been updated by an admin.'
            });
          });

          console.log('🔌 WebSocket connected for real-time updates');
        } catch (socketError: any) {
          console.warn('⚠️ WebSocket connection failed (optional feature):', socketError?.message || socketError);
          // Continue without real-time updates - not critical
        }
      };

      // Only try WebSocket if we have a main seller profile
      if (profile && !isTeamMemberProfile(profile)) {
        setupWebSocket();
      }
    } catch (err) {
      console.warn('⚠️ WebSocket setup failed (optional feature):', err);
      // Continue without real-time updates - not critical
    }

    return () => {
      clearInterval(refreshInterval);
      if (socket) {
        socket.disconnect();
        console.log('🔌 WebSocket disconnected');
      }
    };
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
                  <p className="text-gray-600 mt-1">{profile.companyName || profile.businessName}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Seller ID</p>
                    <p className="font-medium">@{(profile as any)?.rbUserId || profile.id}</p>
                  </div>
                  {(profile as any)?.monthlyShipments && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Monthly Volume: {(profile as any).monthlyShipments}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Member since: {(profile as any)?.createdAt
                      ? new Date((profile as any).createdAt).toLocaleDateString()
                      : 'N/A'
                    }</p>
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
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{profile.phone}</span>
              </div>
              {profile.supportContact && profile.supportContact !== profile.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">
                    <span className="text-xs text-gray-400">Support:</span> {profile.supportContact}
                  </span>
                </div>
              )}
              {profile.supportEmail && profile.supportEmail !== profile.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">
                    <span className="text-xs text-gray-400">Support:</span> {profile.supportEmail}
                  </span>
                </div>
              )}
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
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${storeLinksErrors[store.key as keyof StoreLinksInput]
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
            <div className="flex gap-2">
              <Button
                onClick={refreshProfile}
                variant="outline"
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                ) : (
                  "🔄"
                )}
                Refresh
              </Button>
              <Button onClick={handleEditRequest} variant="outline">
                {isTeamMemberProfile(profile) ? "Request Changes" : "Request Edit"}
              </Button>
            </div>
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
                        value="account-settings"
                        className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-4"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Account
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
                      <h3 className="text-lg font-semibold mb-6">Company & Business Information</h3>

                      <div className="space-y-6">
                        {/* Personal Details Section */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">Owner Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                              <p className="mt-1 font-medium">{profile.name || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                              <p className="mt-1">{profile.email || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                              <p className="mt-1">{profile.phone || "Not provided"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Business Details Section */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">Business Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                              <p className="mt-1 font-medium">{profile.companyName || profile.businessName || "Not provided"}</p>
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
                              <h3 className="text-sm font-medium text-gray-500">Monthly Shipments</h3>
                              <p className="mt-1">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                                  {(profile as any)?.monthlyShipments || "Not specified"}
                                </span>
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Website</h3>
                              <p className="mt-1">{profile.website || "Not provided"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details Section */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">Contact Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        {/* Registration Information */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Registration Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Seller ID:</span>
                              <span className="ml-2 font-medium">{(profile as any)?.rbUserId || profile.id || "Not available"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Registration Date:</span>
                              <span className="ml-2 font-medium">
                                {(profile as any)?.createdAt
                                  ? new Date((profile as any).createdAt).toLocaleDateString()
                                  : 'Not available'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="primary-address">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h3 className="text-lg font-semibold mb-6">Business Address Information</h3>

                      {profile.address ? (
                        <div className="space-y-6">
                          {/* Complete Address Display */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Complete Address</h4>
                            <p className="text-gray-900">
                              {[
                                (profile.address as any)?.address1,
                                (profile.address as any)?.address2,
                                profile.address.street
                              ].filter(Boolean).join(', ') || 'Address not provided'}
                              {(profile.address.city || profile.address.state || (profile.address as any)?.pincode || profile.address.postalCode) && (
                                <>
                                  <br />
                                  {[
                                    profile.address.city,
                                    profile.address.state,
                                    (profile.address as any)?.pincode || profile.address.postalCode,
                                    profile.address.country || 'India'
                                  ].filter(Boolean).join(', ')}
                                </>
                              )}
                            </p>
                          </div>

                          {/* Detailed Address Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Address Line 1</h3>
                              <p className="mt-1 font-medium">{(profile.address as any)?.address1 || profile.address.street || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Address Line 2</h3>
                              <p className="mt-1">{(profile.address as any)?.address2 || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">City</h3>
                              <p className="mt-1 font-medium">{profile.address.city || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">State</h3>
                              <p className="mt-1 font-medium">{profile.address.state || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Postal Code / PIN Code</h3>
                              <p className="mt-1 font-medium">{profile.address.postalCode || (profile.address as any)?.pincode || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Country</h3>
                              <p className="mt-1 font-medium">{profile.address.country || "India"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Landmark</h3>
                              <p className="mt-1">{profile.address.landmark || "Not provided"}</p>
                            </div>
                          </div>

                          {/* Address Verification Status */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium text-blue-900">Address Verification</h4>
                                <p className="text-sm text-blue-700">
                                  This address was provided during registration and is used for business verification and correspondence.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No address information available</p>
                          <p className="text-sm text-gray-400 mt-1">Please add your business address to complete your profile</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h3 className="text-lg font-semibold mb-6">KYC Documents & Verification Status</h3>

                      {/* KYC Document Cards */}
                      <div className="space-y-4">
                        {/* GST Document */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <h4 className="font-medium text-gray-900">GST Certificate</h4>
                                <p className="text-sm text-gray-500">
                                  {typeof profile.documents?.gstin === 'object'
                                    ? (profile.documents.gstin as any)?.number || "Not provided"
                                    : profile.documents?.gstin || "Not provided"
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${(profile.documents?.gstin as any)?.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : (profile.documents?.gstin as any)?.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {(profile.documents?.gstin as any)?.status === 'verified'
                                  ? '✓ Verified'
                                  : (profile.documents?.gstin as any)?.status === 'rejected'
                                    ? '✗ Rejected'
                                    : '⏳ Pending'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* PAN Document */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <h4 className="font-medium text-gray-900">PAN Card</h4>
                                <p className="text-sm text-gray-500">
                                  {typeof profile.documents?.pan === 'object'
                                    ? (profile.documents.pan as any)?.number || "Not provided"
                                    : profile.documents?.pan || "Not provided"
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${(profile.documents?.pan as any)?.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : (profile.documents?.pan as any)?.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {(profile.documents?.pan as any)?.status === 'verified'
                                  ? '✓ Verified'
                                  : (profile.documents?.pan as any)?.status === 'rejected'
                                    ? '✗ Rejected'
                                    : '⏳ Pending'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Aadhaar Document */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <h4 className="font-medium text-gray-900">Aadhaar Card</h4>
                                <p className="text-sm text-gray-500">
                                  {typeof profile.documents?.aadhaar === 'object'
                                    ? (profile.documents.aadhaar as any)?.number || "Not provided"
                                    : profile.documents?.aadhaar || "Not provided"
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${(profile.documents?.aadhaar as any)?.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : (profile.documents?.aadhaar as any)?.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {(profile.documents?.aadhaar as any)?.status === 'verified'
                                  ? '✓ Verified'
                                  : (profile.documents?.aadhaar as any)?.status === 'rejected'
                                    ? '✗ Rejected'
                                    : '⏳ Pending'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Overall KYC Status */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-blue-900">Overall KYC Status</h4>
                              <p className="text-sm text-blue-700">
                                {(() => {
                                  const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                  const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                  const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                  if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                    return 'All documents verified - KYC Complete ✓';
                                  } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                    return 'Some documents rejected - Please contact support';
                                  } else {
                                    return 'KYC verification in progress - Waiting for admin approval';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank-details">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h3 className="text-lg font-semibold mb-6">Bank Account Details</h3>

                      {profile.bankDetails && typeof profile.bankDetails === 'object' ? (
                        <div className="space-y-6">
                          {/* Bank Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                              <p className="mt-1 font-medium">{(profile.bankDetails as any)?.accountType || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Bank Name</h3>
                              <p className="mt-1 font-medium">{(profile.bankDetails as any)?.bankName || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Account Number</h3>
                              <p className="mt-1 font-medium">{(profile.bankDetails as any)?.accountNumber || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Account Holder Name</h3>
                              <p className="mt-1 font-medium">{(profile.bankDetails as any)?.accountHolderName || (profile.bankDetails as any)?.accountName || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Branch Name</h3>
                              <p className="mt-1 font-medium">{(profile.bankDetails as any)?.branchName || "Not provided"}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">IFSC Code</h3>
                              <p className="mt-1 font-medium">{(profile.bankDetails as any)?.ifscCode || "Not provided"}</p>
                            </div>
                          </div>

                          {/* Cancelled Cheque Verification Section */}
                          <div className="border-t pt-6">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">Cancelled Cheque</h4>
                                    <p className="text-sm text-gray-500">Required for bank verification</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${(profile.bankDetails as any)?.cancelledCheque?.status === 'verified'
                                    ? 'bg-green-100 text-green-800'
                                    : (profile.bankDetails as any)?.cancelledCheque?.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {(profile.bankDetails as any)?.cancelledCheque?.status === 'verified'
                                      ? '✓ Verified'
                                      : (profile.bankDetails as any)?.cancelledCheque?.status === 'rejected'
                                        ? '✗ Rejected'
                                        : '⏳ Pending Verification'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bank Verification Status */}
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-blue-900">Bank Details Verification</h4>
                                  <p className="text-sm text-blue-700">
                                    {(profile.bankDetails as any)?.cancelledCheque?.status === 'verified'
                                      ? 'Your bank details have been verified and approved by our team'
                                      : (profile.bankDetails as any)?.cancelledCheque?.status === 'rejected'
                                        ? 'Bank details verification was rejected. Please contact support for assistance'
                                        : 'Bank details are under review by our verification team'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No bank details available</p>
                          <p className="text-sm text-gray-400 mt-1">Please add your bank information to complete your profile</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="account-settings">
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h3 className="text-lg font-semibold mb-6">Account Settings & Status</h3>

                      <div className="space-y-6">
                        {/* Account Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Account Status</h4>
                            <p className="mt-1">
                              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${(() => {
                                // Calculate KYC status based on documents
                                const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                  return 'bg-green-100 text-green-800';
                                } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                  return 'bg-red-100 text-red-800';
                                } else {
                                  return 'bg-yellow-100 text-yellow-800';
                                }
                              })()}`}>
                                {(() => {
                                  // Calculate KYC status based on documents
                                  const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                  const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                  const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                  if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                    return '✓ Verified';
                                  } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                    return '✗ Rejected';
                                  } else {
                                    return '⏳ Pending Verification';
                                  }
                                })()}
                              </span>
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Payment Type</h4>
                            <p className="mt-1 font-medium">
                              {(profile as any)?.paymentType === 'credit' ? 'Credit Account' :
                                (profile as any)?.paymentType === 'wallet' ? 'Wallet Prepaid' :
                                  'Wallet Prepaid'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Rate Band</h4>
                            <p className="mt-1 font-medium">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium mr-2 ${(() => {
                                const rateBand = (profile as any)?.rateBand || 'RBX1';
                                if (rateBand === 'RBX1' || rateBand.includes('RBX1')) {
                                  return 'bg-blue-100 text-blue-800'; // RBX1 is base rate - blue
                                } else if (rateBand.includes('Premium') || rateBand.includes('Enterprise')) {
                                  return 'bg-green-100 text-green-800'; // Premium rates - green
                                } else if (rateBand === 'Basic') {
                                  return 'bg-red-100 text-red-800'; // Basic rates - red
                                } else {
                                  return 'bg-gray-100 text-gray-800'; // Custom rates - gray
                                }
                              })()}`}>
                                {(profile as any)?.rateBand || 'RBX1'}
                              </span>
                              {(profile as any)?.rateCardDetails?.isCustom && (
                                <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                  Custom
                                </span>
                              )}
                              {(profile as any)?.rateCardDetails?.isDefault && (
                                <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                  Default
                                </span>
                              )}
                            </p>
                            {(profile as any)?.rateCardDetails?.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {(profile as any).rateCardDetails.description}
                              </p>
                            )}
                          </div>
                          {(profile as any)?.paymentType === 'credit' && (
                            <>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Credit Limit</h4>
                                <p className="mt-1 font-medium">
                                  ₹{(profile as any)?.creditLimit?.toLocaleString() || 'Not set'}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Credit Period</h4>
                                <p className="mt-1 font-medium">
                                  {(profile as any)?.creditPeriod || 'Not set'} days
                                </p>
                              </div>
                            </>
                          )}
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Wallet Balance</h4>
                            <p className="mt-1 font-medium text-green-600">
                              ₹{(() => {
                                const balance = (profile as any)?.walletBalance;
                                if (typeof balance === 'string') {
                                  return parseFloat(balance).toLocaleString('en-IN');
                                } else if (typeof balance === 'number') {
                                  return balance.toLocaleString('en-IN');
                                }
                                return '0';
                              })()}
                            </p>
                          </div>
                        </div>

                        {/* Admin Settings Notice */}
                        <div className={`border rounded-lg p-4 ${(() => {
                          // Calculate KYC status for styling
                          const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                          const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                          const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                          if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                            return 'bg-green-50 border-green-200';
                          } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                            return 'bg-red-50 border-red-200';
                          } else {
                            return 'bg-blue-50 border-blue-200';
                          }
                        })()}`}>
                          <div className="flex items-start gap-3">
                            <Shield className={`w-5 h-5 mt-0.5 ${(() => {
                              // Calculate KYC status for icon color
                              const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                              const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                              const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                              if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                return 'text-green-600';
                              } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                return 'text-red-600';
                              } else {
                                return 'text-blue-600';
                              }
                            })()}`} />
                            <div>
                              <h4 className={`font-medium ${(() => {
                                // Calculate KYC status for text color
                                const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                  return 'text-green-900';
                                } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                  return 'text-red-900';
                                } else {
                                  return 'text-blue-900';
                                }
                              })()}`}>Admin Controlled Settings</h4>
                              <p className={`text-sm mt-1 ${(() => {
                                // Calculate KYC status for description text color
                                const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                  return 'text-green-700';
                                } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                  return 'text-red-700';
                                } else {
                                  return 'text-blue-700';
                                }
                              })()}`}>
                                {(() => {
                                  // Calculate KYC status for message
                                  const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                  const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                  const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                  if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                    return 'Your account is fully verified! Payment type, rate band, and credit limits are now active and managed by our admin team based on your business requirements.';
                                  } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                    return 'Some documents require attention. Please check the Documents tab and contact support if needed. Account settings will be updated once verification is complete.';
                                  } else {
                                    return 'Payment type, rate band, credit limits, and account status are managed by our admin team. These settings are updated automatically based on your account verification and business requirements.';
                                  }
                                })()}
                              </p>
                              <p className={`text-xs mt-2 ${(() => {
                                // Calculate KYC status for last updated text color
                                const gstStatus = (profile.documents?.gstin as any)?.status || 'pending';
                                const panStatus = (profile.documents?.pan as any)?.status || 'pending';
                                const aadhaarStatus = (profile.documents?.aadhaar as any)?.status || 'pending';

                                if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
                                  return 'text-green-600';
                                } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
                                  return 'text-red-600';
                                } else {
                                  return 'text-blue-600';
                                }
                              })()}`}>
                                Last updated: {(profile as any)?.updatedAt
                                  ? new Date((profile as any).updatedAt).toLocaleDateString()
                                  : new Date().toLocaleDateString()
                                } (Auto-refreshes every 30 seconds)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Registration Details */}
                        <div className="border-t pt-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-4">Registration Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-medium text-gray-400">Original Monthly Shipments</h5>
                              <p className="mt-1 text-sm">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs">
                                  {(profile as any)?.monthlyShipments || 'Not specified'}
                                </span>
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-400">Seller ID</h5>
                              <p className="mt-1 text-sm font-mono">{(profile as any)?.rbUserId || profile.id || 'Not available'}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-400">Account Created</h5>
                              <p className="mt-1 text-sm">
                                {(profile as any)?.createdAt
                                  ? new Date((profile as any).createdAt).toLocaleDateString()
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-400">Last Login</h5>
                              <p className="mt-1 text-sm">
                                {(profile as any)?.lastLogin
                                  ? new Date((profile as any).lastLogin).toLocaleString()
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-400">Last Updated</h5>
                              <p className="mt-1 text-sm">
                                {(profile as any)?.updatedAt
                                  ? new Date((profile as any).updatedAt).toLocaleDateString()
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
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
