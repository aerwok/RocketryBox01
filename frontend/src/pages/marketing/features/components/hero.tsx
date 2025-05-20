import AuthModal from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowUpRight, Package, Shield, Sparkles, Zap } from "lucide-react";

const featureHighlights = [
    {
        icon: Sparkles,
        label: "Fast Processing",
        value: "2x Faster",
        color: "#F63636",
        position: { top: "5%", right: "25%" }
    },
    {
        icon: Shield,
        label: "Success Rate",
        value: "99.9%",
        color: "#4CAF50",
        position: { top: "10%", left: "25%" }
    },
    {
        icon: Zap,
        label: "Cost Reduction",
        value: "45%",
        color: "#2196F3",
        position: { bottom: "15%", left: "35%" }
    },
    {
        icon: Package,
        label: "Daily Shipments",
        value: "10k+",
        color: "#FF9800",
        position: { bottom: "5%", right: "10%" }
    }
];

const Hero = () => {
    return (
        <section className="py-20 lg:min-h-[90vh] overflow-hidden relative">
            {/* Background Elements */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 overflow-hidden -z-10"
            >
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#653BFB] rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#F63636] rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
            </motion.div>

            <div className="container mx-auto px-4 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                    >
                        {/* Modern Design Element */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "40%" }}
                            transition={{ duration: 0.5 }}
                            className="h-1 bg-gradient-to-r from-[#653BFB] to-[#F63636] mb-6"
                        />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="flex items-center gap-2 mb-8"
                        >
                            <Sparkles className="w-5 h-5 text-[#653BFB]" />
                            <span className="text-sm font-medium bg-gradient-to-r from-[#653BFB] to-[#F63636] bg-clip-text text-transparent">
                                Shipping Made Simple
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="text-4xl lg:text-6xl font-semibold leading-tight"
                        >
                            Powerful features to{' '}
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                                className="bg-gradient-to-r from-[#653BFB] to-[#F63636] bg-clip-text text-transparent"
                            >
                                boost your shipping
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            className="text-xl text-muted-foreground mt-6"
                        >
                            Streamline your shipping process with our comprehensive suite of features
                            designed to save time, reduce costs, and delight your customers.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.3 }}
                            className="mt-8"
                        >
                            <AuthModal type="signup">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button size="lg" variant="primary" className="text-lg px-8 py-6">
                                        Explore Features
                                    </Button>
                                </motion.div>
                            </AuthModal>
                        </motion.div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="relative lg:p-12"
                    >
                        <motion.img
                            initial={{ y: 0 }}
                            animate={{ y: [-10, 10, -10] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            src="/images/feature-hero.png"
                            alt="Feature Hero"
                            className="w-full h-auto rounded-2xl"
                        />

                    </motion.div>
                </div>

                {/* Floating Feature Highlights */}
                {featureHighlights.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 0.8 + index * 0.1,
                        }}
                        className="absolute hidden lg:block"
                        style={feature.position}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg flex items-start gap-3"
                        >
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${feature.color}20` }}>
                                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                            </div>
                            <div className="text-left">
                                <div className="text-sm text-gray-600">
                                    {feature.label}
                                </div>
                                <div className="text-lg font-semibold" style={{ color: feature.color }}>
                                    {feature.value}
                                </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Hero;
