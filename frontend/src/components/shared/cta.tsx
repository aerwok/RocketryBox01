import { Button } from "@/components/ui/button";
import AuthModal from "@/components/auth/auth-modal";
import { motion } from "framer-motion";

const CTA = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="py-16 bg-gradient-to-t from-[#D6C0FF]"
        >
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ scale: 0.95 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="rounded-2xl relative overflow-hidden bg-gradient-to-r from-[#7130FF]/90 to-[#e9b16b]"
                >
                    <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between px-5 py-12 lg:px-12 lg:py-28">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="max-w-2xl text-white text-center lg:text-left space-y-4"
                        >
                            <motion.h2
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className="text-3xl lg:text-5xl font-semibold !leading-tight"
                            >
                                Get a one-stop customer
                                <br />
                                experience solution
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                                className="text-lg opacity-90"
                            >
                                Experience a platform loaded with everything that allows
                                you to do more than just shipping.
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            className="absolute top-20 right-1/4 z-10 hidden xl:block"
                        >
                            <motion.img
                                animate={{
                                    x: [0, 10, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut"
                                }}
                                src="/images/cta-arrow.png"
                                alt="Arrow pointing to sign up"
                                width={200}
                                height={100}
                                className="h-32 w-full"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            className="relative mt-8 lg:mt-0 lg:mr-40"
                        >
                            <AuthModal type="signup">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Button variant="white" size="lg">
                                        Sign-Up for FREE
                                    </Button>
                                </motion.div>
                            </AuthModal>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default CTA; 