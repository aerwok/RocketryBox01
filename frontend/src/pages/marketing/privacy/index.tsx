import { motion } from "framer-motion";

const PrivacyPage = () => {
    return (
        <div className="container max-w-4xl mx-auto py-16 px-4 pb-40">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-bold text-center mb-8"
            >
                Privacy Policy
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
                        Introduction
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        At Rocketry Box, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our logistics platform.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        Information We Collect
                    </motion.h2>
                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="list-disc pl-6 space-y-2 text-muted-foreground"
                    >
                        <li>Personal identification information (Name, email address, phone number)</li>
                        <li>Shipping and billing addresses</li>
                        <li>Payment information</li>
                        <li>Order history and tracking data</li>
                        <li>Device and usage information</li>
                    </motion.ul>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        How We Use Your Information
                    </motion.h2>
                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="list-disc pl-6 space-y-2 text-muted-foreground"
                    >
                        <li>To process and fulfill your shipping orders</li>
                        <li>To communicate with you about your orders</li>
                        <li>To provide customer support</li>
                        <li>To improve our services</li>
                        <li>To send you marketing communications (with your consent)</li>
                    </motion.ul>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        Data Security
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="text-muted-foreground mb-4"
                    >
                        We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </motion.p>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        Your Rights
                    </motion.h2>
                    <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="list-disc pl-6 space-y-2 text-muted-foreground"
                    >
                        <li>Access your personal information</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Object to data processing</li>
                        <li>Withdraw consent</li>
                    </motion.ul>
                </section>

                <section className="mb-8">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3, duration: 0.5 }}
                        className="text-2xl font-semibold mb-4"
                    >
                        Contact Us
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                        className="text-muted-foreground"
                    >
                        If you have any questions about this Privacy Policy, please contact us at privacy@rocketrybox.com
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

export default PrivacyPage;