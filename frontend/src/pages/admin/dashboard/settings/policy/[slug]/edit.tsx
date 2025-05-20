import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PolicyValues, policySchema } from "@/lib/validations/policy";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ServiceFactory } from "@/services/service-factory";

const PolicyEditPage = () => {
    const navigate = useNavigate();
    const { slug } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            version: "",
            lastUpdated: "",
        },
    });

    useEffect(() => {
        const fetchPolicy = async () => {
            if (!slug) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await ServiceFactory.policies.getPolicyBySlug(slug);
                const policy = response.data as PolicyValues;
                
                form.reset({
                    title: policy.title,
                    slug: policy.slug,
                    content: policy.content,
                    seoTitle: policy.seoTitle || "",
                    seoDescription: policy.seoDescription || "",
                    seoKeywords: policy.seoKeywords || "",
                    isPublished: policy.isPublished,
                    requiredForSignup: policy.requiredForSignup,
                    template: policy.template,
                    version: policy.version || "",
                    lastUpdated: policy.lastUpdated || "",
                });
            } catch (err) {
                console.error("Error fetching policy:", err);
                setError("Failed to load policy. Please try again.");
                toast.error("Failed to load policy");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolicy();
    }, [slug, form]);

    const onSubmit = async (data: PolicyValues) => {
        try {
            await ServiceFactory.policies.updatePolicy(slug!, data);
            toast.success("Policy updated successfully");
            navigate("/admin/dashboard/settings/policy");
        } catch (error) {
            console.error("Error updating policy:", error);
            toast.error("Failed to update policy");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading policy...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-500">{error}</p>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/admin/dashboard/settings/policy")}
                        className="mt-4"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-color-mode="light">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Edit Policy
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
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default PolicyEditPage; 