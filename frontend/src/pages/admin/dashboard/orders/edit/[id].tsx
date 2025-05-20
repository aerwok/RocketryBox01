import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftIcon, Plus, Minus } from "lucide-react";

// Form Schema for order editing
const orderFormSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  orderCreationType: z.enum(["Single", "Multiple"]),
  shipmentType: z.enum(["Forward", "Reverse"]),
  paymentType: z.enum(["COD", "PAID"]),
  shippingDetails: z.object({
    fullName: z.string().min(1, "Full name is required"),
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
    emailAddress: z.string().email().optional().or(z.literal("")),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional().or(z.literal("")),
    landmark: z.string().optional().or(z.literal("")),
    pincode: z.string().min(6, "Pincode must be 6 digits"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    sameAsShipping: z.boolean().default(false)
  }),
  items: z.array(z.object({
    sku: z.string().min(1, "SKU is required"),
    name: z.string().min(1, "Item name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    weight: z.number().min(0, "Weight must be non-negative"),
    price: z.number().min(0, "Price must be non-negative")
  })).min(1, "At least one item is required"),
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

type OrderFormValues = z.infer<typeof orderFormSchema>;

const AdminEditOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize react-hook-form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderId: id || "ORD-2025-002",
      orderCreationType: "Multiple",
      shipmentType: "Forward",
      paymentType: "PAID",
      shippingDetails: {
        fullName: "Priya Patel",
        contactNumber: "9876543211",
        emailAddress: "priya.patel@gmail.com",
        addressLine1: "123 Main Street",
        addressLine2: "Apartment 4B",
        landmark: "Near City Park",
        pincode: "400002",
        city: "Mumbai",
        state: "Maharashtra",
        sameAsShipping: false
      },
      items: [
        { sku: "WM001", name: "Wireless Mouse", quantity: 1, weight: 0.2, price: 799 },
        { sku: "KB001", name: "Keyboard", quantity: 1, weight: 1.0, price: 1000 }
      ],
      shippingCharge: 0,
      codCharge: 0,
      taxAmount: 0,
      discount: 0,
      dimensions: {
        length: 30,
        width: 20,
        height: 10,
        weight: 2.4
      },
      totalAmount: 1799
    }
  });

  // Track item fields for dynamic item management
  const [items, setItems] = useState(form.getValues().items);

  // Calculate totals when relevant fields change
  useEffect(() => {
    if (!isLoading) {
      calculateTotals();
    }
  }, [
    form.watch("items"),
    form.watch("shippingCharge"), 
    form.watch("codCharge"),
    form.watch("taxAmount"),
    form.watch("discount")
  ]);
  
  // Handle payment type change to set COD charge
  const handlePaymentTypeChange = (value: "COD" | "PAID") => {
    form.setValue("paymentType", value);
    if (value === "COD") {
      form.setValue("codCharge", 50);
    } else {
      form.setValue("codCharge", 0);
    }
    calculateTotals();
  };
  
  // Add new item to the order
  const addItem = () => {
    const currentItems = form.getValues("items");
    const newItems = [...currentItems, { sku: "", name: "", quantity: 1, weight: 0, price: 0 }];
    setItems(newItems);
    form.setValue("items", newItems);
  };
  
  // Remove item from order
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      const newItems = currentItems.filter((_, i) => i !== index);
      setItems(newItems);
      form.setValue("items", newItems);
    } else {
      toast.error("Order must have at least one item");
    }
  };

  // Calculate order totals
  const calculateTotals = () => {
    const currentItems = form.getValues("items");
    
    // Calculate item totals
    const itemSubtotal = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate weight total
    const weightTotal = currentItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    form.setValue("dimensions.weight", weightTotal);
    
    // Calculate final total
    const shippingCharge = form.getValues("shippingCharge") || 0;
    const codCharge = form.getValues("codCharge") || 0;
    const taxAmount = form.getValues("taxAmount") || 0;
    const discount = form.getValues("discount") || 0;
    
    const totalAmount = itemSubtotal + shippingCharge + codCharge + taxAmount - discount;
    form.setValue("totalAmount", totalAmount);
  };

  // Handle form submission
  const onSubmit = async (data: OrderFormValues) => {
    try {
      setIsLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Updating order with data:", data);
      
      toast.success("Order updated successfully");
      navigate(`/admin/dashboard/orders/${id}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-4 max-w-7xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Link to={`/admin/dashboard/orders/${id}`} className="mr-4">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Edit Order</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Number */}
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Number*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ORD-2025-002" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Order Creation Type */}
            <FormField
              control={form.control}
              name="orderCreationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Creation Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order creation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Single">Single (Manual) Order</SelectItem>
                      <SelectItem value="Multiple">Multiple (Bulk) Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Shipment Type */}
            <FormField
              control={form.control}
              name="shipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipment Type*</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Forward">Forward Shipment</SelectItem>
                      <SelectItem value="Reverse">Reverse Shipment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Payment Type */}
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Type*</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: "COD" | "PAID") => handlePaymentTypeChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PAID">PAID</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Shipping Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Shipping Details</h2>
                <FormField
                  control={form.control}
                  name="shippingDetails.sameAsShipping"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sameAsShipping" 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                      <label 
                        htmlFor="sameAsShipping" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Same as shipping address
                      </label>
                    </div>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="shippingDetails.fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Contact Number */}
                <FormField
                  control={form.control}
                  name="shippingDetails.contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contact Number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="shippingDetails.emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Email Address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Address Line 1 */}
                <FormField
                  control={form.control}
                  name="shippingDetails.addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Address Line 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Address Line 2 */}
                <FormField
                  control={form.control}
                  name="shippingDetails.addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Address Line 2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Landmark */}
                <FormField
                  control={form.control}
                  name="shippingDetails.landmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landmark (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Landmark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Pincode */}
                <FormField
                  control={form.control}
                  name="shippingDetails.pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* City */}
                <FormField
                  control={form.control}
                  name="shippingDetails.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* State */}
                <FormField
                  control={form.control}
                  name="shippingDetails.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Order Items */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Order Items</h2>
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {items.map((_, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                  {/* SKU */}
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SKU" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Item Name */}
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Item Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              {...field} 
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 1);
                                calculateTotals();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Item Weight */}
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Total Weight*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              min={0}
                              {...field} 
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                calculateTotals();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Item Price */}
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Total Price* (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0}
                              {...field} 
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                                calculateTotals();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Additional Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Charges */}
            <div className="space-y-4">
              {/* Shipping Charge */}
              <FormField
                control={form.control}
                name="shippingCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Charge</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          calculateTotals();
                        }} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* COD Charge */}
              <FormField
                control={form.control}
                name="codCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>COD Charge</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          calculateTotals();
                        }} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Tax Amount */}
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          calculateTotals();
                        }} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Discount */}
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          calculateTotals();
                        }} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Right Column: Dimensions */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Length */}
                <FormField
                  control={form.control}
                  name="dimensions.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length* (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Width */}
                <FormField
                  control={form.control}
                  name="dimensions.width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width* (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Height */}
                <FormField
                  control={form.control}
                  name="dimensions.height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height* (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Weight */}
                <FormField
                  control={form.control}
                  name="dimensions.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight* (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Total Amount */}
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        className="text-lg font-bold" 
                        {...field} 
                        readOnly 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/dashboard/orders/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminEditOrderPage; 