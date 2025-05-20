import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorState = ({ message, onRetry, className }: ErrorStateProps) => {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[200px] p-4", className)}>
            <AlertCircle className="w-8 h-8 text-destructive mb-4" />
            <p className="text-muted-foreground text-center mb-4">{message}</p>
            {onRetry && (
                <Button
                    variant="outline"
                    onClick={onRetry}
                    className="mt-2"
                >
                    Try Again
                </Button>
            )}
        </div>
    );
}; 