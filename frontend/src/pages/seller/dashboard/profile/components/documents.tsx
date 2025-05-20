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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DocumentsInput, documentsSchema } from "@/lib/validations/documents";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface DocumentsProps {
    onSave: () => void;
}

const Documents = ({ onSave }: DocumentsProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<DocumentsInput>({
        resolver: zodResolver(documentsSchema),
        defaultValues: {
            companyCategory: "",
            panNumber: "",
            gstNumber: "",
            identityDocument: "",
            documentNumber: "",
        },
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await ServiceFactory.seller.profile.get();
                if (!response.success) {
                    throw new Error(response.message || 'Failed to fetch profile');
                }

                const profile = response.data;
                form.reset({
                    companyCategory: profile.companyCategory || "",
                    panNumber: profile.documents?.pan || "",
                    gstNumber: profile.documents?.gstin || "",
                    identityDocument: profile.documents?.aadhaar ? "aadhar" : "",
                    documentNumber: profile.documents?.aadhaar || "",
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to fetch profile data');
            }
        };

        fetchProfile();
    }, [form]);

    const onSubmit = async (data: DocumentsInput) => {
        try {
            setIsLoading(true);

            // Upload documents if they exist
            const documents = [];
            if (data.panImage?.[0]) {
                const panResponse = await ServiceFactory.seller.profile.updateImage(data.panImage[0]);
                if (!panResponse.success) {
                    throw new Error('Failed to upload PAN image');
                }
                documents.push({
                    name: 'PAN',
                    type: 'pan',
                    status: 'pending' as const,
                    url: panResponse.data.imageUrl || ''
                });
            }

            if (data.gstDocument?.[0]) {
                const gstResponse = await ServiceFactory.seller.profile.updateImage(data.gstDocument[0]);
                if (!gstResponse.success) {
                    throw new Error('Failed to upload GST document');
                }
                documents.push({
                    name: 'GST',
                    type: 'gst',
                    status: 'pending' as const,
                    url: gstResponse.data.imageUrl || ''
                });
            }

            if (data.gstDocumentImage?.[0]) {
                const gstImageResponse = await ServiceFactory.seller.profile.updateImage(data.gstDocumentImage[0]);
                if (!gstImageResponse.success) {
                    throw new Error('Failed to upload GST document image');
                }
                documents.push({
                    name: 'GST Image',
                    type: 'gst_image',
                    status: 'pending' as const,
                    url: gstImageResponse.data.imageUrl || ''
                });
            }

            // Update profile with document details
            const response = await ServiceFactory.seller.profile.update({
                companyCategory: data.companyCategory,
                documents: {
                    pan: data.panNumber,
                    gstin: data.gstNumber,
                    aadhaar: data.documentNumber,
                    documents: documents
                }
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to update documents');
            }

            toast.success('Documents updated successfully');
            onSave();
        } catch (error) {
            console.error('Error updating documents:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update documents');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="companyCategory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Select your company category *
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-[#F8F7FF]">
                                                    <SelectValue placeholder="Select company category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="private">
                                                    Private Limited Company
                                                </SelectItem>
                                                <SelectItem value="public">
                                                    Public Limited Company
                                                </SelectItem>
                                                <SelectItem value="partnership">
                                                    Partnership
                                                </SelectItem>
                                                <SelectItem value="proprietorship">
                                                    Proprietorship
                                                </SelectItem>
                                                <SelectItem value="llp">
                                                    LLP
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="panNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        PAN Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="PAN card number"
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
                            name="panImage"
                            render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                    <FormLabel>
                                        PAN Image *
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

                        <FormField
                            control={form.control}
                            name="gstNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        GST Number
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="GST number"
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
                            name="gstDocument"
                            render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                    <FormLabel>
                                        GST Document
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

                        <FormField
                            control={form.control}
                            name="identityDocument"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Identity Document *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                <SelectValue placeholder="Select Document Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="aadhar">
                                                Aadhar Card
                                            </SelectItem>
                                            <SelectItem value="dl">
                                                Driving License
                                            </SelectItem>
                                            <SelectItem value="voter">
                                                Voter ID
                                            </SelectItem>
                                            <SelectItem value="passport">
                                                Passport
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="documentNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Document Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter document number"
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
                            name="gstDocumentImage"
                            render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                    <FormLabel>
                                        GST Document Image
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

export default Documents; 