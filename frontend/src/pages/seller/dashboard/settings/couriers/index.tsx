import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProfile } from "@/hooks/useProfile";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CourierConfig = {
  accountId: string;
  apiKey: string;
  apiSecret: string;
  pickupLocation: string;
  serviceablePincodes: string[];
  maxWeight: number;
  maxValue: number;
};

type Courier = {
  id: number;
  name: string;
  code: string;
  status: boolean;
  priority: number;
  config?: CourierConfig;
};

type ShippingPreferences = {
  defaultMode: "surface" | "air";
  autoSelect: boolean;
  codAvailable: boolean;
};

type CourierSetting = {
  courierId: number;
  enabled: boolean;
  priority: number;
  config?: CourierConfig;
};

const COURIERS: Courier[] = [
  { id: 1, name: "Delhivery", code: "DEL", status: true, priority: 1 },
  { id: 2, name: "Blue Dart", code: "BLD", status: true, priority: 2 },
  { id: 3, name: "FedEx", code: "FED", status: true, priority: 3 },
  { id: 4, name: "DTDC", code: "DTD", status: false, priority: 4 },
  { id: 5, name: "XpressBees", code: "XBE", status: true, priority: 5 },
  { id: 6, name: "Ekart", code: "EKT", status: false, priority: 6 },
  { id: 7, name: "Shadowfax", code: "SFX", status: true, priority: 7 },
  { id: 8, name: "Gati", code: "GAT", status: false, priority: 8 },
];

const SHIPPING_MODES = [
  { value: "surface", label: "Surface Delivery" },
  { value: "air", label: "Air Delivery" },
];

const CouriersSettingsPage = () => {
  const { profile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [couriers, setCouriers] = useState<Courier[]>(COURIERS);
  const [preferences, setPreferences] = useState<ShippingPreferences>({
    defaultMode: "surface",
    autoSelect: false,
    codAvailable: false
  });
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [courierConfig, setCourierConfig] = useState<CourierConfig>({
    accountId: '',
    apiKey: '',
    apiSecret: '',
    pickupLocation: '',
    serviceablePincodes: [],
    maxWeight: 0,
    maxValue: 0
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (profile?.settings) {
          // Load shipping preferences
          setPreferences({
            defaultMode: profile.settings.defaultShippingMode || "surface",
            autoSelect: profile.settings.autoSelectCourier || false,
            codAvailable: profile.settings.codAvailable || false
          });

          // Load courier settings if available
          if (profile.settings.courierSettings) {
            const updatedCouriers = couriers.map(courier => {
              const courierSetting = (profile.settings?.courierSettings as CourierSetting[] | undefined)?.find(
                setting => setting.courierId === courier.id
              );
              return {
                ...courier,
                status: courierSetting?.enabled ?? courier.status,
                priority: courierSetting?.priority ?? courier.priority,
                config: courierSetting?.config
              };
            });
            setCouriers(updatedCouriers);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load courier settings');
      }
    };

    loadSettings();
  }, [profile]);

  const handleCourierStatusChange = (courierId: number, status: boolean) => {
    setCouriers(prev => prev.map(courier =>
      courier.id === courierId ? { ...courier, status } : courier
    ));
  };

  const handleCourierPriorityChange = (courierId: number, priority: number) => {
    setCouriers(prev => prev.map(courier =>
      courier.id === courierId ? { ...courier, priority } : courier
    ));
  };

  const handleConfigureClick = (courier: Courier) => {
    setConfigLoading(true);
    try {
      setSelectedCourier(courier);
      setCourierConfig({
        accountId: courier.config?.accountId || '',
        apiKey: courier.config?.apiKey || '',
        apiSecret: courier.config?.apiSecret || '',
        pickupLocation: courier.config?.pickupLocation || '',
        serviceablePincodes: courier.config?.serviceablePincodes || [],
        maxWeight: courier.config?.maxWeight || 0,
        maxValue: courier.config?.maxValue || 0
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedCourier) return;

    try {
      setTestingConnection(true);
      // TODO: Implement actual API test call
      // For now, simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Connection test successful!");
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error("Connection test failed. Please check your credentials.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConfigSave = async () => {
    if (!selectedCourier) return;

    try {
      setLoading(true);

      // Validate required fields
      if (!courierConfig.accountId || !courierConfig.apiKey || !courierConfig.apiSecret) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Update courier config
      const updatedCouriers = couriers.map(courier =>
        courier.id === selectedCourier.id
          ? { ...courier, config: courierConfig }
          : courier
      );
      setCouriers(updatedCouriers);

      // Update profile with new courier settings
      await updateProfile({
        settings: {
          ...profile?.settings,
          courierSettings: updatedCouriers.map(({ id, status, priority, config }) => ({
            courierId: id,
            enabled: status,
            priority,
            config
          }))
        }
      });

      toast.success("Courier configuration saved successfully");
      setSelectedCourier(null);
    } catch (error) {
      console.error('Failed to save courier configuration:', error);
      toast.error("Failed to save courier configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update profile with new settings
      await updateProfile({
        settings: {
          ...profile?.settings,
          defaultShippingMode: preferences.defaultMode,
          autoSelectCourier: preferences.autoSelect,
          codAvailable: preferences.codAvailable,
          courierSettings: couriers.map(({ id, status, priority }) => ({
            courierId: id,
            enabled: status,
            priority
          }))
        }
      });

      toast.success("Courier settings saved successfully");
    } catch (error) {
      toast.error("Failed to save courier settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold">
          Couriers Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your courier partners and shipping preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Courier Partners */}
        <Card>
          <CardHeader>
            <CardTitle>Courier Partners</CardTitle>
            <CardDescription>
              Enable or disable courier partners and set their priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Courier Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couriers.map((courier) => (
                  <TableRow key={courier.id}>
                    <TableCell>{courier.name}</TableCell>
                    <TableCell>{courier.code}</TableCell>
                    <TableCell>
                      <Switch
                        checked={courier.status}
                        onCheckedChange={(checked) => handleCourierStatusChange(courier.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={courier.priority}
                        className="w-20"
                        onChange={(e) => handleCourierPriorityChange(courier.id, parseInt(e.target.value))}
                        min={1}
                        max={couriers.length}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureClick(courier)}
                        disabled={configLoading}
                      >
                        {configLoading ? "Loading..." : "Configure"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Shipping Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Preferences</CardTitle>
            <CardDescription>
              Configure your default shipping preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Shipping Mode</Label>
                <Select
                  value={preferences.defaultMode}
                  onValueChange={(value: "surface" | "air") =>
                    setPreferences(prev => ({ ...prev, defaultMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-select"
                  checked={preferences.autoSelect}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, autoSelect: checked }))
                  }
                />
                <Label htmlFor="auto-select">
                  Automatically select best courier based on rate and delivery time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="cod-available"
                  checked={preferences.codAvailable}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, codAvailable: checked }))
                  }
                />
                <Label htmlFor="cod-available">
                  Enable Cash on Delivery for all orders
                </Label>
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

      {/* Courier Configuration Dialog */}
      <Dialog open={!!selectedCourier} onOpenChange={() => setSelectedCourier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedCourier?.name}</DialogTitle>
            <DialogDescription>
              Set up your {selectedCourier?.name} integration settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Account ID <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter your account ID"
                  value={courierConfig.accountId}
                  onChange={(e) => setCourierConfig(prev => ({ ...prev, accountId: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>API Key <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={courierConfig.apiKey}
                  onChange={(e) => setCourierConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>API Secret <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  placeholder="Enter your API secret"
                  value={courierConfig.apiSecret}
                  onChange={(e) => setCourierConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Input
                  placeholder="Enter pickup location"
                  value={courierConfig.pickupLocation}
                  onChange={(e) => setCourierConfig(prev => ({ ...prev, pickupLocation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Serviceable Pincodes</Label>
                <Input
                  placeholder="Enter comma-separated pincodes"
                  value={courierConfig.serviceablePincodes?.join(', ')}
                  onChange={(e) => setCourierConfig(prev => ({
                    ...prev,
                    serviceablePincodes: e.target.value.split(',').map(p => p.trim())
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="Enter max weight"
                    value={courierConfig.maxWeight}
                    onChange={(e) => setCourierConfig(prev => ({
                      ...prev,
                      maxWeight: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Value (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter max value"
                    value={courierConfig.maxValue}
                    onChange={(e) => setCourierConfig(prev => ({
                      ...prev,
                      maxValue: parseFloat(e.target.value)
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection || !courierConfig.accountId || !courierConfig.apiKey || !courierConfig.apiSecret}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedCourier(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfigSave}
                disabled={loading || !courierConfig.accountId || !courierConfig.apiKey || !courierConfig.apiSecret}
              >
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouriersSettingsPage;
