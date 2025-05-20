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

interface PerkCardProps {
    title: string;
    description: string;
    image: string;
    index: number;
    detailDescription: string;
}

const perks: Omit<PerkCardProps, 'index'>[] = [
    {
        title: "Multiple payment options",
        description: "Give your buyers the freedom to choose between prepaid and COD (Cash-On-Delivery) modes, processing both efficiently.",
        image: "/images/feature-one.png",
        detailDescription: "Our flexible payment options empower both you and your customers. Offer Cash-on-Delivery (COD) for customers who prefer to pay upon receiving their orders, increasing conversion rates especially in Tier 2 and Tier 3 cities. Seamlessly process prepaid orders through multiple payment gateways, including credit/debit cards, UPI, net banking, and digital wallets. Our automated reconciliation system tracks all COD collections and remittances, with detailed reports and ledger management. Quick fund transfers ensure you receive your COD collections without delay, typically within 3-5 business days after delivery."
    },
    {
        title: "Real-time tracking updates",
        description: "Keep your buyers informed about their orders through live SMS, email and WhatsApp updates. Also, capture delivery preference for undelivered orders.",
        image: "/images/feature-two.png",
        detailDescription: "Our comprehensive tracking system provides end-to-end visibility for both sellers and buyers. Customers receive automated updates at every milestone: order confirmation, pickup, in-transit status, out for delivery, and delivery completion. Choose from multiple communication channels including SMS, email, and WhatsApp to reach customers through their preferred medium. The intelligent NDR (Non-Delivery Report) management system captures customer preferences for reattempts if the first delivery fails. Customers can also access our branded tracking page to check their shipment status anytime, reducing support inquiries and enhancing the post-purchase experience."
    },
    {
        title: "Customer delight",
        description: "Increase revenue by improving your post-ship experience using a custom-branded tracking page and an easy returns and refunds solution.",
        image: "/images/feature-three.png",
        detailDescription: "Elevate your customer experience with our suite of customer-centric features. Our white-labeled tracking page can be customized with your brand colors, logo, and messaging, creating a seamless experience. The intuitive returns portal allows customers to initiate returns themselves, selecting convenient pickup dates and providing return reasons. Automated refund processing integrates with your payment gateway to expedite customer refunds once returns are verified. Gather valuable insights through post-delivery feedback and ratings to continuously improve your service. Enhanced customer satisfaction leads to higher retention rates and increased lifetime value."
    }
];

const PerkCard = ({ title, description, image, index, detailDescription }: PerkCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="rounded-xl p-4 flex flex-col h-full"
    >
        <motion.div
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-lg lg:rounded-xl p-4"
        >
            <motion.img
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                src={image}
                alt={title}
                className="w-full h-64 object-contain"
            />
        </motion.div>
        <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            className="text-xl font-semibold mt-4"
        >
            {title}
        </motion.h3>
        <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
            className="text-muted-foreground text-sm mt-2 flex-grow"
        >
            {description}
        </motion.p>
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
        >
            <Dialog>
                <DialogTrigger asChild>
                    <button className="text-[#6D15E0] font-medium inline-flex items-center hover:gap-2 transition duration-300 mt-4 bg-transparent border-none cursor-pointer">
                        Know More
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-[#6D15E0]">{title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                        <img 
                            src={image} 
                            alt={title} 
                            className="w-full md:w-1/3 rounded-lg object-contain"
                        />
                        <DialogDescription className="text-base text-gray-700">
                            {detailDescription}
                        </DialogDescription>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    </motion.div>
);

const Perks = () => {
    return (
        <section className="py-20 lg:py-40 mt-20 lg:mt-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="text-center"
            >
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl lg:text-4xl font-semibold"
                >
                    ECommerce{' '}
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="text-[#0E2BAC]"
                    >
                        shipping made for the new age
                    </motion.span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto"
                >
                    Always keep your shipping process in line with the experience your customers want.
                </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
                {perks.map((perk, index) => (
                    <PerkCard
                        key={index}
                        {...perk}
                        index={index}
                    />
                ))}
            </div>
        </section>
    );
};

export default Perks; 