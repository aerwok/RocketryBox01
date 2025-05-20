import { motion } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";

const Stats = () => {
    return (
        <section className="py-20">
            <div className="text-center lg:text-left mx-auto">
                {/* Headings */}
                <div className="space-y-2 text-3xl lg:text-4xl font-semibold">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                    >
                        Unleash Your{' '}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="text-[#F63636]"
                        >
                            Shipping
                        </motion.span>
                        {' '}Potential
                    </motion.h2>
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        Centralize{' '}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="text-[#F63636]"
                        >
                            Orders
                        </motion.span>
                    </motion.h2>
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        Deliver{' '}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="text-[#F63636]"
                        >
                            Results
                        </motion.span>
                    </motion.h2>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                    >
                        <div className="text-4xl lg:text-5xl font-bold mb-2 text-black">
                            <NumberTicker value={10} delay={0.1} />
                            <span>+</span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="text-muted-foreground"
                        >
                            Sales Channel Integration
                        </motion.div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="text-center"
                    >
                        <div className="text-4xl lg:text-5xl font-bold mb-2 text-black">
                            <NumberTicker value={20} delay={0.15} />
                            <span>+</span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                            className="text-muted-foreground"
                        >
                            Courier Partners
                        </motion.div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="text-center"
                    >
                        <div className="text-4xl lg:text-5xl font-bold mb-2 text-black">
                            <NumberTicker value={15} delay={0.2} />
                            <span>%</span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="text-muted-foreground"
                        >
                            Lower Shipping cost
                        </motion.div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="text-center"
                    >
                        <div className="text-4xl lg:text-5xl font-bold mb-2 text-black">
                            <NumberTicker value={40} delay={0.25} />
                            <span>%</span>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.25 }}
                            className="text-muted-foreground"
                        >
                            Lower RTO losses
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Stats; 