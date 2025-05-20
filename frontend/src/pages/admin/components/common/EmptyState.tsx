import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState = ({
    title,
    description = "No data available",
    actionLabel,
    onAction,
    className
}: EmptyStateProps) => {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[200px] p-4 text-center", className)}>
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            {actionLabel && onAction && (
                <Button
                    variant="outline"
                    onClick={onAction}
                    className="mt-2"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}; 