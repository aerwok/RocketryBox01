import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";

interface FeatureCardProps {
    title: string;
    description: string;
    index: number;
    detailDescription: string;
}

const features: Omit<FeatureCardProps, 'index'>[] = [
    {
        title: "Affordable shipping",
        description: "Ship to over all over India at the lowest costs. Choose from multiple courier modes based on the delivery speed and price.",
        detailDescription: "Our affordable shipping options allow you to send packages all across India at competitive rates. We negotiate with multiple courier partners to secure the best prices, which we pass directly to you. Whether you're shipping locally or nationwide, our tiered pricing ensures you get the best value. Compare shipping modes based on cost, speed, and service level to find the perfect balance for your business needs and customer expectations."
    },
    {
        title: "Shipping rate calculator",
        description: "Calculate shipping rates instantly based on the origin pin code, destination pin code, approximate weight and dimensions of your shipment.",
        detailDescription: "Our advanced shipping rate calculator provides real-time accurate pricing based on multiple factors. Input your origin and destination pin codes, package dimensions, and weight to instantly see shipping options with precise costs. The calculator includes all applicable taxes and surcharges, with no hidden fees. Compare rates across multiple courier partners in one place, and even save frequent calculations for future reference."
    },
    {
        title: "25+ courier partners",
        description: "Ship with multiple courier partners from a single platform without depending on a single courier. Reach more than 24000 pin codes across the country.",
        detailDescription: "Access over 25 courier partners through a single integrated platform. Our extensive network covers more than 24,000 pin codes across India, ensuring you can reach customers even in remote areas. Each courier partner is carefully selected for reliability, performance, and value. Our intelligent shipping algorithm suggests the best courier for each shipment based on destination, package type, and delivery timeline requirements."
    },
    {
        title: "Discounted shipping rates",
        description: "Ship across India with rates starting at just Rs. 20/500 grams. Save big on your shipping costs and increase your profits.",
        detailDescription: "Enjoy significant discounts on shipping rates with prices starting as low as Rs. 20 per 500 grams. Our high-volume partnerships with couriers allow us to negotiate deep discounts, which we pass directly to you. The more you ship, the more you save, with tiered volume discounts available for regular shippers. Compare our rates with market prices to see how much you can save annually on your shipping expenses."
    },
    {
        title: "No platform or setup fee",
        description: "With Rocketry Box, you can get started for free without paying any platform or setup fees. Just recharge your account and pay only for shipping your orders.",
        detailDescription: "Start using our platform immediately with no upfront costs. We've eliminated platform fees, setup charges, and monthly subscriptions that other logistics services commonly charge. Simply recharge your account with the amount you need for shipping, and that's all you pay for. Our transparent pay-as-you-go model ensures you only pay for what you use, with no long-term commitments or minimum shipping requirements."
    },
    {
        title: "Simplified order management",
        description: "Manage all your forward and return orders from one platform. Create, process and track your orders in a few clicks.",
        detailDescription: "Our comprehensive order management system brings together all your shipping operations in one place. Easily create shipping labels for new orders with just a few clicks. Manage returns and forward shipments from the same dashboard with full visibility. Bulk actions allow you to process multiple orders simultaneously, saving valuable time. The intuitive interface requires minimal training, allowing your team to become productive immediately."
    },
    {
        title: "Label & buyer communication",
        description: "Choose the size of your label and decide the information like address, phone number, etc., you want to mention on the label.",
        detailDescription: "Customize your shipping labels to meet your exact requirements. Choose from multiple label sizes and formats to fit your packaging needs. Control what information appears on the label, including custom fields and branding elements. Automated buyer communication keeps customers informed at every step, from order confirmation to delivery, with customizable templates for SMS, email, and WhatsApp notifications."
    },
    {
        title: "Multi-functional dashboard",
        description: "Experience a single-view dashboard where you can see analytics for your forward and return orders, shipments, NDR, RTO, and more.",
        detailDescription: "Our powerful analytics dashboard provides complete visibility into your shipping operations. View real-time statistics on all shipments, including forward orders, returns, non-delivery reports (NDR), and return-to-origin (RTO) status. Interactive charts and graphs help identify trends and areas for improvement. Export detailed reports for accounting and planning purposes. Customizable views let you focus on the metrics that matter most to your business."
    }
];

const FeatureCard = ({ title, description, index, detailDescription }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-white rounded-xl p-8 flex flex-col h-full"
    >
        <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="text-xl font-semibold mb-4"
        >
            {title}
        </motion.h3>
        <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="text-muted-foreground mb-6 flex-grow"
        >
            {description}
        </motion.p>
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + index * 0.05 }}
        >
            <Dialog>
                <DialogTrigger asChild>
                    <button className="text-[#7C3AED] font-medium inline-flex items-center hover:gap-2 transition-all bg-transparent border-none cursor-pointer">
                        Know More
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-[#7C3AED]">{title}</DialogTitle>
                        <DialogDescription className="text-base text-gray-700 mt-4">
                            {detailDescription}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </motion.div>
    </motion.div>
);

const Features = () => {
    return (
        <section className="pb-20 relative z-0">
            <div className="absolute left-1/2 -translate-x-1/2 w-[200%] h-full bg-[#E6F3FF] -z-10"></div>
            <div className="pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                >
                    <h2 className="text-3xl lg:text-4xl font-semibold">
                        An experience that your {' '} <br />customers {' '}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-r from-[#A40EAC] to-[#C800FF] bg-clip-text text-transparent"
                        >
                            love
                        </motion.span>
                    </h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto"
                    >
                        Improve eCommerce shipping using a platform packed with powerful features to bring out ease in your shipping process.
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10"
                >
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                            index={index}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Features; 