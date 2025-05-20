import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { PaymentTypeInput, paymentTypeSchema } from "@/lib/validations/admin-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { ServiceFactory } from "@/services/service-factory";
import { useEffect, useState } from "react";

interface AdminPaymentTypeProps {
    onSave: (message?: string) => void;
}

interface RateBand {
    id: string;
    name: string;
    code: string;
}

const AdminPaymentType = ({ onSave }: AdminPaymentTypeProps) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [rateBands, setRateBands] = useState<RateBand[]>([]);
    const [loading, setLoading] = useState(false);

    const form = useForm<PaymentTypeInput>({
        resolver: zodResolver(paymentTypeSchema),
        defaultValues: {
            paymentMode: "",
            rateBand: ""
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Fetch user's payment type
                const userResponse = await ServiceFactory.admin.getTeamMember(id);
                const paymentDetails = userResponse.data.paymentDetails;
                if (paymentDetails) {
                    form.reset(paymentDetails);
                }

                // Fetch rate bands
                const rateBandsResponse = await ServiceFactory.admin.getRateBands();
                setRateBands(rateBandsResponse.data as RateBand[]);
            } catch (error) {
                console.error('Failed to fetch payment data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, form]);

    const onSubmit = async (data: PaymentTypeInput) => {
        if (!id) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { paymentDetails: data });
            onSave("Payment type saved successfully");
        } catch (error) {
            console.error('Failed to save payment type:', error);
        }
    };

    const handleCreateRateBand = () => {
        navigate("/admin/dashboard/settings/rate-band/create");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                            name="paymentMode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Payment Mode *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                <SelectValue placeholder="Select payment type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="wallet">Wallet</SelectItem>
                                            <SelectItem value="credit_limit">Credit Limit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="rateBand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Rate Band *
                                        </FormLabel>
                                        <div className="flex items-center gap-2">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-[#F8F7FF]">
                                                        <SelectValue placeholder="Select rate band" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {rateBands.map((band) => (
                                                        <SelectItem key={band.id} value={band.code}>
                                                            {band.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCreateRateBand}
                                                className="flex items-center gap-1"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create New
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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

export default AdminPaymentType; 