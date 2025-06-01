import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, TruckIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { fetchTrackingInfo, TrackingEvent, TrackingInfo } from "@/lib/api/tracking"

interface TrackOrderFormProps {
    onTrackingResult?: (data: TrackingInfo) => void;
    onTrackingError?: (error: string) => void;
    initialAwb?: string;
    showTitle?: boolean;
    className?: string;
    resetTrigger?: number;
}

const TrackOrderForm = ({ 
    onTrackingResult,
    onTrackingError,
    initialAwb = "",
    showTitle = true,
    className = "",
    resetTrigger = 0
}: TrackOrderFormProps) => {
    const [awbNumber, setAwbNumber] = useState<string>(initialAwb)
    const [error, setError] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const validateAwbNumber = (value: string) => {
        // Remove any spaces and convert to uppercase
        const cleanValue = value.replace(/\s/g, '').toUpperCase();
        setAwbNumber(cleanValue);

        // Validate both formats: 10 digits OR RB + 9 digits
        const isValidFormat = /^\d{10}$/.test(cleanValue) || /^RB\d{9}$/.test(cleanValue);
        
        if (cleanValue.length > 0 && !isValidFormat) {
            setError("AWB number must be 10 digits or RB followed by 9 digits");
        } else {
            setError("");
        }
    };

    const handleSubmit = async () => {
        // Validate format before submission
        const isValidFormat = /^\d{10}$/.test(awbNumber) || /^RB\d{9}$/.test(awbNumber);
        
        if (!isValidFormat) {
            const errorMsg = "AWB number must be 10 digits or RB followed by 9 digits";
            setError(errorMsg);
            if (onTrackingError) {
                onTrackingError(errorMsg);
            }
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const data = await fetchTrackingInfo(awbNumber);
            if (onTrackingResult) {
                onTrackingResult(data);
            }
            toast.success("Tracking information retrieved successfully");
        } catch (err) {
            console.error("Error tracking shipment:", err);
            const errorMsg = "Failed to retrieve tracking information. Please try again.";
            setError(errorMsg);
            if (onTrackingError) {
                onTrackingError(errorMsg);
            }
            toast.error("Failed to retrieve tracking information");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-track when initialAwb is provided
    useEffect(() => {
        if (initialAwb && resetTrigger === 0) {
            const isValidFormat = /^\d{10}$/.test(initialAwb) || /^RB\d{9}$/.test(initialAwb);
            if (isValidFormat) {
                handleSubmit();
            }
        }
    }, [initialAwb, resetTrigger])

    // Update internal state when initialAwb prop changes
    useEffect(() => {
        setAwbNumber(initialAwb);
    }, [initialAwb])

    // Reset form completely when resetTrigger changes
    useEffect(() => {
        if (resetTrigger > 0) {
            setAwbNumber("");
            setError("");
            setIsLoading(false);
        }
    }, [resetTrigger])

    return (
        <div className={`flex flex-col items-start gap-4 lg:gap-6 p-4 lg:p-8 rounded-lg bg-white shadow-lg shadow-neutral-400/20 w-full ${className}`}>
            {showTitle && (
                <div className="flex items-center space-x-2">
                    <TruckIcon className="text-blue-500" />
                    <h5 className="text-xl font-medium">
                        Track Your Order
                    </h5>
                </div>
            )}
            <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="awb">
                    AWB Number
                </Label>
                <Input
                    id="awb"
                    type="text"
                    maxLength={11}
                    value={awbNumber}
                    onChange={(e) => validateAwbNumber(e.target.value)}
                    placeholder="Enter AWB number (e.g., RB519632602)"
                    className={`border-0 w-full bg-neutral-100 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={isLoading}
                />
                {error && (
                    <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
            <Button
                variant="primary"
                className="w-full"
                onClick={handleSubmit}
                disabled={!!error || !(/^\d{10}$/.test(awbNumber) || /^RB\d{9}$/.test(awbNumber)) || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Tracking...
                    </>
                ) : (
                    <>
                        <TruckIcon className="mr-2 h-4 w-4" />
                        Track Now
                    </>
                )}
            </Button>
        </div>
    )
}

export type { TrackingEvent, TrackingInfo }
export default TrackOrderForm 