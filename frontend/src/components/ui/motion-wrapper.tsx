
import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type AnimationType = "fade" | "scale" | "slideUp" | "slideRight";

interface MotionWrapperProps {
    children: ReactNode;
    animation: AnimationType;
    duration?: number;
    delay?: number;
    className?: string;
}

const animations: Record<AnimationType, Variants> = {
    fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    },
    scale: {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1 }
    },
    slideUp: {
        hidden: { y: 50, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    },
    slideRight: {
        hidden: { x: -50, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    }
};

const MotionWrapper = ({
    children,
    animation,
    duration = 0.5,
    delay = 0,
    className
}: MotionWrapperProps) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={animations[animation]}
            transition={{
                duration,
                delay,
                ease: "easeOut"
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default MotionWrapper; 
