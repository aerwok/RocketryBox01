import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ServiceFactory } from "@/services/service-factory";

const images = [
    "/images/customer/home1.png",
    "/images/customer/home2.png",
    "/images/customer/home3.png",
    "/images/customer/home4.png",
];

// Interface for status button data
interface StatusButton {
    id: number;
    label: string;
    count: number;
    color: string;
    status: string;
}

// Function to fetch status counts from API
async function fetchStatusCounts(): Promise<Record<string, number>> {
    try {
        const response = await ServiceFactory.customer.orders.getStatusCounts();
        return response.data.counts;
    } catch (error) {
        console.error('Error fetching status counts:', error);
        throw error;
    }
}

const CustomerHomePage = () => {
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);
    const [statusButtons, setStatusButtons] = useState<StatusButton[]>([]);
    const [loadingCounts, setLoadingCounts] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(timer);
    }, []);

    // Fetch real-time status counts on component mount
    useEffect(() => {
        const getStatusCounts = async () => {
            try {
                setLoadingCounts(true);
                const counts = await fetchStatusCounts();
                
                // Update status buttons with real counts
                setStatusButtons([
                    { id: 6, label: "Manifested", count: counts["Booked"] || 0, color: "bg-blue-500", status: "Booked" },
                    { id: 5, label: "Picked Up", count: counts["Processing"] || 0, color: "bg-[#1AA1B7]", status: "Processing" },
                    { id: 4, label: "In Transit", count: counts["In Transit"] || 0, color: "bg-yellow-500", status: "In Transit" },
                    { id: 2, label: "Out for Delivery", count: counts["Out for Delivery"] || 0, color: "bg-green-400", status: "Out for Delivery" },
                    { id: 1, label: "Delivered", count: counts["Delivered"] || 0, color: "bg-emerald-700", status: "Delivered" },
                    { id: 3, label: "Returned", count: counts["Returned"] || 0, color: "bg-neutral-500", status: "Returned" }
                ]);
            } catch (error) {
                console.error("Failed to fetch status counts:", error);
                // Set empty status buttons on error
                setStatusButtons([]);
            } finally {
                setLoadingCounts(false);
            }
        };
        
        getStatusCounts();
    }, []);

    const handleStatusButtonClick = (status: string) => {
        navigate(`/customer/orders?status=${status}`);
    };

    return (
        <div className="container mx-auto px-4 h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="grid lg:grid-cols-2 gap-6 xl:gap-12 items-center justify-center h-full">
                {/* Left Image Slideshow */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative w-4/5 h-80 lg:h-[500px] mx-auto"
                >
                    {/* Image Container with Fixed Dimensions */}
                    <div className="absolute inset-0 overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.img
                                key={currentImage}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                src={images[currentImage]}
                                alt={`Slide ${currentImage + 1}`}
                                className="w-full h-full object-contain"
                                style={{ willChange: "transform" }}
                                loading="eager"
                            />
                        </AnimatePresence>
                    </div>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-0 lg:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                            <motion.button
                                key={index}
                                onClick={() => setCurrentImage(index)}
                                className={cn("w-2 h-2 rounded-full", currentImage === index ? "bg-main" : "bg-neutral-200")}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Right Content */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    className="space-y-6 lg:space-y-8 h-full w-full flex flex-col lg:justify-center pb-8 lg:pb-0"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="space-y-4 text-center"
                    >
                        <h1 className="text-4xl lg:text-6xl font-bold text-main !leading-tight">
                            CREATE ORDER
                            <br />
                            NOW !
                        </h1>
                    </motion.div>

                    {/* Button to create order */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="flex justify-center"
                    >
                        <Link to="/customer/create-order">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button size="lg" variant="customer">
                                    Create Order
                                </Button>
                            </motion.div>
                        </Link>
                    </motion.div>

                    {/* Status Buttons Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full"
                    >
                        {statusButtons.map((button, index) => (
                            <motion.div
                                key={button.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStatusButtonClick(button.status)}
                                className="cursor-pointer"
                            >
                                <div className={cn(
                                    "flex items-center justify-start gap-1 text-start px-4 py-2 rounded-lg text-white",
                                    button.color
                                )}>
                                    <span className="text-sm font-semibold flex items-center">
                                        {loadingCounts ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            button.count
                                        )}
                                    </span>
                                    <span className="text-xs lg:text-sm">
                                        {button.label}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default CustomerHomePage; 
