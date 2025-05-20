import { ClipboardCheck, PackageCheck, PackageSearch, Truck, MapPin } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
    {
        icon: ClipboardCheck,
        title: "Order Confirmation",
        description: "Your shipment has been successfully registered in our system"
    },
    {
        icon: PackageCheck,
        title: "Package Collection",
        description: "Shipment has been collected by our delivery partner"
    },
    {
        icon: Truck,
        title: "In Transit",
        description: "Your package is securely on the move to its final destination"
    },
    {
        icon: PackageSearch,
        title: "Out for Delivery",
        description: "Package is with our delivery executive for final delivery"
    },
    {
        icon: MapPin,
        title: "Delivery Complete",
        description: "Successfully delivered to the destination address"
    }
] as const;

const TrackingSteps = () => {
    return (
        <div className="w-full py-20">
            <div className="container mx-auto px-4 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-start text-left w-full"
                >
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl lg:text-3xl font-semibold mb-4"
                    >
                        Real-Time <span className="bg-gradient-to-b from-[#FCE712] to-[#C711D7] bg-clip-text text-transparent">Shipment Tracking</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="text-gray-600 max-w-lg"
                    >
                        Monitor your shipment's journey at every step with our comprehensive tracking system
                    </motion.p>
                </motion.div>

                {/* Desktop Timeline */}
                <div className="hidden md:flex justify-between items-start relative z-0 mt-10">
                    {/* Dashed Line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute left-0 right-0 top-1/2 z-10 border-t-2 border-dashed border-border -translate-y-1/2"
                    />

                    {/* Steps */}
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="relative flex flex-col gap-4 z-10 bg-[#EEF7FF] pl-4 pr-2"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                                className="size-12 rounded-full flex items-center justify-center bg-blue-200"
                            >
                                <step.icon strokeWidth={1.5} className="size-6 text-blue-600" />
                            </motion.div>
                            <div className="flex flex-col gap-1">
                                <motion.h3
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                                    className="font-medium"
                                >
                                    {step.title}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
                                    className="text-sm text-gray-600 max-w-40"
                                >
                                    {step.description}
                                </motion.p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile Timeline */}
                <div className="md:hidden">
                    <div className="relative flex flex-col gap-8 pl-8">
                        {/* Vertical Line */}
                        <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute left-4 top-0 bottom-0 border-l-2 border-dashed border-border"
                        />

                        {/* Steps */}
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="relative flex items-start gap-4"
                            >
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                                    className="absolute -left-[30px] size-8 rounded-full flex items-center justify-center z-10 bg-blue-200"
                                >
                                    <step.icon strokeWidth={1.5} className="size-6 text-blue-600" />
                                </motion.div>
                                {/* Content */}
                                <div className="flex flex-col gap-1 ml-6">
                                    <motion.h3
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
                                        className="font-medium"
                                    >
                                        {step.title}
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
                                        className="text-sm text-gray-600"
                                    >
                                        {step.description}
                                    </motion.p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default TrackingSteps;
