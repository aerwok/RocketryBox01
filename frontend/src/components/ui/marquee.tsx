import { cn } from "@/lib/utils";
import "@/styles/marquee.css";
import { ReactNode, useRef, useEffect } from "react";

interface MarqueeProps {
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    children: ReactNode;
    speed?: number;
}

export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    speed = 20,
}: MarqueeProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const animationDuration = Math.max(10, 80 / speed); // Ensure reasonable duration bounds
    
    // Clone children to ensure smooth animation
    useEffect(() => {
        if (!contentRef.current) return;
        
        // Calculate how many times we need to repeat children to fill the container
        const container = contentRef.current.parentElement;
        if (container) {
            const containerWidth = container.offsetWidth;
            const contentWidth = contentRef.current.scrollWidth / 2; // Divide by 2 since we already have 2 copies
            
            if (contentWidth < containerWidth) {
                // Need more copies to fill the container
                const neededCopies = Math.ceil(containerWidth / contentWidth) + 1;
                const currentChildren = contentRef.current.children;
                const singleSetCount = currentChildren.length / 2;
                
                // Add more copies if needed
                if (neededCopies > 2) {
                    for (let i = 0; i < (neededCopies - 2) * singleSetCount; i++) {
                        const index = i % singleSetCount;
                        const clone = currentChildren[index].cloneNode(true);
                        contentRef.current.appendChild(clone);
                    }
                }
            }
        }
    }, [children]);

    return (
        <div className={cn("marquee-container", className)}>
            <div 
                ref={contentRef}
                className={cn(reverse ? "marquee-content-reversed" : "marquee-content")}
                style={{
                    animationDuration: `${animationDuration}s`,
                }}
                onMouseEnter={pauseOnHover ? (e) => {
                    e.currentTarget.style.animationPlayState = 'paused';
                } : undefined}
                onMouseLeave={pauseOnHover ? (e) => {
                    e.currentTarget.style.animationPlayState = 'running';
                } : undefined}
            >
                {children}
                {children}
            </div>
        </div>
    );
}
