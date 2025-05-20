import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { type CreateOrderInput } from "@/lib/validations/order";
import { Button } from "@/components/ui/button";
import { ChevronsUpDownIcon} from "lucide-react";
import { useState } from "react";

interface CourierRate {
    courier: string;
    image: string;
    mode: string;
    shipping: number;
    gst: number;
    total: number;
}

type SortField = "courier" | "mode" | "shipping" | "gst" | "total";
type SortOrder = "asc" | "desc";

interface CourierRatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (courierType: string) => void;
}

const courierRates: CourierRate[] = [
    {
        courier: "BLUE DART",
        image: "/images/customer/courier1.png",
        mode: "air-0.50kg",
        shipping: 111,
        gst: 19.98,
        total: 130.98
    },
    {
        courier: "DELHIVERY",
        image: "/images/customer/courier2.png",
        mode: "surface-0.50kg",
        shipping: 95,
        gst: 17.1,
        total: 112.1
    },
    {
        courier: "DTDC",
        image: "/images/customer/courier3.png",
        mode: "surface-0.50kg",
        shipping: 78,
        gst: 14.04,
        total: 92.04
    },
    {
        courier: "ECOM EXPRESS",
        image: "/images/customer/courier4.png",
        mode: "surface-0.50kg",
        shipping: 80,
        gst: 14.4,
        total: 94.4
    },
    {
        courier: "EKART",
        image: "/images/customer/courier5.png",
        mode: "surface-0.50kg",
        shipping: 63,
        gst: 11.34,
        total: 74.34
    },
    {
        courier: "EXPRESS BEES",
        image: "/images/customer/courier6.png",
        mode: "surface-0.50kg",
        shipping: 100,
        gst: 18,
        total: 118
    }
];

const CourierRatesModal = ({ isOpen, onClose, onSelect }: CourierRatesModalProps) => {

    const form = useFormContext<CreateOrderInput>();

    const [sortField, setSortField] = useState<SortField>("total");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const sortedRates = [...courierRates].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === "string" && typeof bValue === "string") {
            return sortOrder === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        return sortOrder === "asc"
            ? Number(aValue) - Number(bValue)
            : Number(bValue) - Number(aValue);
    });

    const handleShipSelected = () => {
        const selectedCourier = form.watch("courierType");
        if (selectedCourier) {
            if (onSelect) {
                onSelect(selectedCourier);
                form.clearErrors("courierType");
            } else {
                onClose();
            }
        } else {
            form.setError("courierType", {
                type: "manual",
                message: "Please select a courier before continuing"
            });
        }
    };

    const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
        <th
            className="p-3 text-left font-medium cursor-pointer group"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-2">
                {label}
                <ChevronsUpDownIcon
                    className={`size-4 transition-colors ${sortField === field
                        ? "text-white"
                        : "text-white/50 group-hover:text-white"
                        }`}
                />
            </div>
        </th>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>
                        Shippping Options
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <FormField
                        control={form.control}
                        name="courierType"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="space-y-2"
                                    >
                                        <div className="rounded-lg border overflow-auto md:overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-main text-white text-sm">
                                                    <tr>
                                                        <SortableHeader field="courier" label="Courier" />
                                                        <SortableHeader field="mode" label="Mode" />
                                                        <SortableHeader field="shipping" label="Shipping (₹)" />
                                                        <SortableHeader field="gst" label="GST (18%)" />
                                                        <SortableHeader field="total" label="Total (₹)" />
                                                        <th className="p-3 text-left font-medium">
                                                            #
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedRates.map((rate, index) => (
                                                        <motion.tr
                                                            key={index}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="border-t hover:bg-muted/50"
                                                        >
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-3">
                                                                    <img
                                                                        src={rate.image}
                                                                        alt={rate.courier}
                                                                        className="h-8 w-auto object-contain"
                                                                    />
                                                                    <span className="sr-only">
                                                                        {rate.courier}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                {rate.mode}
                                                            </td>
                                                            <td className="p-3 text-left pl-4">
                                                                ₹{rate.shipping}
                                                            </td>
                                                            <td className="p-3 text-left pl-4">
                                                                ₹{rate.gst}
                                                            </td>
                                                            <td className="p-3 text-left pl-4 font-medium">
                                                                ₹{rate.total}
                                                            </td>
                                                            <td className="p-3 text-left">
                                                                <FormControl>
                                                                    <RadioGroupItem
                                                                        value={rate.courier}
                                                                        className="mt-1"
                                                                    />
                                                                </FormControl>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        variant="customer"
                        onClick={handleShipSelected}
                        disabled={!form.watch("courierType")}
                    >
                        Ship Selected
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CourierRatesModal; 