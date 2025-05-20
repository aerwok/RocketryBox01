import { Button } from "@/components/ui/button";
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
import { ShopDetailsInput, shopDetailsSchema } from "@/lib/validations/admin-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, LinkIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceFactory } from "@/services/service-factory";
import { useEffect } from "react";

interface AdminShopDetailsProps {
    onSave: (message?: string) => void;
}

const AdminShopDetails = ({ onSave }: AdminShopDetailsProps) => {
    const { id } = useParams();
    
    const form = useForm<ShopDetailsInput>({
        resolver: zodResolver(shopDetailsSchema),
        defaultValues: {
            shopName: "",
            shopDescription: "",
            gstNumber: "",
            gstCertificate: undefined,
            shopAddress: "",
            city: "",
            state: "",
            pincode: "",
            shopCategory: "",
            websiteUrl: "",
            amazonStoreUrl: "",
            shopifyStoreUrl: "",
            openCartStoreUrl: ""
        },
    });

    useEffect(() => {
        const fetchShopDetails = async () => {
            if (!id) return;
            try {
                const response = await ServiceFactory.admin.getTeamMember(id);
                const shopDetails = response.data.shopDetails;
                if (shopDetails) {
                    form.reset(shopDetails);
                }
            } catch (error) {
                console.error('Failed to fetch shop details:', error);
            }
        };
        fetchShopDetails();
    }, [id, form]);

    const onSubmit = async (data: ShopDetailsInput) => {
        if (!id) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { shopDetails: data });
            onSave("Shop details saved successfully");
        } catch (error) {
            console.error('Failed to save shop details:', error);
        }
    };

    // Check if user is a seller based on ID
    if (!id?.includes("SELLER")) {
        return (
            <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow">
                <p className="text-lg text-center text-gray-500">
                    Shop details are only applicable for seller accounts.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="shopName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Shop Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter shop name"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shopCategory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Shop Category *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                <SelectValue placeholder="Select shop category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="electronics">Electronics</SelectItem>
                                            <SelectItem value="fashion">Fashion</SelectItem>
                                            <SelectItem value="home">Home & Kitchen</SelectItem>
                                            <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                                            <SelectItem value="books">Books</SelectItem>
                                            <SelectItem value="sports">Sports & Fitness</SelectItem>
                                            <SelectItem value="grocery">Grocery</SelectItem>
                                            <SelectItem value="toys">Toys & Games</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shopDescription"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>
                                        Shop Description *
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter shop description"
                                            className="bg-[#F8F7FF] min-h-32"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shopAddress"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>
                                        Shop Address *
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter shop address"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
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
                                    <FormLabel>
                                        City *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter city"
                                            className="bg-[#F8F7FF]"
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
                                        State *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter state"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
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
                                    <FormLabel>
                                        Pincode *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter pincode"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="gstNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        GST Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter GST number"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="col-span-2 pt-4 border-t">
                            <h3 className="text-lg font-medium mb-4 flex items-center">
                                <LinkIcon className="mr-2 h-5 w-5" />
                                Store Links
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="websiteUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://www.example.com"
                                                    className="bg-[#F8F7FF]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="amazonStoreUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amazon Store URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://www.amazon.in/seller/yourstore"
                                                    className="bg-[#F8F7FF]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="shopifyStoreUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shopify Store URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://yourstore.myshopify.com"
                                                    className="bg-[#F8F7FF]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="openCartStoreUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>OpenCart Store URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://www.youropencartstore.com"
                                                    className="bg-[#F8F7FF]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="gstCertificate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        GST Certificate *
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex items-center justify-center w-full">
                                            <label
                                                htmlFor="gst-certificate"
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#F8F7FF] hover:bg-gray-100"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                    <p className="mb-2 text-sm text-gray-500">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PDF format only (MAX. 2MB)
                                                    </p>
                                                </div>
                                                <input id="gst-certificate" type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        field.onChange(e.target.files[0]);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" variant="purple">
                            Save
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default AdminShopDetails; 