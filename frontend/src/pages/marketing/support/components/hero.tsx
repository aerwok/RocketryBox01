import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Hero = () => {
    return (
        <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
            >
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="text-4xl lg:text-5xl font-semibold text-main"
                >
                    Our Customer
                    <br />
                    Support
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.08 }}
                    className="text-lg text-muted-foreground"
                >
                    Our team is ready to assist you. Use the contact options below to reach
                    out to us, and we'll get back to you as soon as possible. Your satisfaction
                    is our priority.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                >
                    <Link to="/contact">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.1 }}
                        >
                            <Button size="lg" className="bg-main hover:bg-main/90">
                                Contact Us
                            </Button>
                        </motion.div>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="relative h-full max-h-[400px]"
            >
                <motion.img
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                    src="/images/contactus.png"
                    alt="Support Hero"
                    className="w-full h-full object-contain mx-auto lg:ml-auto"
                />
            </motion.div>
        </div>
    );
};

export default Hero; 