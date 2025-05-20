import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { ApiService, ApiResponse } from "@/services/api.service";

const API_ENDPOINTS = [
    {
        name: "Create Order",
        endpoint: "/api/v1/orders",
        method: "POST",
        description: "Create a new shipping order",
    },
    {
        name: "Get Order Status",
        endpoint: "/api/v1/orders/{order_id}",
        method: "GET",
        description: "Get the current status of an order",
    },
    {
        name: "Track Shipment",
        endpoint: "/api/v1/shipments/{shipment_id}/track",
        method: "GET",
        description: "Track a shipment's location and status",
    },
    {
        name: "Generate Label",
        endpoint: "/api/v1/shipments/{shipment_id}/label",
        method: "GET",
        description: "Generate shipping label for a shipment",
    },
    {
        name: "Cancel Order",
        endpoint: "/api/v1/orders/{order_id}/cancel",
        method: "POST",
        description: "Cancel an existing order",
    },
];

type ApiSettings = {
    apiKey: string;
    apiSecret: string;
    enabled: boolean;
    webhookEnabled: boolean;
    webhookUrl: string;
};

interface GenerateKeyResponse {
    apiKey: string;
    apiSecret: string;
}

const ApiSettingsPage = () => {
    const { profile, updateProfile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [apiSettings, setApiSettings] = useState<ApiSettings>({
        apiKey: '',
        apiSecret: '',
        enabled: false,
        webhookEnabled: false,
        webhookUrl: ''
    });

    useEffect(() => {
        if (profile?.settings?.apiSettings) {
            setApiSettings(profile.settings.apiSettings);
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateProfile({
                settings: {
                    ...profile?.settings,
                    apiSettings: apiSettings
                }
            });
            toast.success("API settings saved successfully");
        } catch (error) {
            console.error('Error saving API settings:', error);
            toast.error("Failed to save API settings");
        } finally {
            setLoading(false);
        }
    };

    const generateApiKey = async () => {
        try {
            setLoading(true);
            const apiService = new ApiService();
            const response = await apiService.post<ApiResponse<GenerateKeyResponse>>('/seller/api/generate-key');
            if (response.data) {
                setApiSettings(prev => ({
                    ...prev,
                    apiKey: response.data.data.apiKey,
                    apiSecret: response.data.data.apiSecret
                }));
                toast.success("New API credentials generated");
            }
        } catch (error) {
            console.error('Error generating API credentials:', error);
            toast.error("Failed to generate API credentials");
        } finally {
            setLoading(false);
        }
    };

    const testWebhook = async () => {
        if (!apiSettings.webhookUrl) {
            toast.error("Please enter a webhook URL first");
            return;
        }

        try {
            setTestingWebhook(true);
            const apiService = new ApiService();
            await apiService.post<ApiResponse<void>>('/seller/api/test-webhook', {
                url: apiSettings.webhookUrl
            });
            toast.success("Webhook test successful");
        } catch (error) {
            console.error('Error testing webhook:', error);
            toast.error("Webhook test failed");
        } finally {
            setTestingWebhook(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl lg:text-2xl font-semibold">
                    API Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Configure your API integration settings
                </p>
            </div>

            <div className="grid gap-6">
                {/* API Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>API Configuration</CardTitle>
                        <CardDescription>
                            Set up your API credentials and preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="password"
                                        placeholder="Enter your API key"
                                        value={apiSettings.apiKey}
                                        onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                    />
                                    <Button 
                                        variant="outline" 
                                        onClick={generateApiKey}
                                        disabled={loading}
                                    >
                                        Generate
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Keep your API key secure and never share it publicly
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>API Secret</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter your API secret"
                                    value={apiSettings.apiSecret}
                                    onChange={(e) => setApiSettings(prev => ({ ...prev, apiSecret: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="enable-api"
                                    checked={apiSettings.enabled}
                                    onCheckedChange={(checked) => setApiSettings(prev => ({ ...prev, enabled: checked }))}
                                />
                                <Label htmlFor="enable-api">
                                    Enable API access
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="webhook"
                                    checked={apiSettings.webhookEnabled}
                                    onCheckedChange={(checked) => setApiSettings(prev => ({ ...prev, webhookEnabled: checked }))}
                                />
                                <Label htmlFor="webhook">
                                    Enable webhook notifications
                                </Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Enter your webhook URL"
                                        value={apiSettings.webhookUrl}
                                        onChange={(e) => setApiSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                        disabled={!apiSettings.webhookEnabled}
                                    />
                                    <Button 
                                        variant="outline" 
                                        onClick={testWebhook}
                                        disabled={!apiSettings.webhookEnabled || testingWebhook}
                                    >
                                        {testingWebhook ? "Testing..." : "Test"}
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Configure your webhook URL to receive real-time updates
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* API Documentation */}
                <Card>
                    <CardHeader>
                        <CardTitle>API Documentation</CardTitle>
                        <CardDescription>
                            Available API endpoints and their usage
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {API_ENDPOINTS.map((endpoint) => (
                                <div key={endpoint.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">{endpoint.name}</h3>
                                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                            {endpoint.method}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <code className="text-sm">{endpoint.endpoint}</code>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {endpoint.description}
                                    </p>
                                </div>
                            ))}
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

export default ApiSettingsPage; 