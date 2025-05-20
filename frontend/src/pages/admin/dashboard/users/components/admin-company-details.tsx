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
import { CompanyDetailsInput, companyDetailsSchema } from "@/lib/validations/admin-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useParams } from "react-router-dom";
import { ServiceFactory } from "@/services/service-factory";
import { useEffect } from "react";

interface AdminCompanyDetailsProps {
    onSave: (message?: string) => void;
}

const AdminCompanyDetails = ({ onSave }: AdminCompanyDetailsProps) => {
    const { id } = useParams();
    
    const form = useForm<CompanyDetailsInput>({
        resolver: zodResolver(companyDetailsSchema),
        defaultValues: {
            companyCategory: "",
            companyName: "",
            sellerName: "",
            email: "",
            contactNumber: ""
        },
    });

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            if (!id) return;
            try {
                const response = await ServiceFactory.admin.getTeamMember(id);
                const companyDetails = response.data.companyDetails;
                if (companyDetails) {
                    form.reset(companyDetails);
                }
            } catch (error) {
                console.error('Failed to fetch company details:', error);
            }
        };
        fetchCompanyDetails();
    }, [id, form]);

    const onSubmit = async (data: CompanyDetailsInput) => {
        if (!id) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { companyDetails: data });
            onSave("Company details saved successfully");
        } catch (error) {
            console.error('Failed to save company details:', error);
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="companyCategory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Company Category *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                <SelectValue placeholder="Select company category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="private-limited">Private Limited</SelectItem>
                                            <SelectItem value="llp">LLP</SelectItem>
                                            <SelectItem value="proprietorship">Proprietorship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Company Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter company name"
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
                            name="sellerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Seller Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter seller name"
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Email Address *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Enter email address"
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
                            name="contactNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Contact Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter contact number"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
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

export default AdminCompanyDetails; 