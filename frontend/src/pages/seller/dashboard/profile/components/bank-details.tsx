import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowRightIcon } from "lucide-react";
import { BankDetailsInput, bankDetailsSchema } from "@/lib/validations/bank-details";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";
import { useState } from "react";

interface BankDetailsProps {
    onSave: () => void;
}

const BankDetails = ({ onSave }: BankDetailsProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<BankDetailsInput>({
        resolver: zodResolver(bankDetailsSchema),
        defaultValues: {
            bankName: "",
            accountName: "",
            accountNumber: "",
            branchName: "",
            accountType: "",
            ifscCode: "",
        },
    });

    const onSubmit = async (data: BankDetailsInput) => {
        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.profile.update({
                bankDetails: [{
                    bankName: data.bankName,
                    accountName: data.accountName,
                    accountNumber: data.accountNumber,
                    branch: data.branchName,
                    accountType: data.accountType,
                    ifscCode: data.ifscCode,
                    cancelledCheque: data.cancelledChequeImage?.[0] ? {
                        status: 'pending',
                        url: URL.createObjectURL(data.cancelledChequeImage[0])
                    } : undefined
                }]
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to update bank details');
            }

            toast.success('Bank details updated successfully');
            onSave();
        } catch (error) {
            console.error('Error updating bank details:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update bank details');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Bank Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your bank name"
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
                            name="accountName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Account Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter account name"
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
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Account Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter account number"
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
                            name="branchName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Branch Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter branch name"
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
                            name="accountType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Account Type *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                <SelectValue placeholder="-Account Type-" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="current">Current</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ifscCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        IFSC code *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter IFSC code"
                                            className="bg-[#F8F7FF] uppercase"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cancelledChequeImage"
                            render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                    <FormLabel>
                                        Cancelled Cheque Image *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="bg-[#F8F7FF] file:bg-main file:text-white file:border-0 file:text-xs file:rounded-md file:px-3 file:py-1.5 file:mr-4 hover:file:bg-main/90"
                                            onChange={(e) => onChange(e.target.files)}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" variant="purple" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save & Next'}
                            {!isLoading && <ArrowRightIcon className="size-4 ml-1" />}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default BankDetails; 