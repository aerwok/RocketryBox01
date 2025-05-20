import { motion } from "framer-motion"
import { useState } from "react"
import TrackOrderForm, { TrackingInfo } from "@/components/shared/track-order-form"
import TrackingResult from "@/components/shared/tracking-result"

const Hero = () => {
    const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)

    const handleTrackingResult = (data: TrackingInfo) => {
        setTrackingInfo(data)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row items-center justify-between relative gap-8 py-8 lg:py-16 z-0"
        >
            <div className="flex-1 lg:max-w-md space-y-6">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl lg:text-4xl font-semibold leading-tight"
                >
                    Track Your <br className="hidden lg:block" /> {' '}
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-900"
                    >
                        <span className="bg-gradient-to-b from-[#FCE712] to-[#C711D7] bg-clip-text text-transparent">
                            Shipments
                        </span>
                    </motion.span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-lg text-gray-600"
                >
                    Enter your Mobile Number or AWB ID to track Your Order
                </motion.p>

                {/* Tracking Steps with Animations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="hidden lg:grid grid-cols-3 gap-2 w-full mt-6"
                >
                    <TrackingStep
                        number={1}
                        description="Enter your AWB number"
                        delay={0.3}
                    />
                    <TrackingStep
                        number={2}
                        description="Get real-time tracking info"
                        delay={0.4}
                    />
                    <TrackingStep
                        number={3}
                        description="Know your delivery status"
                        delay={0.5}
                    />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="w-full lg:w-1/2 xl:w-1/3 space-y-6"
            >
                <TrackOrderForm 
                    onTrackingResult={handleTrackingResult}
                    className="transition-all hover:shadow-xl"
                />

                {/* Display tracking results */}
                {trackingInfo && <TrackingResult data={trackingInfo} />}
            </motion.div>
        </motion.div>
    )
}

interface TrackingStepProps {
    number: number;
    description: string;
    delay: number;
}

const TrackingStep = ({ number, description, delay }: TrackingStepProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="flex flex-col items-center justify-center p-2"
        >
            <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center justify-center size-10 bg-[#412A5F] rounded-full text-white font-semibold mb-2"
            >
                {number}
            </motion.div>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.1 }}
                className="text-sm font-medium text-center"
            >
                {description}
            </motion.span>
        </motion.div>
    );
};

export default Hero; 