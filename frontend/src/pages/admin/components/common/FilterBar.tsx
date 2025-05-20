import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export interface FilterOption {
    label: string;
    value: string;
}

interface FilterBarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    statusOptions?: FilterOption[];
    selectedStatus?: string;
    onStatusChange?: (value: string) => void;
    dateRange?: DateRange;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    onClearFilters?: () => void;
    className?: string;
}

export const FilterBar = ({
    searchPlaceholder = "Search...",
    searchValue,
    onSearchChange,
    statusOptions,
    selectedStatus,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    onClearFilters,
    className
}: FilterBarProps) => {
    const hasActiveFilters = Boolean(
        searchValue ||
        selectedStatus ||
        dateRange?.from ||
        dateRange?.to
    );

    return (
        <div className={cn("flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg", className)}>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {statusOptions && (
                <Select
                    value={selectedStatus}
                    onValueChange={onStatusChange}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <DateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                className="w-[300px]"
            />

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}; 