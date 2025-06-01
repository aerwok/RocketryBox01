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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Phone,
    Mail,
    MessageSquare,
    HelpCircle,
    Clock,
    Loader2,
    RefreshCw,
    Ticket,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createSupportTicket, CreateTicketData, getSellerTickets, SupportTicket } from "@/lib/api/support-tickets";
import { Input } from "@/components/ui/input";

const supportTicketSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    category: z.string().min(1, "Category is required"),
    priority: z.string().min(1, "Priority is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    email: z.string().email("Please enter a valid email address"),
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [refreshingTickets, setRefreshingTickets] = useState(false);

    const form = useForm<SupportTicketForm>({
        resolver: zodResolver(supportTicketSchema),
        defaultValues: {
            subject: "",
            category: "",
            priority: "",
            description: "",
            email: "",
        },
    });

    // Mock seller data (replace with actual user context)
    // Use consistent seller ID that persists across sessions
    const getSellerId = () => {
        let sellerId = localStorage.getItem('current_seller_id');
        if (!sellerId) {
            sellerId = `seller_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('current_seller_id', sellerId);
        }
        return sellerId;
    };

    const sellerData = {
        sellerId: getSellerId(), // Use persistent seller ID
        sellerName: "Current Seller", // Replace with actual seller name from auth context
    };

    // Load seller's tickets
    const loadMyTickets = async () => {
        try {
            setTicketsLoading(true);
            console.log('Loading tickets for seller ID:', sellerData.sellerId);
            const tickets = await getSellerTickets(sellerData.sellerId);
            console.log('Loaded tickets:', tickets);
            setMyTickets(tickets);
        } catch (error) {
            console.error("Error loading tickets:", error);
            toast.error("Failed to load your tickets");
        } finally {
            setTicketsLoading(false);
        }
    };

    // Refresh tickets
    const refreshTickets = async () => {
        try {
            setRefreshingTickets(true);
            console.log('Refreshing tickets for seller ID:', sellerData.sellerId);
            await loadMyTickets();
            toast.success("Tickets refreshed successfully");
        } catch (error) {
            console.error("Error refreshing tickets:", error);
            toast.error("Failed to refresh tickets");
        } finally {
            setRefreshingTickets(false);
        }
    };

    // Load tickets on component mount
    useEffect(() => {
        loadMyTickets();
    }, []);

    const onSubmit = async (data: SupportTicketForm) => {
        try {
            setIsSubmitting(true);

            const ticketData: CreateTicketData = {
                subject: data.subject,
                category: data.category as CreateTicketData['category'],
                priority: data.priority as CreateTicketData['priority'],
                description: data.description,
                email: data.email,
                sellerId: sellerData.sellerId,
                sellerName: sellerData.sellerName,
            };

            const newTicket = await createSupportTicket(ticketData);
            
            toast.success(
                `Support ticket created successfully! Ticket ID: ${newTicket.id.substring(0, 12)}...`,
                {
                    description: "We'll get back to you within 24 hours.",
                    duration: 5000,
                }
            );
            
            form.reset();
            
            // Refresh the tickets list to show the new ticket
            await loadMyTickets();
        } catch (error) {
            console.error("Error creating support ticket:", error);
            toast.error("Failed to create support ticket. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to get status style
    const getStatusStyle = (status: SupportTicket['status']) => {
        switch (status) {
            case "New":
                return "bg-blue-100 text-blue-800";
            case "In Progress":
                return "bg-yellow-100 text-yellow-800";
            case "Resolved":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Helper function to get priority style
    const getPriorityStyle = (priority: SupportTicket['priority']) => {
        switch (priority) {
            case "urgent":
                return "bg-red-100 text-red-800";
            case "high":
                return "bg-orange-100 text-orange-800";
            case "medium":
                return "bg-yellow-100 text-yellow-800";
            case "low":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your email address"
                                                    type="email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input
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

                                <Button 
                                    type="submit" 
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Ticket...
                                        </>
                                    ) : (
                                        "Submit Ticket"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* My Tickets Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="size-5" />
                                My Support Tickets
                            </CardTitle>
                            <CardDescription>
                                Track the status of your submitted tickets
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshTickets}
                            disabled={refreshingTickets}
                        >
                            {refreshingTickets ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Debug Information */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-sm">
                        <div className="font-medium text-gray-700 mb-1">Debug Information:</div>
                        <div className="text-gray-600">
                            <div>Seller ID: <span className="font-mono text-xs">{sellerData.sellerId}</span></div>
                            <div>Tickets Found: {myTickets.length}</div>
                            <div>Last Loaded: {ticketsLoading ? 'Loading...' : new Date().toLocaleTimeString()}</div>
                        </div>
                        <div className="mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const allTickets = JSON.parse(localStorage.getItem('support_tickets') || '[]');
                                    console.log('All tickets in localStorage:', allTickets);
                                    toast.info(`Found ${allTickets.length} total tickets in storage. Check console for details.`);
                                }}
                            >
                                Debug: Show All Tickets
                            </Button>
                        </div>
                    </div>

                    {ticketsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : myTickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                            <p className="text-sm">Create your first support ticket above to get started.</p>
                            <p className="text-xs mt-2 text-gray-400">
                                If you recently created tickets, try clicking the Refresh button above.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Ticket ID</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myTickets.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-mono text-sm">
                                                {ticket.id.substring(0, 12)}...
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="max-w-xs">
                                                    <div className="truncate">{ticket.subject}</div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {ticket.description.substring(0, 50)}...
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize text-sm text-gray-600">
                                                    {ticket.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityStyle(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatDate(ticket.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatDate(ticket.updatedAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    
                    {myTickets.length > 0 && (
                        <div className="mt-4 text-sm text-gray-500">
                            <div className="flex items-center justify-between">
                                <span>Showing {myTickets.length} ticket{myTickets.length !== 1 ? 's' : ''}</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-100"></div>
                                        <span className="text-xs">New</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
                                        <span className="text-xs">In Progress</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-100"></div>
                                        <span className="text-xs">Resolved</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerSupportPage; 