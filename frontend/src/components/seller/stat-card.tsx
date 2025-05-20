import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface StatCardProps {
    title: string;
    subtitle?: string;
    value: string | number;
    todayValue?: string | number;
    icon: LucideIcon;
    href: string;
    additionalValue?: {
        label: string;
        value: string | number;
    };
    iconClassName?: string;
}

const StatCard = ({
    title,
    subtitle,
    value,
    todayValue,
    icon: Icon,
    href,
    additionalValue,
    iconClassName
}: StatCardProps) => {
    return (
        <Card className="px-4 py-3 bg-[#BCDDFF] h-[140px] flex flex-col justify-between relative group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-medium">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={cn(
                    "rounded-full p-2 bg-white/20",
                    iconClassName
                )}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div>
                {todayValue !== undefined && (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            Today's total:
                        </p>
                        <p className="text-2xl font-semibold">
                            {todayValue}
                        </p>
                    </div>
                )}
                {additionalValue && (
                    <div className="flex flex-col">
                        <p className="text-sm">
                            {additionalValue.label}:
                        </p>
                        <p className="text-2xl font-semibold">
                            {additionalValue.value}
                        </p>
                    </div>
                )}
                {!todayValue && !additionalValue && (
                    <p className="text-2xl font-semibold">
                        {value}
                    </p>
                )}
            </div>
            <Link
                to={href}
                className="absolute bottom-3 right-4 text-sm font-medium text-blue-700 hover:underline"
            >
                View
            </Link>
        </Card>
    );
};

export default StatCard; 