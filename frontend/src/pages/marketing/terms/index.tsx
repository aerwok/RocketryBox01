import { motion } from "framer-motion";

const TermsPage = () => {
    return (
        <div className="container max-w-4xl mx-auto py-16 px-4 pb-40">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-center mb-8"
            >
                Terms and Conditions
            </motion.h1>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="prose prose-blue max-w-none"
            >
                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        1. Acceptance of Terms
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        By accessing and using Rocketry Box's services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        2. Service Description
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        Rocketry Box provides logistics and shipping services. We facilitate the pickup, transportation, and delivery of packages between senders and recipients.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        3. User Obligations
                    </motion.h2>
                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="list-disc pl-6 space-y-2 text-muted-foreground"
                    >
                        <li>Provide accurate and complete information</li>
                        <li>Maintain the security of your account</li>
                        <li>Comply with all applicable laws and regulations</li>
                        <li>Not use the service for illegal purposes</li>
                        <li>Pay all fees and charges associated with your account</li>
                    </motion.ul>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        4. Shipping Policies
                    </motion.h2>
                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="list-disc pl-6 space-y-2 text-muted-foreground"
                    >
                        <li>Proper packaging requirements</li>
                        <li>Prohibited items</li>
                        <li>Delivery timeframes</li>
                        <li>Insurance and liability coverage</li>
                        <li>Claims and dispute resolution</li>
                    </motion.ul>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        5. Payment Terms
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        All payments must be made through our approved payment methods. Fees are non-refundable unless otherwise specified. We reserve the right to modify our pricing with notice.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        6. Liability Limitations
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        Our liability is limited to the declared value of the shipment or the maximum coverage provided by our insurance, whichever is lower.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        7. Modifications to Terms
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        We reserve the right to modify these terms at any time. Continued use of our services after such modifications constitutes acceptance of the new terms.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.7, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        8. Contact Information
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 0.5 }}
                        className="text-muted-foreground"
                    >
                        For questions about these Terms and Conditions, please contact us at legal@rocketrybox.com
                    </motion.p>
                </section>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-1/2 z-0 -translate-x-1/2 w-[250%] h-1/8 bg-gradient-to-t from-[#D6C0FE]"
            />
        </div>
    );
};

export default TermsPage;