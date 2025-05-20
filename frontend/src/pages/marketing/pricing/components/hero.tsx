import { Button } from "@/components/ui/button";
import AuthModal from "@/components/auth/auth-modal";
import { motion } from "framer-motion";
import { CreditCard, Truck, Rocket, Shield } from "lucide-react";

const features = [
    {
        icon: CreditCard,
        title: "Transparent Pricing",
        description: "No hidden fees, pay only for what you ship"
    },
    {
        icon: Truck,
        title: "Pan India Coverage",
        description: "Ship to any corner of India with ease"
    },
    {
        icon: Rocket,
        title: "Fast Delivery",
        description: "Express shipping options available"
    },
    {
        icon: Shield,
        title: "Secure Shipping",
        description: "End-to-end tracking and insurance"
    }
];

const Hero = () => {
    return (
        <div className="py-20 relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Content */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-4xl lg:text-6xl font-semibold !leading-tight"
                        >
                            Choose a plan
                            <br />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                                className="bg-gradient-to-r from-[#653BFB] to-[#F63636] bg-clip-text text-transparent"
                            >
                                that works best
                            </motion.span>
                            {' '}for you
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="text-xl text-gray-600"
                        >
                            Maximize shipping efficiency and minimize costs with our flexible pricing plans
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="flex gap-4"
                    >
                        <AuthModal type="signup">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button size="lg" variant="primary">
                                    Get Started
                                </Button>
                            </motion.div>
                        </AuthModal>
                    </motion.div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                                className="bg-white/50 backdrop-blur-sm p-4 rounded-lg"
                            >
                                <feature.icon className="w-6 h-6 text-[#653BFB] mb-2" />
                                <div className="text-sm font-semibold">
                                    {feature.title}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {feature.description}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative lg:h-[600px]"
                >
                    <motion.img
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.3 }}
                        src="/images/pricing-hero.png"
                        alt="Pricing Hero"
                        className="w-full h-full object-contain"
                    />

                    {/* Floating Stats */}
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                        className="absolute top-10 right-0 bg-white p-4 rounded-lg shadow-lg hidden lg:block"
                    >
                        <div className="text-sm font-semibold">
                            Starting from
                        </div>
                        <div className="text-2xl font-bold text-[#653BFB]">
                            ₹18/500g
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                        className="absolute bottom-20 left-0 bg-white p-4 rounded-lg shadow-lg hidden lg:block"
                    >
                        <div className="text-sm font-semibold">
                            Save up to
                        </div>
                        <div className="text-2xl font-bold text-[#653BFB]">
                            45%
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero; 