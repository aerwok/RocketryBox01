import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface FeatureCardProps {
    title: string;
    description: string;
    index: number;
    detailDescription: string;
}

const features: Omit<FeatureCardProps, 'index'>[] = [
    {
        title: "Seamless channel integration",
        description: "Integrate all your shopping carts and marketplaces to sync all your inventory and orders",
        detailDescription: "Connect all your sales channels (Shopify, WooCommerce, Amazon, etc.) and automatically sync orders and inventory in real time. Avoid overselling and manual data entry with seamless integrations that keep your business running smoothly."
    },
    {
        title: "Courier recommendation engine",
        description: "Boost your delivery performance by shipping with a courier recommended by AI.",
        detailDescription: "Our AI-powered engine analyzes your shipment's destination, weight, and delivery speed requirements to recommend the best courier partner for each order. Improve delivery success rates and reduce costs with smart recommendations."
    },
    {
        title: "Bulk order creation",
        description: "Handle order surges easily by adding multiple orders instantly",
        detailDescription: "Upload or create multiple orders at once using CSV import or bulk entry forms. Perfect for flash sales, seasonal surges, or B2B shipments. Save time and reduce errors with streamlined bulk processing."
    },
    {
        title: "Auto-documentation",
        description: "Our system auto-generates invoices and manifests, speeding up the shipping process",
        detailDescription: "Automatically generate shipping labels, invoices, and manifests for every order. Our system ensures all documentation is compliant and ready for handover to courier partners, reducing manual paperwork and speeding up dispatch."
    },
    {
        title: "Shipping rate calculator",
        description: "Estimate shipping rates based on origin pin code destination pin code, weight and dimensions",
        detailDescription: "Get instant shipping rate estimates for any order based on source and destination pin codes, package weight, and dimensions. Compare rates across courier partners and choose the most cost-effective option for your business."
    },
    {
        title: "Smart NDR redressal",
        description: "Automate delivery validation and reattempt more successfully with our AI assistant",
        detailDescription: "Our Smart NDR (Non-Delivery Report) system automatically validates failed deliveries, communicates with customers, and schedules reattempts. Reduce RTO (Return to Origin) rates and improve delivery success with intelligent automation."
    }
];

const FeatureCard = ({ title, description, index, detailDescription }: FeatureCardProps) => {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
                duration: 0.3,
                delay: index * 0.05
            }}
            className="bg-white rounded-xl p-8 flex flex-col h-full"
        >
            <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                    duration: 0.3,
                    delay: 0.1 + index * 0.05
                }}
                className="text-xl font-semibold mb-4"
            >
                {title}
            </motion.h3>
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                    duration: 0.3,
                    delay: 0.2 + index * 0.05
                }}
                className="text-muted-foreground mb-6 flex-grow"
            >
                {description}
            </motion.p>
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                    duration: 0.3,
                    delay: 0.3 + index * 0.05
                }}
            >
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="text-purple-600 font-medium inline-flex items-center hover:gap-2 transition-all group bg-transparent border-none cursor-pointer"
                        >
                            Know More
                            <motion.div
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </motion.div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-purple-600">{title}</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="text-base text-gray-700 mt-4">
                            {detailDescription}
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </motion.div>
    );
};

const Features = () => {
    return (
        <section className="pb-20 relative z-0">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="absolute left-1/2 -translate-x-1/2 w-[200%] h-full bg-[#E6F3FF] -z-10"
            />
            <div className="pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                >
                    <h2 className="text-3xl lg:text-4xl font-semibold">
                        Streamline logistics with{' '}
                        <br />
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-red-500"
                        >
                            robust
                        </motion.span>
                        {' '}and{' '}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="text-red-500"
                        >
                            efficient solutions
                        </motion.span>
                    </h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto"
                    >
                        Improve eCommerce shipping using a platform packed with powerful services
                        to bring out ease in your shipping process.
                    </motion.p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-16">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features; 