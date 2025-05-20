import ContactForm from "./components/contact-form";
import { motion } from "framer-motion";

const ContactPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-20 z-0"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="max-w-3xl mx-auto text-center flex flex-col mb-8 gap-4"
            >
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="text-4xl lg:text-5xl font-semibold"
                >
                    Get in Touch
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-lg text-muted-foreground"
                >
                    Have questions about our services? We're here to help you find the perfect shipping solution for your business.
                </motion.p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250%] h-1/4 bg-gradient-to-t from-[#D6C0FE]"
            />
            <ContactForm />
        </motion.div>
    );
};

export default ContactPage;
