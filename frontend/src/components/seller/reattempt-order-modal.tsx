import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReattemptOrderInput, reattemptOrderSchema } from "@/lib/validations/order-actions";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReattemptOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentAddress?: {
        fullName?: string;
        contactNumber?: string;
        addressLine1?: string;
        addressLine2?: string;
        landmark?: string;
        pincode?: string;
        city?: string;
        state?: string;
    } | null;
}


const ReattemptOrderModal = ({ isOpen, onClose, orderId, currentAddress }: ReattemptOrderModalProps) => {
    const form = useForm<ReattemptOrderInput>({
        resolver: zodResolver(reattemptOrderSchema),
        defaultValues: {
            orderId,
            fullName: currentAddress?.fullName || "",
            contactNumber: currentAddress?.contactNumber || "",
            addressLine1: currentAddress?.addressLine1 || "",
            addressLine2: currentAddress?.addressLine2 || "",
            landmark: currentAddress?.landmark || "",
            pincode: currentAddress?.pincode || "",
            city: currentAddress?.city || "",
            state: currentAddress?.state || "",
            reattemptReason: "",
        },
    });

    const onSubmit = async (data: ReattemptOrderInput) => {
        try {
            console.log("Reattempt order data:", data);
            toast.success("Reattempt request submitted successfully");
            onClose();
        } catch (error) {
            console.error("Error submitting reattempt request:", error);
            toast.error("Failed to submit reattempt request");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg">
                        Reattempt Delivery for Order #{orderId}
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                Full Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Full Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="contactNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                Contact Number *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contact Number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium">
                                Delivery Address
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="addressLine1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                Address Line 1 *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Address Line 1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="addressLine2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                Address Line 2
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Address Line 2" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="landmark"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">
                                                Landmark
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Landmark" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="pincode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">
                                                    Pincode *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Pincode" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">
                                                    City *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="City" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">
                                                    State *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="State" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="reattemptReason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Reason for Reattempt *
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide reason for reattempt"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Submit Reattempt
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ReattemptOrderModal; 