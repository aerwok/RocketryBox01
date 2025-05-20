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
import { DocumentsInput, documentsSchema } from "@/lib/validations/admin-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, FileIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useParams } from "react-router-dom";
import { ServiceFactory } from "@/services/service-factory";

interface AdminDocumentsProps {
    onSave: () => void;
}

const AdminDocuments = ({ onSave }: AdminDocumentsProps) => {
    const { id } = useParams();
    
    // States to track document visibility
    const [showPanUpload, setShowPanUpload] = useState(false);
    const [showGstUpload, setShowGstUpload] = useState(false);
    const [showIdentityUpload, setShowIdentityUpload] = useState(false);
    
    const [panDocument, setPanDocument] = useState<{ name: string; url: string } | null>(null);
    const [gstDocument, setGstDocument] = useState<{ name: string; url: string } | null>(null);
    const [identityDocument, setIdentityDocument] = useState<{ name: string; url: string } | null>(null);
    
    const form = useForm<DocumentsInput>({
        resolver: zodResolver(documentsSchema),
        defaultValues: {
            panNumber: "",
            gstNumber: "",
            documentType: "",
            documentNumber: "",
        },
    });

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!id) return;
            try {
                const response = await ServiceFactory.admin.getTeamMember(id);
                const documents = response.data.documents;
                if (documents) {
                    form.reset(documents);
                    setPanDocument(documents.panDocument);
                    setGstDocument(documents.gstDocument);
                    setIdentityDocument(documents.identityDocument);
                }
            } catch (error) {
                console.error('Failed to fetch documents:', error);
            }
        };
        fetchDocuments();
    }, [id, form]);

    const onSubmit = async (data: DocumentsInput) => {
        if (!id) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { 
                documents: {
                    ...data,
                    panDocument,
                    gstDocument,
                    identityDocument
                }
            });
            onSave();
        } catch (error) {
            console.error('Failed to save documents:', error);
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            placeholder="Enter PAN number"
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
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        PAN Card Image *
                                    </FormLabel>
                                    <FormControl>
                                        {showPanUpload ? (
                                            <div className="flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="pan-image"
                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#F8F7FF] hover:bg-gray-100"
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                        <p className="mb-2 text-sm text-gray-500">
                                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            JPG, PNG or PDF (MAX. 2MB)
                                                        </p>
                                                    </div>
                                                    <input id="pan-image" type="file" className="hidden" onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            field.onChange(e.target.files[0]);
                                                            setShowPanUpload(false);
                                                        }
                                                    }} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F8F7FF]">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <FileIcon className="h-8 w-8 text-blue-500" />
                                                    <div>
                                                        <p className="text-sm font-medium">{panDocument?.name}</p>
                                                        <p className="text-xs text-gray-500">Click to view</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setShowPanUpload(true)}
                                                >
                                                    Change
                                                </Button>
                                            </div>
                                        )}
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
                                            placeholder="Enter GST number (optional)"
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
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        GST Certificate
                                    </FormLabel>
                                    <FormControl>
                                        {showGstUpload ? (
                                            <div className="flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="gst-document"
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
                                                    <input id="gst-document" type="file" accept=".pdf" className="hidden" onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            field.onChange(e.target.files[0]);
                                                            setShowGstUpload(false);
                                                        }
                                                    }} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F8F7FF]">
                                                {field.value || gstDocument?.name ? (
                                                    <>
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <FileIcon className="h-8 w-8 text-blue-500" />
                                                            <div>
                                                                <p className="text-sm font-medium">{gstDocument?.name}</p>
                                                                <p className="text-xs text-gray-500">Click to view</p>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => setShowGstUpload(true)}
                                                        >
                                                            Change
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-1 justify-center">
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => setShowGstUpload(true)}
                                                        >
                                                            Upload
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="documentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Identity Document Type *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-[#F8F7FF]">
                                                <SelectValue placeholder="Select document type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="driving">Driving License</SelectItem>
                                            <SelectItem value="passport">Passport</SelectItem>
                                            <SelectItem value="aadhar">Aadhar Card</SelectItem>
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
                                        Identity Document Number *
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
                            name="identityDocumentImage"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>
                                        Identity Document Image *
                                    </FormLabel>
                                    <FormControl>
                                        {showIdentityUpload ? (
                                            <div className="flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="identity-document"
                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#F8F7FF] hover:bg-gray-100"
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                        <p className="mb-2 text-sm text-gray-500">
                                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            JPG, PNG or PDF (MAX. 2MB)
                                                        </p>
                                                    </div>
                                                    <input id="identity-document" type="file" className="hidden" onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            field.onChange(e.target.files[0]);
                                                            setShowIdentityUpload(false);
                                                        }
                                                    }} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F8F7FF]">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <FileIcon className="h-8 w-8 text-blue-500" />
                                                    <div>
                                                        <p className="text-sm font-medium">{identityDocument?.name}</p>
                                                        <p className="text-xs text-gray-500">Click to view</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setShowIdentityUpload(true)}
                                                >
                                                    Change
                                                </Button>
                                            </div>
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" variant="purple">
                            Save & Next
                            <ArrowRightIcon className="size-4 ml-1" />
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default AdminDocuments; 