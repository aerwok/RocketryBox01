import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Phone,
    Mail,
    MessageSquare,
    HelpCircle,
    Clock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

const supportTicketSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    category: z.string().min(1, "Category is required"),
    priority: z.string().min(1, "Priority is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
});

type SupportTicketForm = z.infer<typeof supportTicketSchema>;

const faqItems = [
    {
        question: "How do I create a shipping order?",
        answer: "To create a shipping order, go to the 'Orders' section and click 'Create New Order'. Fill in the required details including pickup and delivery addresses, package details, and select your preferred shipping service.",
    },
    {
        question: "What payment methods are supported?",
        answer: "We support various payment methods including credit/debit cards, net banking, UPI, and cash on delivery. Payment options may vary based on your location and order value.",
    },
    {
        question: "How can I track my shipments?",
        answer: "You can track your shipments by entering the tracking number in the 'Track Shipment' section. You'll receive real-time updates about your shipment's status and location.",
    },
    {
        question: "How are shipping rates calculated?",
        answer: "Shipping rates are calculated based on factors such as package weight, dimensions, origin and destination locations, and the selected service type. You can use our rate calculator to get an estimate.",
    },
    {
        question: "What is your return policy?",
        answer: "We offer a hassle-free return policy. If you need to return an item, please contact our support team within 7 days of delivery. We'll guide you through the return process and arrange for pickup.",
    },
];

const SellerSupportPage = () => {
    const form = useForm<SupportTicketForm>({
        resolver: zodResolver(supportTicketSchema),
        defaultValues: {
            subject: "",
            category: "",
            priority: "",
            description: "",
        },
    });

    const onSubmit = async () => {
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Support ticket created successfully!");
            form.reset();
        } catch (error) {
            toast.error("Failed to create support ticket");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Support
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageSquare className="size-4" />
                    <span>Get help and support for your queries</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>
                                Get in touch with our support team
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <Phone className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Phone Support</p>
                                    <p className="text-sm text-gray-500">1800-XXX-XXXX</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <Mail className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Email Support</p>
                                    <p className="text-sm text-gray-500">support@example.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100">
                                    <Clock className="size-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Support Hours</p>
                                    <p className="text-sm text-gray-500">
                                        Monday - Saturday, 9:00 AM - 6:00 PM
                                    </p>
                        </div>
                    </div>
                        </CardContent>
                    </Card>

                    {/* FAQ Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="size-5" />
                                Frequently Asked Questions
                            </CardTitle>
                            <CardDescription>
                                Find answers to common questions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {faqItems.map((item, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger>{item.question}</AccordionTrigger>
                                        <AccordionContent>{item.answer}</AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* Support Ticket Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="size-5" />
                            Create Support Ticket
                        </CardTitle>
                        <CardDescription>
                            Submit your query and we'll get back to you soon
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <input
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Enter ticket subject"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="shipping">Shipping</SelectItem>
                                                    <SelectItem value="billing">Billing</SelectItem>
                                                    <SelectItem value="technical">Technical</SelectItem>
                                                    <SelectItem value="account">Account</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
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
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe your issue in detail"
                                                    className="min-h-[150px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">
                                    Submit Ticket
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerSupportPage; 