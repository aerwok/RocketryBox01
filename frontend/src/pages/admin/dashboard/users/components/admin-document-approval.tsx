import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { DocumentApprovalInput, documentApprovalSchema } from "@/lib/validations/admin-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AdminDocumentApprovalProps {
    onSave: (message?: string) => void;
}

const AdminDocumentApproval = ({ onSave }: AdminDocumentApprovalProps) => {
    const form = useForm<DocumentApprovalInput>({
        resolver: zodResolver(documentApprovalSchema),
        defaultValues: {
            status: "approved",
            remarks: ""
        },
    });

    const onSubmit = (data: DocumentApprovalInput) => {
        console.log(data);
        if (data.status === "approved") {
            onSave("Documents approved successfully");
        } else {
            onSave("Documents rejected");
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Document Status *
                                    </FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="approved" id="approved" />
                                                <label htmlFor="approved">Approve</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="rejected" id="rejected" />
                                                <label htmlFor="rejected">Reject</label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Remarks
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter remarks (optional)"
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

export default AdminDocumentApproval; 