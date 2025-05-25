import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Search, Tag, Trash, Edit, RefreshCw, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ServiceFactory } from "@/services/service-factory";
import { Partner, ApiStatus, ServiceType } from "@/services/partners.service";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortField = "name" | "apiStatus" | "performanceScore" | "lastUpdated" | "shipmentCount";
type SortOrder = "asc" | "desc";

const getStatusStyle = (status: ApiStatus) => {
    return {
        active: "bg-green-50 text-green-700",
        inactive: "bg-neutral-100 text-neutral-700",
        maintenance: "bg-yellow-50 text-yellow-700",
    }[status];
};

const getStatusColor = (status: ApiStatus) => {
    return {
        active: "bg-green-500",
        inactive: "bg-neutral-400",
        maintenance: "bg-yellow-500",
    }[status];
};

const AdminPartnersPage = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
    const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
    const [showPartnerDetailsModal, setShowPartnerDetailsModal] = useState(false);
    const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [filteredStatus, setFilteredStatus] = useState<ApiStatus | "all">("all");
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [apiKeyRevealed, setApiKeyRevealed] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [newPartner, setNewPartner] = useState<Partial<Partner>>({
        name: "",
        supportEmail: "",
        supportContact: "",
        apiEndpoint: "",
        trackingUrl: "",
        serviceTypes: [],
        serviceAreas: [],
        weightLimits: { min: 0, max: 0 },
        dimensionLimits: {
            maxLength: 0,
            maxWidth: 0,
            maxHeight: 0,
            maxSum: 0
        },
        rates: {
            baseRate: 0,
            weightRate: 0,
            dimensionalFactor: 0
        },
        apiStatus: "inactive" as ApiStatus
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch partners on component mount and when filter changes
    useEffect(() => {
        const fetchPartners = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const filters = filteredStatus !== "all" ? { status: filteredStatus } : undefined;
                const response = await ServiceFactory.partners.getPartners(filters);
                setPartners(response.data?.data || response.data);
            } catch (err) {
                console.error("Error fetching partners:", err);
                setError("Failed to load partners. Please try again.");
                toast.error("Failed to load partners");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPartners();
    }, [filteredStatus]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleSelectPartner = (partnerId: string) => {
        setSelectedPartners(prev => {
            if (prev.includes(partnerId)) {
                return prev.filter(id => id !== partnerId);
            }
            return [...prev, partnerId];
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedPartners(filteredData.map(partner => partner.id));
        } else {
            setSelectedPartners([]);
        }
    };

    const handleDelete = async () => {
        if (selectedPartners.length === 0) {
            toast.error("Please select partners to delete");
            return;
        }

        setIsDeleting(true);
        try {
            await ServiceFactory.partners.deleteManyPartners(selectedPartners);
            toast.success(`${selectedPartners.length} partners deleted successfully`);
            
            // Refresh the partners list
            const filters = filteredStatus !== "all" ? { status: filteredStatus } : undefined;
            const response = await ServiceFactory.partners.getPartners(filters);
            setPartners(response.data.data || response.data);
            
            setSelectedPartners([]);
        } catch (error) {
            console.error("Error deleting partners:", error);
            toast.error("Failed to delete partners");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddTag = () => {
        if (selectedPartners.length === 0) {
            toast.error("Please select partners to add tag");
            return;
        }
        toast.success("Tags added successfully");
        setSelectedPartners([]);
    };

    const handleRefreshAPI = async () => {
        if (selectedPartners.length === 0) {
            toast.error("Please select partners to refresh API");
            return;
        }

        setIsRefreshing(true);
        try {
            const response = await ServiceFactory.partners.refreshPartnerAPIs(selectedPartners);
            const { successful, failed } = response.data;
            
            if (successful.length > 0) {
                toast.success(`${successful.length} APIs refreshed successfully`);
            }
            
            if (failed.length > 0) {
                toast.error(`${failed.length} APIs failed to refresh`);
            }
            
            // Refresh the partners list
            const filters = filteredStatus !== "all" ? { status: filteredStatus } : undefined;
            const refreshedPartnersResponse = await ServiceFactory.partners.getPartners(filters);
            setPartners(refreshedPartnersResponse.data.data || refreshedPartnersResponse.data);
            
            setSelectedPartners([]);
        } catch (error) {
            console.error("Error refreshing partner APIs:", error);
            toast.error("Failed to refresh partner APIs");
        } finally {
            setIsRefreshing(false);
        }
    };
    
    const handleEditPartner = async (partner: Partner) => {
        setIsActionLoading(true);
        try {
            const response = await ServiceFactory.partners.getPartnerById(partner.id);
            setCurrentPartner(response.data);
            setIsEditing(true);
            setShowPartnerDetailsModal(true);
            setApiKeyRevealed(false);
            setApiKey(response.data.apiKey || null);
        } catch (error) {
            console.error(`Error fetching partner details for ${partner.id}:`, error);
            toast.error("Failed to load partner details");
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleRevealApiKey = () => setApiKeyRevealed((prev) => !prev);
    
    const handleAddPartner = () => {
        setNewPartner({
            name: "",
            supportEmail: "",
            supportContact: "",
            apiEndpoint: "",
            trackingUrl: "",
            serviceTypes: [],
            serviceAreas: [],
            weightLimits: { min: 0, max: 0 },
            dimensionLimits: {
                maxLength: 0,
                maxWidth: 0,
                maxHeight: 0,
                maxSum: 0
            },
            rates: {
                baseRate: 0,
                weightRate: 0,
                dimensionalFactor: 0
            },
            apiStatus: "inactive" as ApiStatus
        });
        setShowAddPartnerModal(true);
    };
    
    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!newPartner.name?.trim()) {
            errors.name = "Partner name is required";
        }
        
        if (!newPartner.supportEmail?.trim()) {
            errors.supportEmail = "Support email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPartner.supportEmail)) {
            errors.supportEmail = "Invalid email format";
        }
        
        if (!newPartner.supportContact?.trim()) {
            errors.supportContact = "Support contact is required";
        }
        
        if (newPartner.apiEndpoint && !newPartner.apiEndpoint.startsWith('http')) {
            errors.apiEndpoint = "API endpoint must start with http:// or https://";
        }
        
        if (newPartner.trackingUrl && !newPartner.trackingUrl.startsWith('http')) {
            errors.trackingUrl = "Tracking URL must start with http:// or https://";
        }
        
        if (!newPartner.weightLimits?.min || newPartner.weightLimits.min < 0) {
            errors.minWeight = "Minimum weight is required and must be non-negative";
        }
        
        if (!newPartner.weightLimits?.max || newPartner.weightLimits.max < 0) {
            errors.maxWeight = "Maximum weight is required and must be non-negative";
        }
        
        if (newPartner.weightLimits?.min && newPartner.weightLimits?.max && 
            newPartner.weightLimits.min >= newPartner.weightLimits.max) {
            errors.weightLimits = "Minimum weight must be less than maximum weight";
        }
        
        if (!newPartner.rates?.baseRate || newPartner.rates.baseRate < 0) {
            errors.baseRate = "Base rate is required and must be non-negative";
        }
        
        if (!newPartner.rates?.weightRate || newPartner.rates.weightRate < 0) {
            errors.weightRate = "Weight rate is required and must be non-negative";
        }
        
        if (!newPartner.serviceTypes?.length) {
            errors.serviceTypes = "At least one service type is required";
        }
        
        if (!newPartner.serviceAreas?.length) {
            errors.serviceAreas = "At least one service area is required";
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const resetForm = () => {
        setNewPartner({
            name: "",
            supportEmail: "",
            supportContact: "",
            apiEndpoint: "",
            trackingUrl: "",
            serviceTypes: [],
            serviceAreas: [],
            weightLimits: { min: 0, max: 0 },
            dimensionLimits: {
                maxLength: 0,
                maxWidth: 0,
                maxHeight: 0,
                maxSum: 0
            },
            rates: {
                baseRate: 0,
                weightRate: 0,
                dimensionalFactor: 5000
            },
            apiStatus: "inactive" as ApiStatus
        });
        setFormErrors({});
    };
    
    const handleSavePartner = async () => {
        if (!validateForm()) {
            toast.error("Please fix the form errors before saving");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && currentPartner) {
                await ServiceFactory.partners.updatePartner(currentPartner.id, currentPartner);
                toast.success(`Partner ${currentPartner.name} updated successfully`);
            } else {
                await ServiceFactory.partners.createPartner(newPartner as Partner);
                toast.success("New partner added successfully");
                resetForm();
            }
            
            // Refresh the partners list
            const filters = filteredStatus !== "all" ? { status: filteredStatus } : undefined;
            const response = await ServiceFactory.partners.getPartners(filters);
            setPartners(response.data.data || response.data);
            
            setShowPartnerDetailsModal(false);
            setShowAddPartnerModal(false);
        } catch (error) {
            console.error("Error saving partner:", error);
            toast.error("Failed to save partner");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFilterByStatus = (status: ApiStatus | "all") => {
        setFilteredStatus(status);
    };

    // Filter partners based on search query
    const filteredData = (partners || []).filter(partner => {
        if (!partner || !partner.id) return false;
        
        const matchesSearch = 
            (partner.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (partner.supportEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (partner.id || '').toLowerCase().includes(searchQuery.toLowerCase());
            
        return matchesSearch;
    });

    // Sort filtered partners
    const sortedData = [...filteredData].sort((a, b) => {
        const aValue = typeof a[sortField] === 'string' 
            ? String(a[sortField]).toLowerCase() 
            : Number(a[sortField]);
        const bValue = typeof b[sortField] === 'string'
            ? String(b[sortField]).toLowerCase()
            : Number(b[sortField]);
            
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        return sortOrder === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold">
                        Shipping Partners Management
                    </h1>
                    <p className="text-base lg:text-lg text-muted-foreground mt-1">
                        Manage courier partners, API integrations, and service rates
                    </p>
                </div>
                <Button variant="primary" onClick={handleAddPartner}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Partner
                </Button>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-wrap items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search partners"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-gray-100/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={filteredStatus === "all" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleFilterByStatus("all")}
                        >
                            All
                        </Button>
                        <Button 
                            variant={filteredStatus === "active" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleFilterByStatus("active")}
                            className={filteredStatus === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                            Active
                        </Button>
                        <Button 
                            variant={filteredStatus === "inactive" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleFilterByStatus("inactive")}
                            className={filteredStatus === "inactive" ? "bg-neutral-500 hover:bg-neutral-600" : ""}
                        >
                            Inactive
                        </Button>
                        <Button 
                            variant={filteredStatus === "maintenance" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => handleFilterByStatus("maintenance")}
                            className={filteredStatus === "maintenance" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                            Maintenance
                        </Button>
                    </div>
                </div>
                {/* Action Buttons Section */}
                {selectedPartners.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline">
                            {selectedPartners.length} selected
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 bg-red-500 hover:bg-red-600 text-white hover:text-white"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <RefreshCw className="size-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                            <Trash className="size-4" />
                            Delete
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 bg-green-500 hover:bg-green-600 text-white hover:text-white"
                            onClick={handleAddTag}
                        >
                            <Tag className="size-4" />
                            Add Tag
                        </Button>
                        <Button
                            variant="primary"
                            className="gap-2"
                            onClick={handleRefreshAPI}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <>
                                    <RefreshCw className="size-4 animate-spin" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                            <RefreshCw className="size-4" />
                            Refresh API
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Partners Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F8F0FF]">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={selectedPartners.length === sortedData.length && sortedData.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("name")}
                                >
                                    Partner Name
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("apiStatus")}
                                >
                                    API Status
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("performanceScore")}
                                >
                                    Performance
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("shipmentCount")}
                                >
                                    Shipments
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                Service Types
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("lastUpdated")}
                                >
                                    Last Updated
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    Loading partners...
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-red-500">
                                    {error}
                                </TableCell>
                            </TableRow>
                        ) : sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    {searchQuery || filteredStatus !== "all" 
                                        ? "No shipping partners found matching your criteria"
                                        : "No shipping partners available. Click 'Add Partner' to add one."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((partner) => (
                                <TableRow key={partner.id} className="hover:bg-neutral-50">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={selectedPartners.includes(partner.id)}
                                            onChange={() => handleSelectPartner(partner.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{partner.name}</div>
                                        <div className="text-sm text-gray-500">{partner.supportEmail}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                getStatusColor(partner.apiStatus)
                                            )} />
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-sm",
                                                getStatusStyle(partner.apiStatus)
                                            )}>
                                                {partner.apiStatus}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-16 h-1.5 rounded-full bg-gray-200"
                                            )}>
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        parseInt(partner.performanceScore) >= 95 ? "bg-green-500" :
                                                        parseInt(partner.performanceScore) >= 85 ? "bg-yellow-500" :
                                                        "bg-red-500"
                                                    )}
                                                    style={{ width: partner.performanceScore }}
                                                />
                                            </div>
                                            <span>{partner.performanceScore}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Success: {partner.deliverySuccess}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {partner.shipmentCount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(partner.serviceTypes || []).map((type, index) => (
                                                <Badge key={`${partner.id}-service-${type}-${index}`} variant="outline" className="text-xs">
                                                    {type}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{partner.lastUpdated}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditPartner(partner)}
                                                disabled={isActionLoading}
                                            >
                                                {isActionLoading ? (
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                <Edit className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Partner Details Modal */}
            <Dialog open={showPartnerDetailsModal} onOpenChange={setShowPartnerDetailsModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Edit Partner: " : "Partner Details: "}
                            {currentPartner?.name}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {currentPartner && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Partner Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <div>
                                                <span className="text-sm font-medium">Name:</span>
                                                <span className="ml-2">{currentPartner.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Status:</span>
                                                <span className={cn(
                                                    "ml-2 px-2 py-1 rounded-md text-xs",
                                                    getStatusStyle(currentPartner.apiStatus)
                                                )}>
                                                    {currentPartner.apiStatus}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Support Contact:</span>
                                                <span className="ml-2">{currentPartner.supportContact}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Support Email:</span>
                                                <span className="ml-2">{currentPartner.supportEmail}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Integration Date:</span>
                                                <span className="ml-2">{currentPartner.integrationDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">API Details</h3>
                                        <div className="mt-2 space-y-2">
                                            <div>
                                                <span className="text-sm font-medium">API Endpoint:</span>
                                                <span className="ml-2">{currentPartner.apiEndpoint}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">API Key:</span>
                                                <span className="ml-2">
                                                    {apiKeyRevealed ? apiKey : "••••••••••••"}
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="ml-2"
                                                        onClick={handleRevealApiKey}
                                                    >
                                                        {apiKeyRevealed ? "Hide" : "Reveal"}
                                                    </Button>
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Tracking URL:</span>
                                                <span className="ml-2">{currentPartner.trackingUrl}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Service Details</h3>
                                        <div className="mt-2 space-y-2">
                                            <div>
                                                <span className="text-sm font-medium">Service Types:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(currentPartner.serviceTypes || []).map((type, index) => (
                                                        <Badge key={`${currentPartner.id}-modal-service-${type}-${index}`} variant="outline" className="text-xs">
                                                            {type}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Service Areas:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(currentPartner.serviceAreas || []).map((area, index) => (
                                                        <Badge key={`${currentPartner.id}-modal-area-${area}-${index}`} variant="outline" className="text-xs">
                                                            {area}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Weight Limits:</span>
                                                <span className="ml-2">
                                                    {currentPartner.weightLimits.min} kg - {currentPartner.weightLimits.max} kg
                                                </span>
                                            </div>
                                            {currentPartner.dimensionLimits && (
                                                <div>
                                                    <span className="text-sm font-medium">Dimension Limits:</span>
                                                    <div className="ml-2">
                                                        <div>Max Length: {currentPartner.dimensionLimits.maxLength} cm</div>
                                                        <div>Max Width: {currentPartner.dimensionLimits.maxWidth} cm</div>
                                                        <div>Max Height: {currentPartner.dimensionLimits.maxHeight} cm</div>
                                                        <div>Max Sum (L+W+H): {currentPartner.dimensionLimits.maxSum} cm</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Rate Information</h3>
                                        <div className="mt-2 space-y-2">
                                            <div>
                                                <span className="text-sm font-medium">Base Rate:</span>
                                                <span className="ml-2">₹{currentPartner.rates.baseRate}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Weight Rate:</span>
                                                <span className="ml-2">₹{currentPartner.rates.weightRate}/kg</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Dimensional Factor:</span>
                                                <span className="ml-2">{currentPartner.rates.dimensionalFactor}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Performance Metrics</h3>
                                        <div className="mt-2 space-y-2">
                                            <div>
                                                <span className="text-sm font-medium">Shipment Count:</span>
                                                <span className="ml-2">{currentPartner.shipmentCount.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Performance Score:</span>
                                                <span className="ml-2">{currentPartner.performanceScore}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Delivery Success Rate:</span>
                                                <span className="ml-2">{currentPartner.deliverySuccess}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {currentPartner.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                                    <p className="mt-1">{currentPartner.notes}</p>
                                </div>
                            )}
                            
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowPartnerDetailsModal(false)}>
                                    {isEditing ? "Cancel" : "Close"}
                                </Button>
                                {isEditing && (
                                    <Button variant="primary" onClick={handleSavePartner} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                {isEditing ? "Updating..." : "Saving..."}
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Partner Modal */}
            <Dialog open={showAddPartnerModal} onOpenChange={setShowAddPartnerModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Shipping Partner</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                    <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Partner Name *</Label>
                                        <Input
                                            id="name"
                                            value={newPartner.name}
                                            onChange={(e) => {
                                                setNewPartner(prev => ({ ...prev, name: e.target.value }));
                                                if (formErrors.name) {
                                                    setFormErrors(prev => ({ ...prev, name: "" }));
                                                }
                                            }}
                                            placeholder="Enter partner name"
                                            className={formErrors.name ? "border-red-500" : ""}
                                        />
                                        {formErrors.name && (
                                            <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="supportEmail">Support Email *</Label>
                                        <Input
                                            id="supportEmail"
                                            type="email"
                                            value={newPartner.supportEmail}
                                            onChange={(e) => {
                                                setNewPartner(prev => ({ ...prev, supportEmail: e.target.value }));
                                                if (formErrors.supportEmail) {
                                                    setFormErrors(prev => ({ ...prev, supportEmail: "" }));
                                                }
                                            }}
                                            placeholder="Enter support email"
                                            className={formErrors.supportEmail ? "border-red-500" : ""}
                                        />
                                        {formErrors.supportEmail && (
                                            <p className="text-sm text-red-500 mt-1">{formErrors.supportEmail}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="supportContact">Support Contact</Label>
                                        <Input
                                            id="supportContact"
                                            value={newPartner.supportContact}
                                            onChange={(e) => setNewPartner(prev => ({ ...prev, supportContact: e.target.value }))}
                                            placeholder="Enter support contact"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="apiStatus">API Status</Label>
                                        <Select
                                            value={newPartner.apiStatus}
                                            onValueChange={(value: ApiStatus) => setNewPartner(prev => ({ ...prev, apiStatus: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* API Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500">API Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="apiEndpoint">API Endpoint</Label>
                                        <Input
                                            id="apiEndpoint"
                                            value={newPartner.apiEndpoint}
                                            onChange={(e) => setNewPartner(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                                            placeholder="Enter API endpoint"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="trackingUrl">Tracking URL</Label>
                                        <Input
                                            id="trackingUrl"
                                            value={newPartner.trackingUrl}
                                            onChange={(e) => setNewPartner(prev => ({ ...prev, trackingUrl: e.target.value }))}
                                            placeholder="Enter tracking URL"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Service Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500">Service Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="serviceTypes">Service Types</Label>
                                        <Input
                                            id="serviceTypes"
                                            value={newPartner.serviceTypes?.join(", ")}
                                            onChange={(e) => setNewPartner(prev => ({ 
                                                ...prev, 
                                                serviceTypes: e.target.value.split(",").map(type => type.trim() as ServiceType)
                                            }))}
                                            placeholder="Enter service types (comma-separated)"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="serviceAreas">Service Areas</Label>
                                        <Input
                                            id="serviceAreas"
                                            value={newPartner.serviceAreas?.join(", ")}
                                            onChange={(e) => setNewPartner(prev => ({ 
                                                ...prev, 
                                                serviceAreas: e.target.value.split(",").map(area => area.trim())
                                            }))}
                                            placeholder="Enter service areas (comma-separated)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Weight & Dimensions */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500">Weight & Dimensions</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="minWeight">Min Weight (kg)</Label>
                                            <Input
                                                id="minWeight"
                                                type="number"
                                                value={newPartner.weightLimits?.min}
                                                onChange={(e) => setNewPartner(prev => ({ 
                                                    ...prev, 
                                                    weightLimits: { ...prev.weightLimits!, min: Number(e.target.value) }
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                                            <Input
                                                id="maxWeight"
                                                type="number"
                                                value={newPartner.weightLimits?.max}
                                                onChange={(e) => setNewPartner(prev => ({ 
                                                    ...prev, 
                                                    weightLimits: { ...prev.weightLimits!, max: Number(e.target.value) }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="maxLength">Max Length (cm)</Label>
                                            <Input
                                                id="maxLength"
                                                type="number"
                                                value={newPartner.dimensionLimits?.maxLength}
                                                onChange={(e) => setNewPartner(prev => ({ 
                                                    ...prev, 
                                                    dimensionLimits: { ...prev.dimensionLimits!, maxLength: Number(e.target.value) }
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="maxWidth">Max Width (cm)</Label>
                                            <Input
                                                id="maxWidth"
                                                type="number"
                                                value={newPartner.dimensionLimits?.maxWidth}
                                                onChange={(e) => setNewPartner(prev => ({ 
                                                    ...prev, 
                                                    dimensionLimits: { ...prev.dimensionLimits!, maxWidth: Number(e.target.value) }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="maxHeight">Max Height (cm)</Label>
                                            <Input
                                                id="maxHeight"
                                                type="number"
                                                value={newPartner.dimensionLimits?.maxHeight}
                                                onChange={(e) => setNewPartner(prev => ({ 
                                                    ...prev, 
                                                    dimensionLimits: { ...prev.dimensionLimits!, maxHeight: Number(e.target.value) }
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="maxSum">Max Sum (L+W+H)</Label>
                                            <Input
                                                id="maxSum"
                                                type="number"
                                                value={newPartner.dimensionLimits?.maxSum}
                                                onChange={(e) => setNewPartner(prev => ({ 
                                                    ...prev, 
                                                    dimensionLimits: { ...prev.dimensionLimits!, maxSum: Number(e.target.value) }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rate Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500">Rate Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="baseRate">Base Rate (₹)</Label>
                                        <Input
                                            id="baseRate"
                                            type="number"
                                            value={newPartner.rates?.baseRate}
                                            onChange={(e) => setNewPartner(prev => ({ 
                                                ...prev, 
                                                rates: { ...prev.rates!, baseRate: Number(e.target.value) }
                                            }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="weightRate">Weight Rate (₹/kg)</Label>
                                        <Input
                                            id="weightRate"
                                            type="number"
                                            value={newPartner.rates?.weightRate}
                                            onChange={(e) => setNewPartner(prev => ({ 
                                                ...prev, 
                                                rates: { ...prev.rates!, weightRate: Number(e.target.value) }
                                            }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="dimensionalFactor">Dimensional Factor</Label>
                                        <Input
                                            id="dimensionalFactor"
                                            type="number"
                                            value={newPartner.rates?.dimensionalFactor}
                                            onChange={(e) => setNewPartner(prev => ({ 
                                                ...prev, 
                                                rates: { ...prev.rates!, dimensionalFactor: Number(e.target.value) }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowAddPartnerModal(false);
                                resetForm();
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleSavePartner} 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                isEditing ? "Update Partner" : "Add Partner"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPartnersPage; 