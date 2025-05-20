import Hero from "./components/hero";
import TrackingSteps from "./components/tracking-steps";
import Companies from "./components/companies";
import { motion } from "framer-motion";

const TrackPage = () => {
    return (
        <div className="container mx-auto px-4 py-20 z-0 relative">
            <Hero />
            <TrackingSteps />
            <Companies />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 -z-10 w-[250%] h-40 bg-gradient-to-t from-[#D6C0FE] to-[#D6C0FE]/0"
            />
        </div>
    );
};

export default TrackPage; 