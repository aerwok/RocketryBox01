import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface LabelSettings {
    size: string;
    format: string;
    logo?: string;
    showLogo: boolean;
    showBarcode: boolean;
    showReturn: boolean;
    additionalText: string;
}

const LABEL_SIZES = [
    { value: "4x6", label: "4 x 6 inches" },
    { value: "6x4", label: "6 x 4 inches" },
    { value: "8x4", label: "8 x 4 inches" },
    { value: "10x4", label: "10 x 4 inches" },
];

const LABEL_FORMATS = [
    { value: "pdf", label: "PDF" },
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPG" },
];

const LabelSettingsPage = () => {
    const { profile, updateProfile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [settings, setSettings] = useState<LabelSettings>({
        size: "4x6",
        format: "pdf",
        showLogo: true,
        showBarcode: true,
        showReturn: true,
        additionalText: ""
    });

    useEffect(() => {
        if (profile?.settings?.labelSettings) {
            setSettings(profile.settings.labelSettings);
        }
    }, [profile]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error('File size should be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            
            // Create form data
            const formData = new FormData();
            formData.append('logo', file);

            // Upload to server
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/seller/settings/label/logo`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload logo');
            }

            const data = await response.json();
            
            // Update settings with new logo URL
            setSettings(prev => ({
                ...prev,
                logo: data.url
            }));

            toast.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Update profile with new label settings
            await updateProfile({
                settings: {
                    ...profile?.settings,
                    labelSettings: settings
                }
            });

            toast.success('Label settings saved successfully');
        } catch (error) {
            console.error('Error saving label settings:', error);
            toast.error('Failed to save label settings');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        // Generate preview URL with current settings
        const previewUrl = `${import.meta.env.VITE_API_URL}/api/v2/seller/settings/label/preview?` + 
            new URLSearchParams({
                size: settings.size,
                format: settings.format,
                showLogo: settings.showLogo.toString(),
                showBarcode: settings.showBarcode.toString(),
                showReturn: settings.showReturn.toString(),
                additionalText: settings.additionalText
            }).toString();

        // Open preview in new tab
        window.open(previewUrl, '_blank');
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Label Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Customize your shipping labels and branding
                </p>
            </div>

            <div className="grid gap-6">
                {/* Label Design */}
                <Card>
                    <CardHeader>
                        <CardTitle>Label Design</CardTitle>
                        <CardDescription>
                            Configure your shipping label appearance and format
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Label Size</Label>
                                <Select 
                                    value={settings.size}
                                    onValueChange={(value) => setSettings(prev => ({ ...prev, size: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select label size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LABEL_SIZES.map((size) => (
                                            <SelectItem key={size.value} value={size.value}>
                                                {size.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Label Format</Label>
                                <Select 
                                    value={settings.format}
                                    onValueChange={(value) => setSettings(prev => ({ ...prev, format: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select label format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LABEL_FORMATS.map((format) => (
                                            <SelectItem key={format.value} value={format.value}>
                                                {format.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Company Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                                        {settings.logo ? (
                                            <img 
                                                src={settings.logo} 
                                                alt="Company Logo" 
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-500">Upload logo</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={uploading}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Max file size: 5MB. Supported formats: PNG, JPG
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Label Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Label Content</CardTitle>
                        <CardDescription>
                            Customize the information displayed on your shipping labels
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="show-logo"
                                    checked={settings.showLogo}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLogo: checked }))}
                                />
                                <Label htmlFor="show-logo">
                                    Show company logo on label
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="show-barcode"
                                    checked={settings.showBarcode}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showBarcode: checked }))}
                                />
                                <Label htmlFor="show-barcode">
                                    Show tracking barcode
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="show-return"
                                    checked={settings.showReturn}
                                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showReturn: checked }))}
                                />
                                <Label htmlFor="show-return">
                                    Include return address
                                </Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Additional Information</Label>
                                <Input 
                                    placeholder="Enter additional text to display on label"
                                    value={settings.additionalText}
                                    onChange={(e) => setSettings(prev => ({ ...prev, additionalText: e.target.value }))}
                                    className="h-20"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button 
                        variant="outline"
                        onClick={handlePreview}
                        disabled={loading}
                    >
                        Preview Label
                    </Button>
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

export default LabelSettingsPage; 