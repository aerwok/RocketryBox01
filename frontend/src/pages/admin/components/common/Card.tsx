import { Card as UICard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
}

export function Card({
    title,
    description,
    children,
    footer,
    className,
    headerClassName,
    contentClassName,
    footerClassName
}: CardProps) {
    return (
        <UICard className={cn("bg-card", className)}>
            {(title || description) && (
                <CardHeader className={cn("space-y-1", headerClassName)}>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent className={cn("p-6", contentClassName)}>
                {children}
            </CardContent>
            {footer && (
                <CardFooter className={cn("p-6 pt-0", footerClassName)}>
                    {footer}
                </CardFooter>
            )}
        </UICard>
    );
} 