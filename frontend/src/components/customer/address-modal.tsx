import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";

const addressSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    address1: z.string().min(5, "Address line 1 must be at least 5 characters").max(100, "Address line 1 cannot exceed 100 characters"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Pincode must be 6 digits").max(6, "Pincode must be 6 digits"),
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, "Please provide a valid Indian phone number (10 digits starting with 6-9)"),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddressFormValues) => Promise<void>;
}

const AddressModal = ({ isOpen, onClose, onSubmit }: AddressModalProps) => {

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            name: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            pincode: "",
            phone: "",
        },
    });

    const handleSubmit = async (data: AddressFormValues) => {
        try {
            await onSubmit(data);
            form.reset();
            onClose();
        } catch (error) {
            // Don't reset form or close modal if there's an error
            console.error('Error submitting address:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        Add New Address
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter name for this address"
                                            className="bg-[#99BCDDB5]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Address Line 1
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter address line 1"
                                            className="bg-[#99BCDDB5]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address2"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Address Line 2 (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter address line 2"
                                            className="bg-[#99BCDDB5]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            City
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter city"
                                                className="bg-[#99BCDDB5]"
                                                {...field}
                                            />
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
                                        <FormLabel>
                                            State
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter state"
                                                className="bg-[#99BCDDB5]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pincode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Pincode
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter pincode"
                                                className="bg-[#99BCDDB5]"
                                                maxLength={6}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Phone Number
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter phone number"
                                                className="bg-[#99BCDDB5]"
                                                maxLength={10}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    type="submit"
                                    variant="customer"
                                >
                                    Add Address
                                </Button>
                            </motion.div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddressModal; 