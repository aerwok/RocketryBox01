import { motion } from "framer-motion"
import TrackOrderForm, { TrackingInfo } from "@/components/shared/track-order-form"
import TrackingResult from "@/components/shared/tracking-result"
import { useState } from "react"

const TrackOrders = () => {
    const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)

    const handleTrackingResult = (data: TrackingInfo) => {
        setTrackingInfo(data)
    }

    return (
        <div className="flex flex-col items-start justify-start relative py-20">
            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="text-3xl lg:text-4xl font-semibold leading-tight"
            >
                Track Your <br className="hidden lg:block" /> {' '}
                <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-900"
                >
                    <span className="bg-gradient-to-b from-[#FCE712] to-[#C711D7] bg-clip-text text-transparent">
                        Orders Easily
                    </span>
                </motion.span>
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl mt-4"
            >
                Enter your Mobile Number or AWB ID to track Your Order
            </motion.p>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="lg:w-1/2"
            >
                <img
                    src="/images/track-order.png"
                    alt="Track order"
                    className="w-full h-auto"
                />
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="hidden lg:block absolute -top-10 right-0 z-10"
            >
                <motion.img
                    transition={{ type: "spring", stiffness: 300 }}
                    src="/images/ship-order.png"
                    alt="Ship order"
                    className="w-full h-96"
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="lg:absolute top-1/4 right-1/4 z-20 max-w-md w-full mt-8 lg:mt-0"
            >
                <TrackOrderForm onTrackingResult={handleTrackingResult} className="transition-all hover:shadow-xl" />
                {trackingInfo && <TrackingResult data={trackingInfo} />}
            </motion.div>
        </div>
    )
}

export default TrackOrders
