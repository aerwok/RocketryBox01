import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { ReactElement } from "react";

interface ToastOptions {
    title?: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

const colors = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500"
};

const createToastContent = (Icon: typeof CheckCircle2, color: string, title?: string, description?: string): ReactElement => (
    <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${color} mt-0.5`} />
        <div>
            {title && <p className="font-medium">{title}</p>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    </div>
);

export const toast = {
    success: (options: ToastOptions) => {
        const { title, description, duration, action } = options;
        const Icon = icons.success;

        return sonnerToast.custom(
            () => createToastContent(Icon, colors.success, title, description),
            {
                duration,
                action: action ? {
                    label: action.label,
                    onClick: action.onClick
                } : undefined
            }
        );
    },

    error: (options: ToastOptions) => {
        const { title, description, duration, action } = options;
        const Icon = icons.error;

        return sonnerToast.custom(
            () => createToastContent(Icon, colors.error, title, description),
            {
                duration,
                action: action ? {
                    label: action.label,
                    onClick: action.onClick
                } : undefined
            }
        );
    },

    warning: (options: ToastOptions) => {
        const { title, description, duration, action } = options;
        const Icon = icons.warning;

        return sonnerToast.custom(
            () => createToastContent(Icon, colors.warning, title, description),
            {
                duration,
                action: action ? {
                    label: action.label,
                    onClick: action.onClick
                } : undefined
            }
        );
    },

    info: (options: ToastOptions) => {
        const { title, description, duration, action } = options;
        const Icon = icons.info;

        return sonnerToast.custom(
            () => createToastContent(Icon, colors.info, title, description),
            {
                duration,
                action: action ? {
                    label: action.label,
                    onClick: action.onClick
                } : undefined
            }
        );
    }
}; 