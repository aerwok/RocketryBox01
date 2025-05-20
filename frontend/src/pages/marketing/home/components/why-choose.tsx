import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Truck,
    PackageSearch,
    Building2,
    Boxes
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
    title: string;
    description: string;
    image: string;
    icon: React.ReactNode;
    index: number;
}

const features = [
    {
        title: "Shipping",
        description: "Automated nationwide shipping at ₹30/500 gms with real-time tracking and updates",
        image: "/images/marketing/shipping.png",
        icon: <Truck className="size-5" />
    },
    {
        title: "Quick",
        description: "Fastest local deliveries to multiple destinations with efficient route optimization",
        image: "/images/marketing/quick.png",
        icon: <PackageSearch className="size-5" />
    },
    {
        title: "Cargo",
        description: "B2B & bulk shipping across India with competitive rates and dedicated support",
        image: "/images/marketing/cargo.png",
        icon: <Building2 className="size-5" />
    },
    {
        title: "Fulfilment",
        description: "Warehousing facilities including packaging and shipping with inventory management",
        image: "/images/marketing/fulfillment.png",
        icon: <Boxes className="size-5" />
    }
];

const WhyChoose = () => {
    return (
        <section className="py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center"
            >
                <h2 className="text-4xl font-semibold">
                    Why is{' '}
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
                    >
                        Rocketry Box
                    </motion.span>
                    <br />
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.2 }}
                    >
                        the Trusted Partner for Your Businesses?
                    </motion.span>
                </h2>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 p-4 lg:p-6 bg-gradient-to-b from-[#63D2FF] to-[#AF8EEC] rounded-xl lg:rounded-3xl"
            >
                {features.map((feature, index) => (
                    <FeatureCard
                        key={index}
                        {...feature}
                        index={index}
                    />
                ))}
            </motion.div>
        </section>
    );
};

const FeatureCard = ({ title, description, image, icon, index }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
        className="bg-white rounded-xl p-4 flex flex-col"
    >
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.5 + index * 0.1 }}
            className="h-48 lg:h-80 flex items-center justify-center w-full"
        >
            <div className="relative w-full h-full p-2 bg-neutral-200 rounded-lg">
                <motion.img
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.6 + index * 0.1 }}
                    src={image}
                    alt={title}
                    className="w-full h-full object-contain rounded-lg"
                />
            </div>
        </motion.div>
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.7 + index * 0.1 }}
            className="flex items-center gap-2 mt-4"
        >
            <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.3 }}
            >
                {icon}
            </motion.div>
            <h3 className="text-xl font-semibold">
                {title}
            </h3>
        </motion.div>
        <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.8 + index * 0.1 }}
            className="text-muted-foreground text-sm mt-1"
        >
            {description}
        </motion.p>
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.9 + index * 0.1 }}
            className="mt-4"
        >
            <Link to="/seller/register">
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                    <Button variant="primary" className="w-full">
                        Sign up
                    </Button>
                </motion.div>
            </Link>
        </motion.div>
    </motion.div>
);

export default WhyChoose; 