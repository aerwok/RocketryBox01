import { Loader2 } from "lucide-react";

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export const LoadingState = ({ message = "Loading...", className = "" }: LoadingStateProps) => {
    return (
        <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}; 