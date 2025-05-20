import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormMessage } from "@/components/ui/form";

interface FormFieldProps {
    label: string;
    error?: string;
    className?: string;
    children: ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
    ({ label, error, className, children }, ref) => {
        return (
            <div ref={ref} className={cn("space-y-2", className)}>
                <Label>{label}</Label>
                {children}
                {error && <FormMessage>{error}</FormMessage>}
            </div>
        );
    }
);

FormField.displayName = "FormField";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <FormField label={label} error={error}>
                <Input ref={ref} className={className} {...props} />
            </FormField>
        );
    }
);

FormInput.displayName = "FormInput";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <FormField label={label} error={error}>
                <Textarea ref={ref} className={className} {...props} />
            </FormField>
        );
    }
);

FormTextarea.displayName = "FormTextarea";

interface FormSelectProps {
    label: string;
    value?: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
    error?: string;
    className?: string;
}

export const FormSelect = forwardRef<HTMLDivElement, FormSelectProps>(
    ({ label, value, onValueChange, options, placeholder = "Select an option", error, className }) => {
        return (
            <FormField label={label} error={error} className={className}>
                <Select value={value} onValueChange={onValueChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        );
    }
);

FormSelect.displayName = "FormSelect";

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <FormField label={label} error={error}>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        ref={ref}
                        className={cn("h-4 w-4 rounded border-gray-300", className)}
                        {...props}
                    />
                    <Label className="text-sm font-normal">{label}</Label>
                </div>
            </FormField>
        );
    }
);

FormCheckbox.displayName = "FormCheckbox"; 