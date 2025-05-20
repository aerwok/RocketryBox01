import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ServiceAvailability {
    pincode: string;
    city: string;
    state: string;
    isAvailable: boolean;
    services: {
        standard: boolean;
        express: boolean;
        cod: boolean;
    };
    deliveryTime: {
        standard: string;
        express: string;
    };
    restrictions?: string[];
}

const SellerServiceCheckPage = () => {
    const [pincode, setPincode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [serviceData, setServiceData] = useState<ServiceAvailability | null>(null);

    const handleCheckService = async () => {
        if (!pincode || pincode.length !== 6) {
            toast.error("Please enter a valid 6-digit pincode");
            return;
        }

        setIsLoading(true);
        try {
            // Real API call
            const response = await fetch(`/api/v2/service-check?pincode=${pincode}`);
            if (!response.ok) throw new Error("Failed to fetch service data");
            const data = await response.json();
            setServiceData(data);
        } catch (error) {
            toast.error("Failed to check service availability");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Service Check
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="size-4" />
                    <span>Check service availability by pincode</span>
                </div>
            </div>

            {/* Service Check Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Check Service Availability</CardTitle>
                    <CardDescription>
                        Enter a pincode to check if our services are available in that area
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter 6-digit pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                maxLength={6}
                                pattern="[0-9]*"
                            />
                        </div>
                        <Button
                            onClick={handleCheckService}
                            disabled={isLoading || !pincode}
                            className="w-full lg:w-auto"
                        >
                            {isLoading ? "Checking..." : "Check Availability"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {serviceData && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {serviceData.isAvailable ? (
                                    <>
                                        <CheckCircle2 className="size-5 text-green-500" />
                                        Service Available
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="size-5 text-red-500" />
                                        Service Not Available
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {serviceData.city}, {serviceData.state} - {serviceData.pincode}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Standard Delivery
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            {serviceData.services.standard ? (
                                                <CheckCircle2 className="size-4 text-green-500" />
                                            ) : (
                                                <XCircle className="size-4 text-red-500" />
                                            )}
                                            <span>
                                                {serviceData.services.standard
                                                    ? "Available"
                                                    : "Not Available"}
                                            </span>
                                        </div>
                                        {serviceData.services.standard && (
                                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                                <Clock className="size-4" />
                                                <span>{serviceData.deliveryTime.standard}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Express Delivery
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            {serviceData.services.express ? (
                                                <CheckCircle2 className="size-4 text-green-500" />
                                            ) : (
                                                <XCircle className="size-4 text-red-500" />
                                            )}
                                            <span>
                                                {serviceData.services.express
                                                    ? "Available"
                                                    : "Not Available"}
                                            </span>
                                        </div>
                                        {serviceData.services.express && (
                                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                                <Clock className="size-4" />
                                                <span>{serviceData.deliveryTime.express}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium">
                                            Cash on Delivery
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            {serviceData.services.cod ? (
                                                <CheckCircle2 className="size-4 text-green-500" />
                                            ) : (
                                                <XCircle className="size-4 text-red-500" />
                                            )}
                                            <span>
                                                {serviceData.services.cod
                                                    ? "Available"
                                                    : "Not Available"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {serviceData.restrictions && serviceData.restrictions.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <AlertTriangle className="size-4 text-yellow-500" />
                                        Important Notes
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                                        {serviceData.restrictions.map((restriction, index) => (
                                            <li key={index}>{restriction}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SellerServiceCheckPage; 