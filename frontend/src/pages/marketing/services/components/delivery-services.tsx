import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { serviceDetails } from "./service-details";

interface ServiceCardProps {
    title: string;
    description: string;
    image: string;
    index: number;
}

const services = [
    {
        title: "Hyperlocal",
        description: "Fast and efficient deliveries within a specific geographic area, ensuring same-day or on-demand fulfillment.",
        image: "/images/services/service1.png"
    },
    {
        title: "B2C (Business to Consumer)",
        description: "Direct delivery solutions from businesses to individual customers, optimizing last-mile logistics.",
        image: "/images/services/service2.png"
    },
    {
        title: "B2B (Business to Business)",
        description: "Reliable logistics for bulk shipments between businesses, streamlining supply chain operations.",
        image: "/images/services/service3.png"
    },
    {
        title: "B2C Air",
        description: "Expedited air shipping for faster and long-distance consumer deliveries.",
        image: "/images/services/service4.png"
    },
    {
        title: "Fulfillment & Warehousing",
        description: "End-to-end storage, inventory management, and order fulfillment solutions for businesses.",
        image: "/images/services/service5.png"
    }
];

const ServiceCard = ({ title, description, image, index }: ServiceCardProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl shadow-neutral-400/20 transition-shadow"
        >
            <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                className="border border-[#6D15E0] rounded-xl lg:rounded-2xl"
            >
                <img
                    src={image}
                    alt={title}
                    className="w-full h-48 object-contain"
                />
            </motion.div>
            <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="text-xl font-semibold mt-6"
            >
                {title}
            </motion.h3>
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="text-gray-600 mt-2"
            >
                {description}
            </motion.p>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="mt-4"
            >
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
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
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-purple-600">{title}</DialogTitle>
                        </DialogHeader>
                        <div className="prose prose-purple mt-4">
                            <ReactMarkdown>
                                {serviceDetails[title as keyof typeof serviceDetails]}
                            </ReactMarkdown>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </motion.div>
    );
};

const DeliveryServices = () => {
    return (
        <section className="py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="text-center mb-12"
            >
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-semibold mb-4"
                >
                    <span className="text-red-500">Powering</span>{' '}
                    <span className="text-blue-700">Your Deliveries</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="text-xl text-gray-600"
                >
                    From Hyperlocal to B2B, Air Freight to Warehousing.
                </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
                {services.slice(0, 3).map((service, index) => (
                    <ServiceCard
                        key={index}
                        {...service}
                        index={index}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:w-2/3 mx-auto mt-6">
                {services.slice(3).map((service, index) => (
                    <ServiceCard
                        key={index + 3}
                        {...service}
                        index={index + 3}
                    />
                ))}
            </div>
        </section>
    );
};

export default DeliveryServices; 