import { Button } from "@/components/ui/button";
import { Check, Phone } from "lucide-react";
import AuthModal from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PlanFeature {
    text: string;
}

interface PricingPlan {
    name: string;
    price: string;
    description: string;
    features: PlanFeature[];
    isPopular?: boolean;
    shipmentRange: string;
    ctaText: string;
    isCustom?: boolean;
}

const plans: PricingPlan[] = [
    {
        name: "Starter",
        price: "20",
        shipmentRange: "0 – 1,000 shipments/month",
        description: "Best for small businesses and social sellers starting their shipping journey.",
        features: [
            { text: "Up to 50 shipments/day" },
            { text: "Basic Channel Integration" },
            { text: "Limited Courier Partners" },
            { text: "Call & Email Support" },
            { text: "Automated Channel Order Sync" },
        ],
        ctaText: "Join the Starter Plan"
    },
    {
        name: "Growth",
        price: "18",
        shipmentRange: "1,000 – 5,000 shipments/month",
        description: "Ideal for expanding businesses with increasing shipping needs.",
        features: [
            { text: "Everything in Starter Plan plus:" },
            { text: "Up to 300 shipments/day" },
            { text: "Multiple Channel Integrations" },
            { text: "Multiple Courier Partners" },
            { text: "Priority Support" },
        ],
        isPopular: true,
        ctaText: "Join the Growth Plan"
    },
    {
        name: "Elite",
        price: "Custom",
        shipmentRange: "5,000+ shipments/month",
        description: "Tailored for high-volume businesses needing personalized solutions and dedicated support.",
        features: [
            { text: "Everything in Growth Plan plus:" },
            { text: "Up to 1,000 shipments/day" },
            { text: "Dedicated Account Manager" },
            { text: "24/7 Support" },
            { text: "Early COD Remittance" },
        ],
        isCustom: true,
        ctaText: "Contact Us for the Elite Plan"
    },
];

const Plans = () => {
    return (
        <section className="py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h2 className="text-4xl font-bold mb-4">
                    Shipping Plans
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Smart solutions to meet every business need. Choose the plan that helps your business grow effortlessly!
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
                {plans.map((plan, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        key={index}
                        className={cn(
                            "rounded-2xl p-8 bg-white border-2 flex flex-col h-full relative",
                            plan.isPopular ? "border-main shadow-lg shadow-main/10" : "border-gray-100"
                        )}
                    >
                        {plan.isPopular && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute -top-4 left-1/2 -translate-x-1/2"
                            >
                                <span className="bg-main text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </span>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                            className="mb-8"
                        >
                            <h3 className="text-2xl font-bold mb-2">
                                {plan.name}
                            </h3>
                            <div className="mb-2">
                                {!plan.isCustom ? (
                                    <>
                                        <span className="text-4xl font-bold">₹{plan.price}</span>
                                        <span className="text-muted-foreground">/500 gms</span>
                                    </>
                                ) : (
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                )}
                            </div>
                            <p className="text-sm text-main font-medium mb-2">
                                {plan.shipmentRange}
                            </p>
                            <p className="text-muted-foreground">
                                {plan.description}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                            className="space-y-4 mb-8 flex-grow"
                        >
                            {plan.features.map((feature, featureIndex) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: 0.4 + featureIndex * 0.1 }}
                                    key={featureIndex}
                                    className="flex items-start gap-3"
                                >
                                    <Check className="w-5 h-5 text-main shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">
                                        {feature.text}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {!plan.isCustom ? (
                            <AuthModal type="signup">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        size="lg"
                                        variant={plan.isPopular ? "default" : "outline"}
                                        className={cn("w-full", plan.isPopular && "bg-main hover:bg-main/90")}
                                    >
                                        🚀 {plan.ctaText}
                                    </Button>
                                </motion.div>
                            </AuthModal>
                        ) : (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => window.location.href = '/contact'}
                                >
                                    <Phone className="w-4 h-4 mr-2" />
                                    {plan.ctaText}
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-12 text-center"
            >
                <p className="text-muted-foreground">
                    Need a custom plan? {" "}
                    <a href="/contact" className="text-main font-medium hover:text-main/90">
                        Contact our sales team
                    </a>
                </p>
            </motion.div>
        </section>
    );
};

export default Plans;
