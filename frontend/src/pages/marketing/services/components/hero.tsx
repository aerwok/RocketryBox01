import { Button } from "@/components/ui/button";
import AuthModal from "@/components/auth/auth-modal";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle2, Container } from "lucide-react";

const floatingIcons = [
    { Icon: Package, color: "#F63636", top: "10%", left: "5%", delay: 0.2 },
    { Icon: Truck, color: "#653BFB", top: "20%", right: "20%", delay: 0.4 },
    { Icon: CheckCircle2, color: "#00A76F", bottom: "40%", left: "15%", delay: 0.6 },
    { Icon: Container, color: "#FFAB00", bottom: "20%", right: "25%", delay: 0.8 }
];

const Hero = () => {
    return (
        <div className="py-20 relative overflow-hidden">
            {/* Floating Icons */}
            {floatingIcons.map(({ Icon, color, top, left, right, bottom, delay }, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.5,
                        delay,
                        type: "spring",
                        stiffness: 100
                    }}
                    style={{ position: "absolute", top, left, right, bottom }}
                    className="hidden lg:block"
                >
                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: index * 0.2
                        }}
                    >
                        <Icon size={32} style={{ color }} />
                    </motion.div>
                </motion.div>
            ))}

            <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Content */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <motion.h1
                            className="text-4xl lg:text-6xl font-semibold !leading-tight"
                        >
                            The{' '}
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-[#653BFB]"
                            >
                                simplest
                            </motion.span>
                            {' '}way
                            <br />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                to ship online orders
                            </motion.span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="text-xl text-gray-600"
                        >
                            Our easy-to-use eCommerce shipping platform automates your
                            workflows across sales channels, saving you time as well as money.
                        </motion.p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
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

                    {/* Feature Points */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="grid grid-cols-2 gap-4 pt-8"
                    >
                        {[
                            { title: "Fast Delivery", value: "24-48 hrs" },
                            { title: "Coverage", value: "Pan India" },
                            { title: "Cost Saving", value: "Upto 45%" },
                            { title: "Courier Partners", value: "20+" }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                                className="bg-white/50 backdrop-blur-sm p-4 rounded-lg"
                            >
                                <div className="text-lg font-semibold text-[#653BFB]">{item.value}</div>
                                <div className="text-sm text-gray-600">{item.title}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Right Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.8,
                        delay: 0.3,
                    }}
                    className="relative lg:h-[600px]"
                >
                    <motion.img
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                        src="/images/services-hero.png"
                        alt="Service Hero"
                        className="w-full h-full object-contain"
                    />

                    {/* Floating Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute top-10 right-0 bg-white p-4 rounded-lg shadow-lg hidden lg:block"
                    >
                        <div className="text-sm font-semibold">Daily Shipments</div>
                        <div className="text-2xl font-bold text-[#653BFB]">10,000+</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="absolute bottom-20 left-0 bg-white p-4 rounded-lg shadow-lg hidden lg:block"
                    >
                        <div className="text-sm font-semibold">Customer Satisfaction</div>
                        <div className="text-2xl font-bold text-[#653BFB]">99%</div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero; 