import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard as DashboardCardType } from "../../types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
    card: DashboardCardType;
    className?: string;
}

export const DashboardCard = ({ card, className }: DashboardCardProps) => {
    return (
        <Card className={cn("bg-neutral-200", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg font-medium">
                    {card.icon && <span className={cn("text-xl", card.color)}>{card.icon}</span>}
                    {card.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl lg:text-3xl font-bold">
                    {card.value}
                </p>
                <p className="text-main text-sm mt-1">
                    {card.change}
                </p>
            </CardContent>
        </Card>
    );
}; 