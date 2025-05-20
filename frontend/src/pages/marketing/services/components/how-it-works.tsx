import { Button } from "@/components/ui/button";
import AuthModal from "@/components/auth/auth-modal";
import { motion } from "framer-motion";

const steps = [
    {
        step: "Step 1",
        title: "Import or add your orders and select a shipment",
        image: "/images/hiw-one.png"
    },
    {
        step: "Step 2",
        title: "Choose a carrier based on your choice or our recommendation",
        image: "/images/hiw-two.png"
    },
    {
        step: "Step 3",
        title: "Pack, label and hand them over to the courier partners",
        image: "/images/hiw-three.png"
    }
];

const HowItWorks = () => {
    return (
        <section className="py-20 relative bg-gradient-to-t from-[#D6C0FF] to-[#E3DFFF] overflow-visible">
            <div className="relative container mx-auto px-4">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-16 gap-8"
                >
                    <div className="max-w-2xl">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3 }}
                            className="text-3xl lg:text-4xl font-semibold mb-4"
                        >
                            How it works
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-lg text-muted-foreground"
                        >
                            Rocketry Box streamlines the entire online shipping journey, from
                            order fulfillment to doorstep delivery, with seamless real-time
                            tracking visibility
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                    >
                        <AuthModal type="signup">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button size="lg" variant="primary" className="bg-[#2B4EA8] hover:bg-[#2B4EA8]/90">
                                    Start Shipping
                                </Button>
                            </motion.div>
                        </AuthModal>
                    </motion.div>
                </motion.div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.2 }}
                            className="flex flex-col items-start"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.2 + index * 0.2 }}
                                className="w-full h-80"
                            >
                                <motion.img
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-auto object-cover"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.3 + index * 0.2 }}
                                className="flex flex-col items-start gap-2 mt-8"
                            >
                                <motion.h3
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 0.3 + index * 0.2 }}
                                    className="text-xl font-semibold"
                                >
                                    {step.step}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 0.3 + index * 0.2 }}
                                >
                                    {step.title}
                                </motion.p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks; 