import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PolicyValues, policySchema } from "@/lib/validations/policy";
import { useNavigate } from "react-router-dom";
import { ServiceFactory } from "@/services/service-factory";

const PolicyCreatePage = () => {
    const navigate = useNavigate();
    const form = useForm<PolicyValues>({
        resolver: zodResolver(policySchema),
        defaultValues: {
            title: "",
            slug: "",
            content: "",
            seoTitle: "",
            seoDescription: "",
            seoKeywords: "",
            isPublished: true,
            requiredForSignup: false,
            template: "default",
            version: "1.0",
            lastUpdated: new Date().toISOString().slice(0, 10),
        },
    });

    const onSubmit = async (data: PolicyValues) => {
        try {
            // In development, just show a toast and navigate back
            if (import.meta.env.MODE === "development") {
                toast.success("Policy created (mock)");
                navigate("/admin/dashboard/settings/policy");
                return;
            }
            // TODO: Implement real API call when backend is available
            await ServiceFactory.policies.createPolicy(data);
            toast.success("Policy created successfully");
            navigate("/admin/dashboard/settings/policy");
        } catch (error) {
            console.error("Error creating policy:", error);
            toast.error("Failed to create policy");
        }
    };

    return (
        <div className="space-y-6" data-color-mode="light">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Create Policy
                </h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6">
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium">
                                                Title
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter title" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium">
                                                Slug
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter slug" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="seoTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-medium">
                                                    SEO Title
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter SEO title" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="seoKeywords"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-medium">
                                                    SEO Keywords
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter SEO keywords" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="seoDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium">
                                                SEO Description
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter SEO description" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border">
                            <div className="p-6 space-y-4">
                                <h3 className="font-medium">Content</h3>
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <MDEditor
                                                    value={field.value}
                                                    onChange={(value) => field.onChange(value || "")}
                                                    preview="edit"
                                                    height={500}
                                                    className="!border-0"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/admin/dashboard/settings/policy")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create Policy
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default PolicyCreatePage; 