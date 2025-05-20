import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", loading, icon, iconPosition = "left", children, ...props }, ref) => {
        return (
            <UIButton
                ref={ref}
                variant={variant}
                size={size}
                className={cn(className)}
                disabled={loading || props.disabled}
                {...props}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        {icon && iconPosition === "left" && (
                            <span className="mr-2">{icon}</span>
                        )}
                        {children}
                        {icon && iconPosition === "right" && (
                            <span className="ml-2">{icon}</span>
                        )}
                    </>
                )}
            </UIButton>
        );
    }
);

Button.displayName = "Button"; 