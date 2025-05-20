import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

type StoreSettings = {
    storeType: string;
    storeUrl: string;
    apiKey: string;
    apiSecret: string;
    autoFetch: boolean;
    autoCreate: boolean;
    autoNotify: boolean;
    defaultShippingMode: "standard" | "express" | "cod";
};

const STORE_TYPES = [
    { value: "amazon", label: "Amazon" },
    { value: "shopify", label: "Shopify" },
    { value: "flipkart", label: "Flipkart" },
    { value: "meesho", label: "Meesho" },
    { value: "myntra", label: "Myntra" },
    { value: "ajio", label: "AJIO" },
    { value: "nykaa", label: "Nykaa" },
    { value: "custom", label: "Custom Store" },
];

const ManageStorePage = () => {
    const { profile, updateProfile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [storeSettings, setStoreSettings] = useState<StoreSettings>({
        storeType: "",
        storeUrl: "",
        apiKey: "",
        apiSecret: "",
        autoFetch: false,
        autoCreate: false,
        autoNotify: false,
        defaultShippingMode: "standard"
    });

    useEffect(() => {
        if (profile) {
            // Initialize store settings from profile
            setStoreSettings(prev => ({
                ...prev,
                storeType: profile.storeLinks?.amazon ? "amazon" : 
                          profile.storeLinks?.shopify ? "shopify" : 
                          profile.storeLinks?.opencart ? "opencart" : "custom",
                storeUrl: profile.storeLinks?.website || "",
            }));
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            setLoading(true);
            
            // Update store links based on store type
            const storeLinks = {
                ...profile?.storeLinks,
                website: storeSettings.storeUrl,
                [storeSettings.storeType]: storeSettings.storeUrl
            };

            // Update profile with new store settings
            await updateProfile({
                storeLinks,
                settings: {
                    autoFetch: storeSettings.autoFetch,
                    autoCreate: storeSettings.autoCreate,
                    autoNotify: storeSettings.autoNotify,
                    defaultShippingMode: storeSettings.defaultShippingMode
                }
            });

            toast.success("Store settings saved successfully");
        } catch (error) {
            toast.error("Failed to save store settings");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Manage Store
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Configure your store settings and integrate with ecommerce platforms
                </p>
            </div>

            <div className="grid gap-6">
                {/* Store Integration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Store Integration</CardTitle>
                        <CardDescription>
                            Connect your ecommerce store to automatically fetch orders
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Store Type</Label>
                                    <Select 
                                        value={storeSettings.storeType}
                                        onValueChange={(value) => setStoreSettings(prev => ({ ...prev, storeType: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select store type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STORE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Store URL</Label>
                                    <Input 
                                        placeholder="Enter your store URL"
                                        value={storeSettings.storeUrl}
                                        onChange={(e) => setStoreSettings(prev => ({ ...prev, storeUrl: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input 
                                        type="password" 
                                        placeholder="Enter your API key"
                                        value={storeSettings.apiKey}
                                        onChange={(e) => setStoreSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Secret</Label>
                                    <Input 
                                        type="password" 
                                        placeholder="Enter your API secret"
                                        value={storeSettings.apiSecret}
                                        onChange={(e) => setStoreSettings(prev => ({ ...prev, apiSecret: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="auto-fetch"
                                    checked={storeSettings.autoFetch}
                                    onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, autoFetch: checked }))}
                                />
                                <Label htmlFor="auto-fetch">
                                    Automatically fetch orders
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Settings</CardTitle>
                        <CardDescription>
                            Configure how orders are processed and managed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="auto-create"
                                    checked={storeSettings.autoCreate}
                                    onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, autoCreate: checked }))}
                                />
                                <Label htmlFor="auto-create">
                                    Automatically create shipping orders
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="auto-notify"
                                    checked={storeSettings.autoNotify}
                                    onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, autoNotify: checked }))}
                                />
                                <Label htmlFor="auto-notify">
                                    Send automatic notifications to customers
                                </Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Shipping Mode</Label>
                                <Select 
                                    value={storeSettings.defaultShippingMode}
                                    onValueChange={(value: "standard" | "express" | "cod") => setStoreSettings(prev => ({ ...prev, defaultShippingMode: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select shipping mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard Delivery</SelectItem>
                                        <SelectItem value="express">Express Delivery</SelectItem>
                                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button 
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManageStorePage; 