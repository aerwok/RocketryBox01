import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

const NOTIFICATION_TYPES = [
    {
        id: "orderConfirmation",
        title: "Order Confirmation",
        description: "Send a confirmation message when an order is placed",
    },
    {
        id: "orderPacked",
        title: "Order Packed",
        description: "Notify when the order is packed and ready for pickup",
    },
    {
        id: "outForDelivery",
        title: "Out for Delivery",
        description: "Send notification when the order is out for delivery",
    },
    {
        id: "deliveryConfirmation",
        title: "Delivery Confirmation",
        description: "Confirm when the order is delivered successfully",
    },
    {
        id: "deliveryFailed",
        title: "Delivery Failed",
        description: "Notify when delivery attempt fails",
    },
    {
        id: "returnInitiated",
        title: "Return Initiated",
        description: "Send notification when a return is initiated",
    },
    {
        id: "returnPicked",
        title: "Return Picked",
        description: "Confirm when the return is picked up",
    },
    {
        id: "returnDelivered",
        title: "Return Delivered",
        description: "Notify when the return is delivered back to you",
    },
];

type WhatsAppSettings = {
    enabled: boolean;
    businessNumber?: string;
    apiKey?: string;
    notifications: {
        orderConfirmation: boolean;
        orderPacked: boolean;
        outForDelivery: boolean;
        deliveryConfirmation: boolean;
        deliveryFailed: boolean;
        returnInitiated: boolean;
        returnPicked: boolean;
        returnDelivered: boolean;
    };
    templates?: {
        orderConfirmation?: string;
        deliveryConfirmation?: string;
    };
};

const WhatsAppSettingsPage = () => {
    const { profile, updateProfile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<WhatsAppSettings>({
        enabled: false,
        businessNumber: "",
        apiKey: "",
        notifications: {
            orderConfirmation: true,
            orderPacked: true,
            outForDelivery: true,
            deliveryConfirmation: true,
            deliveryFailed: true,
            returnInitiated: true,
            returnPicked: true,
            returnDelivered: true,
        },
        templates: {
            orderConfirmation: "",
            deliveryConfirmation: "",
        }
    });

    useEffect(() => {
        if (profile?.settings?.whatsappSettings) {
            setSettings(profile.settings.whatsappSettings);
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            setLoading(true);
            
            // Update profile with new WhatsApp settings
            await updateProfile({
                settings: {
                    ...profile?.settings,
                    whatsappSettings: settings
                }
            });

            toast.success("WhatsApp settings saved successfully");
        } catch (error) {
            console.error('Error saving WhatsApp settings:', error);
            toast.error("Failed to save WhatsApp settings");
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = (id: string) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [id]: !prev.notifications[id as keyof typeof prev.notifications]
            }
        }));
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl lg:text-2xl font-semibold">
                    WhatsApp Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Configure WhatsApp notifications for order updates
                </p>
            </div>

            <div className="grid gap-6">
                {/* WhatsApp Integration */}
                <Card>
                    <CardHeader>
                        <CardTitle>WhatsApp Integration</CardTitle>
                        <CardDescription>
                            Set up your WhatsApp Business API integration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>WhatsApp Business Number</Label>
                                <Input 
                                    placeholder="Enter your WhatsApp business number"
                                    type="tel"
                                    value={settings.businessNumber || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, businessNumber: e.target.value }))}
                                />
                                <p className="text-sm text-gray-500">
                                    Include country code (e.g., +91 9876543210)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter your WhatsApp Business API key"
                                    value={settings.apiKey || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="enable-whatsapp"
                                    checked={settings.enabled}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                                />
                                <Label htmlFor="enable-whatsapp">
                                    Enable WhatsApp notifications
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>
                            Choose which notifications to send via WhatsApp
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {NOTIFICATION_TYPES.map((notification) => (
                                <div key={notification.id} className="flex items-start space-x-4">
                                    <div className="pt-1">
                                        <Switch 
                                            id={notification.id}
                                            checked={settings.notifications[notification.id as keyof typeof settings.notifications]}
                                            onCheckedChange={() => handleNotificationToggle(notification.id)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={notification.id} className="text-base">
                                            {notification.title}
                                        </Label>
                                        <p className="text-sm text-gray-500">
                                            {notification.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Message Templates */}
                <Card>
                    <CardHeader>
                        <CardTitle>Message Templates</CardTitle>
                        <CardDescription>
                            Customize your WhatsApp message templates
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Order Confirmation Template</Label>
                                <Input 
                                    placeholder="Enter your order confirmation message template"
                                    className="h-20"
                                    value={settings.templates?.orderConfirmation || ""}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        templates: {
                                            ...prev.templates,
                                            orderConfirmation: e.target.value
                                        }
                                    }))}
                                />
                                <p className="text-sm text-gray-500">
                                    Available variables: {"{order_number}"}, {"{customer_name}"}, {"{order_date}"}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Delivery Confirmation Template</Label>
                                <Input 
                                    placeholder="Enter your delivery confirmation message template"
                                    className="h-20"
                                    value={settings.templates?.deliveryConfirmation || ""}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        templates: {
                                            ...prev.templates,
                                            deliveryConfirmation: e.target.value
                                        }
                                    }))}
                                />
                                <p className="text-sm text-gray-500">
                                    Available variables: {"{order_number}"}, {"{customer_name}"}, {"{delivery_date}"}
                                </p>
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

export default WhatsAppSettingsPage; 