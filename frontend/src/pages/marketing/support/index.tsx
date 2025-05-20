import { motion } from "framer-motion";
import Hero from "./components/hero";

const SupportPage = () => {
    return (
        <div className="container mx-auto px-4 py-20">
            <Hero />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250%] h-1/4 bg-gradient-to-t from-[#D6C0FE]"
            />
        </div>
    );
};

export default SupportPage;
