import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, TruckIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { fetchTrackingInfo, TrackingEvent, TrackingInfo } from "@/lib/api/tracking"

interface TrackOrderFormProps {
    onTrackingResult?: (data: TrackingInfo) => void;
    showTitle?: boolean;
    className?: string;
}

const TrackOrderForm = ({ 
    onTrackingResult,
    showTitle = true,
    className = ""
}: TrackOrderFormProps) => {
    const [awbNumber, setAwbNumber] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const validateAwbNumber = (value: string) => {
        const digitsOnly = value.replace(/\D/g, "")
        setAwbNumber(digitsOnly)

        if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
            setError("AWB number must be exactly 10 digits")
        } else {
            setError("")
        }
    };

    const handleSubmit = async () => {
        if (awbNumber.length !== 10) {
            setError("AWB number must be exactly 10 digits")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const data = await fetchTrackingInfo(awbNumber)
            if (onTrackingResult) {
                onTrackingResult(data)
            }
            toast.success("Tracking information retrieved successfully")
        } catch (err) {
            console.error("Error tracking shipment:", err)
            setError("Failed to retrieve tracking information. Please try again.")
            toast.error("Failed to retrieve tracking information")
        } finally {
            setIsLoading(false)
        }
    };

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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={awbNumber}
                    onChange={(e) => validateAwbNumber(e.target.value)}
                    placeholder="Enter your 10-digit AWB number"
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
                disabled={!!error || awbNumber.length !== 10 || isLoading}
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