import { ArrowRightIcon } from "lucide-react";
import { motion } from "framer-motion";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";

interface ServiceCardProps {
    title: string;
    description: string;
    imagePath: string;
    index: number;
    detailDescription: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, imagePath, index, detailDescription }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="p-8 rounded-xl mb-6"
            style={{
                background: 'linear-gradient(to top, #E0DDFF, #F7FBFE)'
            }}
        >
            <div className="flex flex-col gap-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className="space-y-4"
                >
                    <motion.h3
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                        className="text-2xl font-bold text-gray-900"
                    >
                        {title}
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                        className="text-gray-600 text-lg"
                    >
                        {description}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                    >
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="inline-flex items-center text-purple-600 hover:text-purple-700 bg-transparent border-none cursor-pointer">
                                    Learn More
                                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold text-purple-600">{title}</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col gap-6 mt-4">
                                    <img 
                                        src={imagePath} 
                                        alt={title} 
                                        className="w-full rounded-lg object-contain"
                                    />
                                    <DialogDescription className="text-base text-gray-700">
                                        {detailDescription}
                                    </DialogDescription>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </motion.div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="mt-6"
                >
                    <img
                        src={imagePath}
                        alt={title}
                        className="w-full rounded-lg"
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};

const Services = () => {
    return (
        <div className="py-16">
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6 order-2 lg:order-1">
                    <ServiceCard
                        title="Effortless NDR management"
                        description="Process your undelivered orders easily using an automated non-delivery tab. Maintain a thorough flow so your return orders don't stay stuck."
                        imagePath="/images/feature-four.png"
                        index={0}
                        detailDescription="Our advanced NDR (Non-Delivery Report) management system revolutionizes how you handle undelivered shipments. The intelligent dashboard categorizes NDRs by reason, urgency, and age, helping you prioritize actions effectively. Automated customer communication allows buyers to reschedule deliveries or provide alternate addresses without your intervention. Customizable workflows let you set specific actions for different NDR scenarios based on your business rules. Real-time analytics track NDR rates by location, courier, and product category to identify patterns and reduce future failures. The system auto-escalates aging NDRs to prevent shipments from remaining undelivered for extended periods."
                    />
                    <ServiceCard
                        title="API integration"
                        description="Selling on different eCommerce platforms? Our API integration solution will help you manage your shipping operations on one platform."
                        imagePath="/images/feature-size.png"
                        index={1}
                        detailDescription="Our robust API integration capabilities allow seamless connection with your existing systems and sales channels. The RESTful API architecture supports all major shipping functions including order creation, rate calculation, tracking, and NDR management. Comprehensive documentation with code samples in multiple languages makes integration straightforward for your development team. Webhook support enables real-time event notifications for order status changes and delivery updates. The sandbox environment allows testing before going live to ensure everything works perfectly. Our API supports batch operations for efficient processing of multiple orders simultaneously, ideal for high-volume sellers."
                    />
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                        className="p-8 mb-8"
                    >
                        <motion.h2
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.05 }}
                            className="text-4xl font-bold"
                        >
                            Shipping automation
                            <br />
                            to{' '}
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                style={{
                                    background: 'linear-gradient(to right, #D5E12B, #B214E2)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}
                            >
                                make your life easy
                            </motion.span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                            className="mt-4 text-gray-600 text-lg"
                        >
                            Improve the way your shipping process functions. Reduce the manual effort to save your time and money.
                        </motion.p>
                    </motion.div>
                    <ServiceCard
                        title="8+ channel integrations"
                        description="Automatically fetch orders and sync inventory from various sales channels and marketplaces like Shopify, Woocommerce, Amazon and the like."
                        imagePath="/images/feature-five.png"
                        index={2}
                        detailDescription="Our comprehensive channel integration system connects your shipping operations with all major eCommerce platforms and marketplaces. Automated order import eliminates manual data entry, pulling orders from platforms like Shopify, WooCommerce, Amazon, Flipkart, and more. Real-time inventory synchronization across all channels prevents overselling and stock discrepancies. Status updates flow back to each platform, keeping your customers informed regardless of where they purchased. The single dashboard view consolidates orders from all channels, simplifying operations management. Our smart order routing automatically assigns the optimal courier based on destination, package characteristics, and your shipping rules."
                    />
                </div>
            </div>
        </div>
    );
};

export default Services; 