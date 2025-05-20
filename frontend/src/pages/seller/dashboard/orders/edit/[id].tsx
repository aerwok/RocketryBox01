import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Plus, Minus } from "lucide-react";
import { ServiceFactory } from "@/services/service-factory";

interface OrderItem {
    sku: string;
    name: string;
    quantity: number;
    weight: number;
    price: number;
}

interface OrderData {
    orderId: string;
    chanel: string;
    payment: string;
    customer: string;
    contact: string;
    email?: string;
    address?: {
        line1: string;
        line2?: string;
        landmark?: string;
        city: string;
        state: string;
    };
    pincode: string;
    items: OrderItem[];
    weight: string;
    amount: string;
    shippingCharge?: number;
    codCharge?: number;
    taxAmount?: number;
    discount?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
}

interface OrderFormData {
    orderId: string;
    orderCreationType: "Single" | "Multiple";
    shipmentType: "Forward" | "Reverse";
    paymentType: "COD" | "PAID";
    shippingDetails: {
        fullName: string;
        contactNumber: string;
        emailAddress?: string;
        addressLine1: string;
        addressLine2?: string;
        landmark?: string;
        pincode: string;
        city: string;
        state: string;
    };
    items: OrderItem[];
    shippingCharge: number;
    codCharge: number;
    taxAmount: number;
    discount: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
        weight: number;
    };
    totalAmount: number;
}

const EditOrderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<OrderItem[]>([
        { sku: "", name: "", quantity: 1, weight: 0, price: 0 }
    ]);

    const formSchema = z.object({
        orderId: z.string().min(1, "Order ID is required"),
        orderCreationType: z.enum(["Single", "Multiple"]),
        shipmentType: z.enum(["Forward", "Reverse"]),
        paymentType: z.enum(["COD", "PAID"]),
        shippingDetails: z.object({
            fullName: z.string().min(1, "Full name is required"),
            contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
            emailAddress: z.string().email().optional(),
            addressLine1: z.string().min(1, "Address line 1 is required"),
            addressLine2: z.string().optional(),
            landmark: z.string().optional(),
            pincode: z.string().min(6, "Pincode must be 6 digits"),
            city: z.string().min(1, "City is required"),
            state: z.string().min(1, "State is required")
        }),
        items: z.array(z.object({
            sku: z.string().min(1, "SKU is required"),
            name: z.string().min(1, "Item name is required"),
            quantity: z.number().min(1, "Quantity must be at least 1"),
            weight: z.number().min(0, "Weight must be non-negative"),
            price: z.number().min(0, "Price must be non-negative")
        })),
        shippingCharge: z.number().min(0),
        codCharge: z.number().min(0),
        taxAmount: z.number().min(0),
        discount: z.number().min(0),
        dimensions: z.object({
            length: z.number().min(0),
            width: z.number().min(0),
            height: z.number().min(0),
            weight: z.number().min(0)
        }),
        totalAmount: z.number().min(0)
    });

    const form = useForm<OrderFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            orderId: id || "",
            orderCreationType: "Single",
            shipmentType: "Forward",
            paymentType: "PAID",
            shippingDetails: {
                fullName: "",
                contactNumber: "",
                emailAddress: "",
                addressLine1: "",
                addressLine2: "",
                landmark: "",
                pincode: "",
                city: "",
                state: ""
            },
            items: items,
            shippingCharge: 0,
            codCharge: 0,
            taxAmount: 0,
            discount: 0,
            dimensions: {
                length: 0,
                width: 0,
                height: 0,
                weight: 0
            },
            totalAmount: 0
        }
    });

    // Fetch and populate order data
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!id) return;
            
            try {
                setIsLoading(true);
                const response = await ServiceFactory.seller.order.getDetails(id);
                
                if (!response.success) {
                    throw new Error(response.message || 'Failed to fetch order details');
                }

                const orderData = response.data as OrderData;
                const orderItems: OrderItem[] = orderData.items.map((item: OrderItem) => ({
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    weight: parseFloat(orderData.weight),
                    price: item.price
                }));

                setItems(orderItems);

                form.reset({
                    orderId: orderData.orderId,
                    orderCreationType: orderData.chanel === "MANUAL" ? "Single" : "Multiple",
                    shipmentType: "Forward",
                    paymentType: orderData.payment === "COD" ? "COD" : "PAID",
                    shippingDetails: {
                        fullName: orderData.customer,
                        contactNumber: orderData.contact,
                        emailAddress: orderData.email || "",
                        addressLine1: orderData.address?.line1 || "",
                        addressLine2: orderData.address?.line2 || "",
                        landmark: orderData.address?.landmark || "",
                        pincode: orderData.pincode || "",
                        city: orderData.address?.city || "",
                        state: orderData.address?.state || ""
                    },
                    items: orderItems,
                    shippingCharge: orderData.shippingCharge || 0,
                    codCharge: orderData.payment === "COD" ? (orderData.codCharge || 50) : 0,
                    taxAmount: orderData.taxAmount || 0,
                    discount: orderData.discount || 0,
                    dimensions: {
                        length: orderData.dimensions?.length || 0,
                        width: orderData.dimensions?.width || 0,
                        height: orderData.dimensions?.height || 0,
                        weight: parseFloat(orderData.weight) || 0
                    },
                    totalAmount: parseFloat(orderData.amount) || 0
                });
            } catch (error) {
                console.error('Error fetching order details:', error);
                toast.error('Failed to fetch order details');
                navigate("/seller/dashboard/orders");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id, form, navigate]);

    const addItem = () => {
        const newItems = [...items, { sku: "", name: "", quantity: 1, weight: 0, price: 0 }];
        setItems(newItems);
        form.setValue('items', newItems);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        form.setValue('items', newItems);
    };

    const onSubmit = async () => {
        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.order.updateStatus(id!, "processing");

            if (!response.success) {
                throw new Error(response.message || 'Failed to update order');
            }

            toast.success("Order updated successfully");
            navigate("/seller/dashboard/orders");
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error("Failed to update order");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate total amount based on items and charges
    const calculateTotalAmount = () => {
        const itemsTotal = form.getValues('items').reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCharge = form.getValues('shippingCharge') || 0;
        const codCharge = form.getValues('codCharge') || 0;
        const taxAmount = form.getValues('taxAmount') || 0;
        const discount = form.getValues('discount') || 0;

        const total = itemsTotal + shippingCharge + codCharge + taxAmount - discount;
        form.setValue('totalAmount', total);
    };

    // Calculate total weight based on items
    const calculateTotalWeight = () => {
        const totalWeight = form.getValues('items').reduce((sum, item) => sum + (item.weight * item.quantity), 0);
        form.setValue('dimensions.weight', totalWeight);
    };

    // Update calculations when items change
    useEffect(() => {
        if (!isLoading) {
            calculateTotalAmount();
            calculateTotalWeight();
        }
    }, [items, form.watch('shippingCharge'), form.watch('codCharge'), form.watch('taxAmount'), form.watch('discount')]);

    // Handle payment type change
    const handlePaymentTypeChange = (value: "COD" | "PAID") => {
        form.setValue('paymentType', value);
        if (value === "COD") {
            // Set default COD charge if needed
            const codCharge = form.getValues('codCharge') || 0;
            if (codCharge === 0) {
                form.setValue('codCharge', 50); // Example default COD charge
            }
        } else {
            form.setValue('codCharge', 0);
        }
        calculateTotalAmount();
    };

    // Handle item field change
    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
        form.setValue(`items.${index}.${field}`, value);
        
        if (field === 'quantity' || field === 'price' || field === 'weight') {
            calculateTotalAmount();
            calculateTotalWeight();
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2">Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Edit Order</h1>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => navigate("/seller/dashboard/orders")}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)}>Save</Button>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="orderId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order Number*</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="orderCreationType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order Creation Type</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            value={field.value === "Single" ? "Single (Manual) Order" : "Multiple (Bulk) Order"}
                                            disabled
                                            className="bg-gray-100"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shipmentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shipment Type*</FormLabel>
                                    <Select onValueChange={(value: "Forward" | "Reverse") => {
                                        form.setValue('shipmentType', value);
                                    }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Shipment Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Forward">Forward Shipment</SelectItem>
                                            <SelectItem value="Reverse">Reverse Shipment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="paymentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Type*</FormLabel>
                                    <Select onValueChange={handlePaymentTypeChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Payment Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="COD">COD</SelectItem>
                                            <SelectItem value="PAID">PAID</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="border rounded-lg p-6 space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-lg font-semibold flex-grow">Shipping Details</h2>
                            <div className="flex items-center gap-2">
                                <Checkbox id="sameAsShipping" />
                                <Label htmlFor="sameAsShipping">Same as shipping address</Label>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="shippingDetails.fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name*</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.contactNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Number*</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.emailAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address (optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.addressLine1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 1*</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.addressLine2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 2</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.landmark"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Landmark (optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.pincode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pincode*</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City*</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingDetails.state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State*</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Order Items</h2>
                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button" 
                                    onClick={addItem} 
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-6 gap-4 items-end">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.sku`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU*</FormLabel>
                                            <FormControl>
                                                <Input {...field} defaultValue={item.sku} placeholder="Autofill if exists" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Name*</FormLabel>
                                            <FormControl>
                                                <Input {...field} defaultValue={item.name} placeholder="Max. 100 Characters" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity*</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    {...field} 
                                                    defaultValue={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.weight`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Total Weight*</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} defaultValue={item.weight} placeholder="Ex. 0.5kg" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`items.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Total Price* (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} defaultValue={item.price} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 mt-8"
                                    onClick={() => removeItem(index)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="shippingCharge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipping Charge</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="codCharge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>COD Charge</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tax Amount</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="discount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="border rounded-lg p-4">
                            <div className="grid grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dimensions.length"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Length* (cm)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dimensions.width"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Width* (cm)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dimensions.height"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Height* (cm)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dimensions.weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Weight* (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="totalAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Amount*</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} readOnly className="bg-gray-100" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => navigate("/seller/dashboard/orders")}>
                            Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default EditOrderPage; 