import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NewOrderInput, newOrderSchema } from "@/lib/validations/new-order";
import { zodResolver } from "@hookform/resolvers/zod";
import { BoxesIcon, Info, MinusIcon, PlusIcon, Save, Truck, Package, CreditCard, MapPin, Calculator, Printer, FileText, RefreshCw, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { ShippingOptionsModal } from "@/components/seller/shipping-options-modal";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ServiceFactory } from "@/services/service-factory";
import { generateBusinessOrderNumber } from "@/utils/orderNumberGenerator";

const SellerNewOrderPage = () => {
    const navigate = useNavigate();
    const [sameAsShipping, setSameAsShipping] = useState<boolean>(false);
    const [shippingModalOpen, setShippingModalOpen] = useState<boolean>(false);
    const [calculatedWeight, setCalculatedWeight] = useState<number>(0);
    const [volumetricWeight, setVolumetricWeight] = useState<number>(0);
    const [actualWeight, setActualWeight] = useState<number>(0);
    const [selectedShipping, setSelectedShipping] = useState<{
        courier: string;
        mode: string;
        charges: {
            shipping: number;
            cod: number;
            gst: number;
            total: number;
        };
    } | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [items, setItems] = useState<Array<{
        sku: string;
        itemName: string;
        quantity: number;
        itemWeight: number;
        itemPrice: number;
    }>>([]);
    
    // Order number generation states
    const [isGeneratingOrderNumber, setIsGeneratingOrderNumber] = useState<boolean>(false);

    const form = useForm<NewOrderInput>({
        resolver: zodResolver(newOrderSchema),
        mode: "onChange",
        criteriaMode: "all",
        defaultValues: {
            orderNumber: "",
            shipmentType: "FORWARD",
            paymentType: "COD",
            fullName: "",
            contactNumber: "",
            email: "",
            addressLine1: "",
            addressLine2: "",
            landmark: "",
            pincode: "",
            city: "",
            state: "",
            items: [],
            sku: "",
            itemName: "",
            quantity: undefined,
            itemWeight: undefined,
            itemPrice: undefined,
            collectibleAmount: undefined,
            shippingCharge: 0,
            codCharge: 0,
            taxAmount: 0,
            discount: 0,
            length: undefined,
            width: undefined,
            height: undefined,
            weight: undefined,
            totalAmount: 0,
            courier: "",
            warehouse: "",
            rtoWarehouse: "",
            shippingMode: "",
        },
    });

    // Auto-generate order number on component mount
    useEffect(() => {
        generateNewOrderNumber();
    }, []);

    /**
     * Generate a new order number automatically
     */
    const generateNewOrderNumber = async () => {
        setIsGeneratingOrderNumber(true);
        
        try {
            // Simulate a small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get seller ID from context/storage (fallback to random if not available)
            const sellerId = localStorage.getItem('seller_id') || Math.random().toString(36).substr(2, 8);
            
            // Generate professional order number
            const newOrderNumber = generateBusinessOrderNumber(sellerId);
            
            // Set the order number in the form
            form.setValue('orderNumber', newOrderNumber, { 
                shouldValidate: true,
                shouldDirty: false // Don't mark as dirty since it's auto-generated
            });
            
            toast.success(`Order number generated: ${newOrderNumber}`, {
                description: "Professional order number generated automatically",
                duration: 3000,
            });
            
        } catch (error) {
            console.error('Error generating order number:', error);
            toast.error('Failed to generate order number. Please try again.');
        } finally {
            setIsGeneratingOrderNumber(false);
        }
    };

    /**
     * Handle manual order number regeneration
     */
    const handleRegenerateOrderNumber = () => {
        generateNewOrderNumber();
    };

    // Calculate volumetric weight when dimensions or actual weight change
    useEffect(() => {
        const length = form.getValues('length');
        const width = form.getValues('width');
        const height = form.getValues('height');
        const quantity = Number(form.getValues('quantity')) || 1;
        const itemWeight = form.getValues('itemWeight');

        // Calculate volumetric weight only if all dimensions are provided
        if (length && width && height) {
            const newVolumetricWeight = ((length * width * height) / 5000) * quantity;
            setVolumetricWeight(newVolumetricWeight);
        } else {
            setVolumetricWeight(0);
        }

        // Set actual weight
        const newActualWeight = (itemWeight || 0) * quantity;
        setActualWeight(newActualWeight);

        // Use the higher weight for shipping calculations
        const finalWeight = Math.max(
            volumetricWeight || 0,
            newActualWeight || 0
        );
        setCalculatedWeight(finalWeight);
        form.setValue('weight', finalWeight);

    }, [form.watch(['length', 'width', 'height', 'quantity', 'itemWeight'])]);

    const onSubmit = async (data: NewOrderInput) => {
        try {
            if (data.items.length === 0) {
                toast.error("Please add at least one item");
                return;
            }

            // Transform frontend form data to backend expected structure
            // For now, take the first item (can be extended for multiple items later)
            const firstItem = data.items[0];
            const totalItemPrice = data.items.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
            
            // Prepare order data in backend expected format
            const orderData = {
                orderId: data.orderNumber,
                customer: {
                    name: data.fullName,
                    phone: data.contactNumber,
                    email: data.email || '', // Provide default if empty
                    address: {
                        street: data.addressLine2 ? `${data.addressLine1}, ${data.addressLine2}` : data.addressLine1,
                        city: data.city,
                        state: data.state,
                        pincode: data.pincode,
                        country: 'India'
                    }
                },
                product: {
                    name: firstItem.itemName,
                    sku: firstItem.sku || '',
                    quantity: firstItem.quantity,
                    price: firstItem.itemPrice,
                    weight: firstItem.itemWeight.toString(),
                    dimensions: {
                        length: data.length || 10,
                        width: data.width || 10,
                        height: data.height || 10
                    }
                },
                payment: {
                    method: data.paymentType === 'COD' ? 'COD' as const : 'Prepaid' as const,
                    amount: totalItemPrice.toString(),
                    codCharge: data.paymentType === 'COD' ? (data.codCharge || 0).toString() : '0',
                    shippingCharge: (data.shippingCharge || 0).toString(),
                    gst: (data.taxAmount || 0).toString(),
                    total: (data.totalAmount || totalItemPrice).toString()
                },
                channel: 'MANUAL'
            };

            console.log('Creating order with data:', orderData);
            
            const response = await ServiceFactory.seller.order.createOrder(orderData);

            if (!response.success) {
                throw new Error(response.message || 'Failed to create order');
            }

            const createdOrder = response.data.order;
            setOrderId(createdOrder._id);
            toast.success(`Order created successfully with ID: ${createdOrder.orderId}`);
            
            // Optionally navigate to orders page after successful creation
            // navigate('/seller/dashboard/orders');
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create order");
        }
    };

    const handleCheckRates = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        // Get all form values
        const formValues = form.getValues();
        
        // Extract and validate required fields
        const fullName = formValues.fullName;
        const contactNumber = formValues.contactNumber;
        const addressLine1 = formValues.addressLine1;
        const pincode = formValues.pincode;
        const city = formValues.city;
        const state = formValues.state;

        // Validate delivery address details
        if (!fullName || !contactNumber || !addressLine1 || !pincode || !city || !state) {
            toast.error("Please fill in all delivery address details");
            return;
        }

        // Check for items - either in the items array or current form fields
        let totalWeight = 0;
        let totalPrice = 0;
        let itemSource = '';

        if (items.length > 0) {
            // Preferred workflow: Calculate from added items
            totalWeight = items.reduce((sum, item) => sum + (item.itemWeight * item.quantity), 0);
            totalPrice = items.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
            itemSource = `${items.length} added item(s)`;
        } else {
            // Alternative workflow: Use current form fields
            const itemWeightValue = formValues.itemWeight;
            const itemPriceValue = formValues.itemPrice;
            const quantity = formValues.quantity || 1;
            
            // Validate current form fields
            if (!itemWeightValue || isNaN(Number(itemWeightValue)) || Number(itemWeightValue) <= 0) {
                toast.error("Please add items to the list or enter valid item weight (greater than 0)");
                return;
            }

            if (!itemPriceValue || isNaN(Number(itemPriceValue)) || Number(itemPriceValue) <= 0) {
                toast.error("Please add items to the list or enter valid item price (greater than 0)");
                return;
            }

            totalWeight = Number(itemWeightValue) * quantity;
            totalPrice = Number(itemPriceValue) * quantity;
            itemSource = 'current form fields';
        }
        
        // Get package dimensions
        const length = Number(formValues.length) || 10; // Default dimensions if not provided
        const width = Number(formValues.width) || 10;
        const height = Number(formValues.height) || 10;

        // Debug logging
        console.log('Form values for shipping rate calculation:', {
            itemSource,
            totalWeight,
            totalPrice,
            itemsCount: items.length,
            dimensions: { length, width, height },
            address: { fullName, contactNumber, addressLine1, pincode, city, state }
        });

        try {
            const result = await form.trigger(['pincode', 'city', 'state']);

            if (result) {
                // Use the correct method with proper parameters
                const response = await ServiceFactory.shipping.calculateRatesFromPincodes({
                    fromPincode: "110001", // Default pickup pincode (can be made configurable)
                    toPincode: pincode,
                    weight: totalWeight,
                    length: length,
                    width: width,
                    height: height,
                    mode: 'Surface',
                    orderType: formValues.paymentType === 'COD' ? 'cod' : 'prepaid',
                    codCollectableAmount: formValues.paymentType === 'COD' ? totalPrice : 0,
                    includeRTO: false
                });

                if (!response.success) {
                    throw new Error(response.message || 'Failed to calculate rates');
                }

                toast.success(`Shipping rates calculated successfully for ${itemSource}!`);
                setShippingModalOpen(true);
            } else {
                const errors = form.formState.errors;
                const errorFields = Object.keys(errors);

                if (errorFields.length > 0) {
                    const firstError = errors[errorFields[0] as keyof typeof errors];
                    const errorMessage = firstError?.message ? String(firstError.message) : "Please fill delivery address details";
                    toast.error(errorMessage);
                } else {
                    toast.error("Please fill delivery address details");
                }
            }
        } catch (error) {
            console.error("Rate calculation error:", error);
            toast.error("Failed to calculate shipping rates. Please try again.");
        }
    };

    const handleShipSelected = (options: {
        courier: string;
        mode: string;
        charges: {
            shippingCharge: number;
            codCharge: number;
            gst: number;
            total: number;
        };
    }) => {
        setSelectedShipping({
            courier: options.courier,
            mode: options.mode,
            charges: {
                shipping: options.charges.shippingCharge,
                cod: options.charges.codCharge,
                gst: options.charges.gst,
                total: options.charges.total
            }
        });

        // Update form values with the charges
        form.setValue('shippingCharge', options.charges.shippingCharge);
        form.setValue('codCharge', options.charges.codCharge);
        form.setValue('taxAmount', options.charges.gst);
        form.setValue('totalAmount', options.charges.total);

        setShippingModalOpen(false);
    };

    const handleShipOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!selectedShipping) {
            toast.error("Please select shipping rates first");
            return;
        }

        // Validate items - check the items array first, then fall back to current form fields
        let hasValidItems = false;
        let totalItemPrice = 0;
        
        if (items.length > 0) {
            // Check added items
            const invalidItems = items.filter(item => !item.itemPrice || item.itemPrice <= 0);
            if (invalidItems.length > 0) {
                toast.error("Please ensure all added items have valid prices");
                return;
            }
            hasValidItems = true;
            totalItemPrice = items.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
        } else {
            // Check current form fields as fallback
            const itemPrice = form.getValues('itemPrice');
            if (!itemPrice || itemPrice <= 0) {
                toast.error("Please add items to the list or set a valid item price");
                return;
            }
            hasValidItems = true;
            totalItemPrice = itemPrice * (form.getValues('quantity') || 1);
        }

        if (!hasValidItems || totalItemPrice <= 0) {
            toast.error("Please set a valid item price");
            return;
        }

        // Check if order was saved first
        if (!orderId) {
            toast.error("Please save the order first before shipping");
            return;
        }

        try {
            // Use the saved order ID for shipping
            const response = await ServiceFactory.shipping.bookShipment(orderId);

            if (!response.success) {
                throw new Error(response.message || 'Failed to create shipment');
            }

            toast.success(`Order shipped with ${selectedShipping.courier}`);
            navigate('/seller/dashboard/orders');
        } catch (error) {
            console.error("Error creating shipment:", error);
            toast.error("Failed to create shipment");
        }
    };

    const handlePrintInvoice = async () => {
        if (!orderId) {
            toast.error("Please save the order first");
            return;
        }

        try {
            const response = await ServiceFactory.shipping.printInvoice(orderId);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to generate invoice');
            }

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
        }
    };

    const handlePrintLabel = async () => {
        if (!orderId) {
            toast.error("Please save the order first");
            return;
        }

        try {
            const response = await ServiceFactory.shipping.printLabel(orderId);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to generate shipping label');
            }

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `shipping-label-${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Shipping label downloaded successfully");
        } catch (error) {
            console.error("Error downloading shipping label:", error);
            toast.error("Failed to download shipping label");
        }
    };

    const handleAddItem = () => {
        const itemWeight = Number(form.getValues('itemWeight')) || 0;
        const itemPrice = Number(form.getValues('itemPrice')) || 0;
        const itemName = form.getValues('itemName');
        const quantity = Number(form.getValues('quantity')) || 1;
        
        if (!itemName || itemWeight === 0 || itemPrice === 0) {
            toast.error("Please fill in all item details");
            return;
        }

        const newItem = {
            sku: form.getValues('sku') || '',
            itemName: itemName,
            quantity: quantity,
            itemWeight,
            itemPrice
        };
        
        // Update both the items state and form value
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        form.setValue('items', updatedItems);
        
        // Reset item form fields
        form.setValue('sku', '');
        form.setValue('itemName', '');
        form.setValue('quantity', undefined);
        form.setValue('itemWeight', undefined);
        form.setValue('itemPrice', undefined);
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        form.setValue('items', updatedItems);
    };

    return (
        <div className="w-full flex flex-col gap-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between w-full bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">
                        Create New Order
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/seller/dashboard/bulk-orders')}>
                        <BoxesIcon className="w-4 h-4 mr-2" />
                        Bulk Orders Page
                    </Button>
                </div>
            </div>

            {/* Bulk Upload Section */}
            <div className="bg-white border rounded-lg shadow-sm">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <BoxesIcon className="w-5 h-5" />
                        Quick Bulk Upload
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Upload an Excel file to create multiple orders at once. 
                        <span 
                            className="text-purple-600 hover:text-purple-700 cursor-pointer ml-1"
                            onClick={() => navigate('/seller/dashboard/bulk-orders')}
                        >
                            View full bulk orders page →
                        </span>
                    </p>
                </div>
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <Input
                            type="file"
                            accept=".xlsx,.xls"
                            className="flex-1"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Show toast and redirect to bulk orders page for processing
                                    toast.success('File selected! Redirecting to bulk orders page for processing...');
                                    setTimeout(() => {
                                        navigate('/seller/dashboard/bulk-orders');
                                    }, 1000);
                                }
                            }}
                        />
                        <div className="flex gap-2">
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    // Download template functionality
                                    import('@/services/bulkOrder.service').then(({ bulkOrderService }) => {
                                        bulkOrderService.downloadBulkOrderTemplate()
                                            .then(blob => {
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement("a");
                                                link.href = url;
                                                link.download = 'bulk_order_template.xlsx';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                                toast.success('Template downloaded successfully');
                                            })
                                            .catch(error => {
                                                console.error('Download error:', error);
                                                toast.error('Failed to download template');
                                            });
                                    });
                                }}
                            >
                                Download Template
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                        <p>• Upload .xlsx or .xls files (max 5MB)</p>
                        <p>• Download the template to see the required format</p>
                        <p>• For processing and tracking, use the full bulk orders page</p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Order Details Section */}
                    <div className="bg-white border rounded-lg shadow-sm">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Order Details
                            </h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="orderNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                                            Order Number *
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="w-4 h-4 text-gray-400" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">
                                                            Professional order number auto-generated with date and unique sequence. 
                                                            Click regenerate to create a new number.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl className="flex-1">
                                                <div className="relative">
                                                    <Input 
                                                        {...field} 
                                                        placeholder={isGeneratingOrderNumber ? "Generating..." : "Auto-generated order number"}
                                                        readOnly={true}
                                                        disabled={isGeneratingOrderNumber}
                                                        className={`mt-1 bg-gray-50 border-gray-200 ${
                                                            isGeneratingOrderNumber ? 'animate-pulse' : ''
                                                        } pr-8`}
                                                    />
                                                    {isGeneratingOrderNumber && (
                                                        <RefreshCw className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                                                    )}
                                                    {!isGeneratingOrderNumber && (
                                                        <Lock className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </FormControl>
                                            
                                            {/* Regenerate Button */}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={handleRegenerateOrderNumber}
                                                            disabled={isGeneratingOrderNumber}
                                                            className="mt-1 h-10"
                                                        >
                                                            <RefreshCw className={`w-4 h-4 ${isGeneratingOrderNumber ? 'animate-spin' : ''}`} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Generate new order number</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        
                                        <FormDescription className="text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Lock className="w-3 h-3" />
                                                Auto-generated professional format (RB-YYYYMMDD-XXXX)
                                            </span>
                                        </FormDescription>
                                        
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Read-only Order Creation Type field */}
                            <FormItem>
                                <FormLabel className="text-sm font-medium">
                                    Order Creation Type
                                </FormLabel>
                                <FormControl>
                                    <Input 
                                        value="Single (Manual) Order"
                                        disabled
                                        className="mt-1 bg-gray-100"
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">
                                    For multiple orders, use Bulk Order upload
                                </FormDescription>
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="shipmentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">
                                            Shipment Type *
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select shipment type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FORWARD">Forward Shipment</SelectItem>
                                                <SelectItem value="REVERSE">Reverse Shipment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">
                                            Payment Type *
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select payment type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="COD">COD</SelectItem>
                                                <SelectItem value="PAID">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Shipping Details Section */}
                    <div className="bg-white border rounded-lg shadow-sm">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Shipping Details
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="sameAsShipping"
                                        checked={sameAsShipping}
                                        onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
                                    />
                                    <label htmlFor="sameAsShipping" className="text-sm text-gray-600">
                                        Same as shipping address
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Customer Information */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Full Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Full Name" {...field} className="mt-1" />
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
                                            <FormLabel className="text-sm font-medium">
                                                Contact Number *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contact Number" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Email" type="email" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Address Fields */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-6">
                                <FormField
                                    control={form.control}
                                    name="addressLine1"
                                    render={({ field }) => (
                                        <FormItem className="lg:col-span-4">
                                            <FormLabel className="text-sm font-medium">
                                                Address Line 1 *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Address Line 1" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="addressLine2"
                                    render={({ field }) => (
                                        <FormItem className="lg:col-span-4">
                                            <FormLabel className="text-sm font-medium">
                                                Address Line 2
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Address Line 2" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="landmark"
                                    render={({ field }) => (
                                        <FormItem className="lg:col-span-2">
                                            <FormLabel className="text-sm font-medium">
                                                Landmark
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Landmark" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="pincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Pincode *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Pincode" {...field} className="mt-1" />
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
                                            <FormLabel className="text-sm font-medium">
                                                City *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="City" {...field} className="mt-1" />
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
                                            <FormLabel className="text-sm font-medium">
                                                State *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="State" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Item Details Section */}
                    <div className="bg-white border rounded-lg shadow-sm">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Item Details
                            </h2>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Added Items List */}
                            {items.length > 0 && (
                                <div className="border rounded-lg p-4 mb-4">
                                    <h3 className="text-sm font-medium mb-3">Added Items</h3>
                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                <div className="flex-1 grid grid-cols-5 gap-4">
                                                    <span>{item.itemName}</span>
                                                    <span>SKU: {item.sku}</span>
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>Weight: {item.itemWeight}kg</span>
                                                    <span>₹{item.itemPrice}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <MinusIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Item Input Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                SKU
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter SKU" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormDescription className="text-xs text-gray-500">
                                                Autofill if exists
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="itemName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Item Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter item name" {...field} className="mt-1" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Quantity *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter quantity"
                                                    {...field}
                                                    value={field.value === undefined ? '' : field.value}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                        field.onChange(value);
                                                    }}
                                                    className="mt-1"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="itemWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Item Weight (kg) *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Enter item weight"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                        field.onChange(value);
                                                    }}
                                                    className="mt-1"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs text-gray-500">
                                                Weight of a single item in kg
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="itemPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">
                                                Item Price (₹) *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter price"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                        field.onChange(value);
                                                    }}
                                                    className="mt-1"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Replace Add Item Button with Plus/Minus Buttons */}
                            <div className="flex justify-end mt-4 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveItem(items.length - 1)}
                                    disabled={items.length === 0}
                                    className="bg-red-500 text-white hover:bg-red-600"
                                >
                                    <MinusIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddItem}
                                    className="bg-green-500 text-white hover:bg-green-600"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Collectible Amount Section */}
                            {form.watch("paymentType") === "COD" && (
                                <div className="border-t pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="collectibleAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium flex items-center gap-1">
                                                        Collectible Amount (₹)
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs">Amount to be collected from the customer at the time of delivery</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter collectible amount"
                                                            {...field}
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                                            className="mt-1"
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-muted-foreground">
                                                        For COD orders, leave empty to use the item price
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charges and Dimensions Section */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Package Dimensions Section */}
                        <div className="lg:w-[40%] bg-white border rounded-lg shadow-sm">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Package Dimensions
                                </h2>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="length"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Length (cm) *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Enter length"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                            field.onChange(value);
                                                        }}
                                                        className="mt-1"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="width"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Width (cm) *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Enter width"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                            field.onChange(value);
                                                        }}
                                                        className="mt-1"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="height"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium">
                                                    Height (cm) *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="Enter height"
                                                        {...field}
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                            field.onChange(value);
                                                        }}
                                                        className="mt-1"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">Weight Details</Label>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Volumetric Weight:</span>
                                                    <span className="font-medium">{volumetricWeight ? volumetricWeight.toFixed(2) : '-'} {volumetricWeight ? 'kg' : ''}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Item Weight:</span>
                                                    <span className="font-medium">{actualWeight ? actualWeight.toFixed(2) : '-'} {actualWeight ? 'kg' : ''}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <span className="text-sm font-medium text-gray-900">Chargeable Weight:</span>
                                                    <span className="font-semibold text-purple-600">{calculatedWeight ? calculatedWeight.toFixed(2) : '-'} {calculatedWeight ? 'kg' : ''}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Calculator className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    Volumetric weight = (L × W × H) / 5000
                                                </span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="default"
                                                onClick={handleCheckRates}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-2"
                                            >
                                                <Truck className="w-4 h-4 mr-2" />
                                                Check Shipping Rates
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charges Section */}
                        <div className="lg:w-[60%] bg-white border rounded-lg shadow-sm">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Charges
                                </h2>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="shippingCharge"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Shipping Charge</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        disabled
                                                        value={field.value || 0}
                                                    />
                                                </FormControl>
                                                <FormMessage />
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
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        disabled
                                                        value={field.value || 0}
                                                    />
                                                </FormControl>
                                                <FormMessage />
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
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        disabled
                                                        value={field.value || 0}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="totalAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        disabled
                                                        value={field.value || 0}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add read-only Order Creation Type field */}
                    <FormItem>
                        <FormLabel className="text-sm font-medium">
                            Order Creation Type
                        </FormLabel>
                        <FormControl>
                            <Input 
                                value="Single (Manual) Order"
                                disabled
                                className="mt-1 bg-gray-100"
                            />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                            For multiple orders, use Bulk Order upload
                        </FormDescription>
                    </FormItem>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/seller/dashboard/orders')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Order
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={handlePrintInvoice}
                            disabled={!orderId}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Print Invoice
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={handlePrintLabel}
                            disabled={!orderId}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Label
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={handleShipOrder}
                            disabled={!selectedShipping}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Truck className="w-4 h-4 mr-2" />
                            Ship Order
                        </Button>
                    </div>

                    <ShippingOptionsModal
                        open={shippingModalOpen}
                        onOpenChange={(open) => setShippingModalOpen(open)}
                        onSubmit={handleShipSelected}
                        singleOrderId={form.getValues('orderNumber') || 'New Order'}
                        isCOD={form.getValues('paymentType') === 'COD'}
                    />
                </form>
            </Form>
        </div>
    );
};

export default SellerNewOrderPage; 