import {
    Table as UITable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Column<T> {
    key: keyof T;
    header: string;
    render?: (item: T) => ReactNode;
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    className?: string;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

export function Table<T>({
    data,
    columns,
    className,
    emptyMessage = "No data available",
    onRowClick
}: TableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={cn("rounded-md border", className)}>
            <UITable>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead
                                key={String(column.key)}
                                className={column.className}
                            >
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow
                            key={index}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                onRowClick && "cursor-pointer hover:bg-muted/50"
                            )}
                        >
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.key)}
                                    className={column.className}
                                >
                                    {column.render
                                        ? column.render(item)
                                        : String(item[column.key])}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </UITable>
        </div>
    );
} 