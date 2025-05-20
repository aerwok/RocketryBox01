import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReturnOrderInput, returnOrderSchema } from "@/lib/validations/order-actions";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReturnOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

const returnReasons = [
    "Damaged Product",
    "Wrong Product Delivered",
    "Product Not As Described",
    "Missing Parts/Accessories",
    "Defective Product",
    "Other"
];

const ReturnOrderModal = ({ isOpen, onClose, orderId }: ReturnOrderModalProps) => {
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const form = useForm<ReturnOrderInput>({
        resolver: zodResolver(returnOrderSchema),
        defaultValues: {
            orderId,
            returnReason: "",
            returnType: "REFUND",
            description: "",
            images: [],
        },
    });

    const onSubmit = async (data: ReturnOrderInput) => {
        try {
            console.log("Return order data:", data);
            // Here you would typically send the data to your API
            toast.success("Return request submitted successfully");
            onClose();
        } catch (error) {
            console.error("Error submitting return request:", error);
            toast.error("Failed to submit return request");
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const imageUrls = files.map(file => URL.createObjectURL(file));
            setUploadedImages(prev => [...prev, ...imageUrls]);
            form.setValue("images", [...uploadedImages, ...imageUrls]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg">
                        Return Order #{orderId}
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="returnReason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Return Reason *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select return reason" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {returnReasons.map((reason) => (
                                                <SelectItem key={reason} value={reason}>
                                                    {reason}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="returnType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Return Type *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select return type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="REFUND">Refund</SelectItem>
                                            <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Additional Details
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide additional details about the return"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div>
                            <FormLabel>
                                Upload Images (Optional)
                            </FormLabel>
                            <div className="mt-2 flex items-center gap-2">
                                <label
                                    htmlFor="image-upload"
                                    className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-gray-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">Upload</span>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                            {uploadedImages.length > 0 && (
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    {uploadedImages.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`Uploaded ${index + 1}`}
                                                className="h-20 w-20 object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                                onClick={() => {
                                                    const newImages = [...uploadedImages];
                                                    newImages.splice(index, 1);
                                                    setUploadedImages(newImages);
                                                    form.setValue("images", newImages);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

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
                                Submit Return
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ReturnOrderModal; 