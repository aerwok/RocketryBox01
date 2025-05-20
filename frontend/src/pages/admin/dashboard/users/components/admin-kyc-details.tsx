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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, FileIcon, Upload, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { useState, useEffect } from "react";
import { ServiceFactory } from "@/services/service-factory";

// Define schema for KYC details
const kycDetailsSchema = z.object({
    panNumber: z.string().min(10, "PAN number must be 10 characters").max(10, "PAN number must be 10 characters"),
    panCardImage: z.instanceof(File).optional(),
    aadharNumber: z.string().min(12, "Aadhar number must be 12 digits").max(12, "Aadhar number must be 12 digits"),
    aadharImages: z.array(z.instanceof(File)).optional(),
    kycStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

type KycDetailsInput = z.infer<typeof kycDetailsSchema>;

interface AdminKycDetailsProps {
    onSave: (message: string) => void;
}

const AdminKycDetails = ({ onSave }: AdminKycDetailsProps) => {
    const { id } = useParams();
    const isSeller = id?.includes("SELLER");
    
    // States to track document visibility
    const [showPanUpload, setShowPanUpload] = useState(false);
    const [showAadharUpload, setShowAadharUpload] = useState(false);
    
    // Track the current KYC status
    const [currentStatus, setCurrentStatus] = useState<"pending" | "approved" | "rejected">("pending");
    
    const [panDocument, setPanDocument] = useState<{ name: string; url: string } | null>(null);
    const [aadharDocuments, setAadharDocuments] = useState<Array<{ name: string; url: string }>>([]);
    
    const form = useForm<KycDetailsInput>({
        resolver: zodResolver(kycDetailsSchema),
        defaultValues: {
            panNumber: isSeller ? "ABCPX1234X" : "DEFPX5678X",
            aadharNumber: isSeller ? "123456789012" : "987654321098",
            kycStatus: currentStatus,
            aadharImages: [],
        },
    });

    useEffect(() => {
        const fetchKycDetails = async () => {
            if (!id) return;
            try {
                const response = await ServiceFactory.admin.getTeamMember(id);
                const kycDetails = response.data.kycDetails;
                if (kycDetails) {
                    form.reset(kycDetails);
                    setCurrentStatus(kycDetails.kycStatus);
                    setPanDocument(kycDetails.panDocument);
                    setAadharDocuments(kycDetails.aadharDocuments);
                }
            } catch (error) {
                console.error('Failed to fetch KYC details:', error);
            }
        };
        fetchKycDetails();
    }, [id, form]);

    const onSubmit = async (data: KycDetailsInput) => {
        if (!id) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { 
                kycDetails: {
                    ...data,
                    panDocument,
                    aadharDocuments
                }
            });
            onSave("KYC details saved successfully");
        } catch (error) {
            console.error('Failed to save KYC details:', error);
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="kycStatus"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>KYC Status</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            value={currentStatus}
                                            onValueChange={(value) => {
                                                // This is disabled, but keeping the handler for completeness
                                                setCurrentStatus(value as "pending" | "approved" | "rejected");
                                                field.onChange(value);
                                            }}
                                            className="flex flex-row gap-4"
                                            disabled
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="pending" />
                                                </FormControl>
                                                <FormLabel className="font-normal text-yellow-600">
                                                    Pending
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="approved" />
                                                </FormControl>
                                                <FormLabel className="font-normal text-green-600">
                                                    Approved
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="rejected" />
                                                </FormControl>
                                                <FormLabel className="font-normal text-red-600">
                                                    Rejected
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                            name="panCardImage"
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
                            name="aadharNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Aadhar Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter Aadhar number"
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
                            name="aadharImages"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>
                                        Aadhar Card Images (Front & Back) *
                                    </FormLabel>
                                    <FormControl>
                                        {showAadharUpload ? (
                                            <div className="flex flex-col gap-4">
                                                <p className="text-sm text-gray-500">Upload both front and back images of the Aadhar card</p>
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor="aadhar-front-image"
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#F8F7FF] hover:bg-gray-100"
                                                        >
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                                <p className="text-sm text-gray-500">
                                                                    <span className="font-semibold">Front Side</span>
                                                                </p>
                                                            </div>
                                                            <input 
                                                                id="aadhar-front-image" 
                                                                type="file" 
                                                                className="hidden" 
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        const files = [...(field.value || [])];
                                                                        files[0] = e.target.files[0];
                                                                        field.onChange(files);
                                                                    }
                                                                }} 
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label
                                                            htmlFor="aadhar-back-image"
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#F8F7FF] hover:bg-gray-100"
                                                        >
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                                <p className="text-sm text-gray-500">
                                                                    <span className="font-semibold">Back Side</span>
                                                                </p>
                                                            </div>
                                                            <input 
                                                                id="aadhar-back-image" 
                                                                type="file" 
                                                                className="hidden" 
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        const files = [...(field.value || [])];
                                                                        files[1] = e.target.files[0];
                                                                        field.onChange(files);
                                                                    }
                                                                }} 
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button 
                                                        type="button" 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => {
                                                            if (field.value && field.value.length === 2) {
                                                                setShowAadharUpload(false);
                                                            } else {
                                                                alert("Please upload both front and back images");
                                                            }
                                                        }}
                                                    >
                                                        Done
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border rounded-md bg-[#F8F7FF] p-4">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    {aadharDocuments.map((doc, index) => (
                                                        <div key={index} className="flex items-center gap-3 p-3 border rounded-md bg-white flex-1">
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <FileIcon className="h-8 w-8 text-blue-500" />
                                                                <div>
                                                                    <p className="text-sm font-medium">{doc.name}</p>
                                                                    <p className="text-xs text-gray-500">Click to view</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end mt-3">
                                                    <Button 
                                                        type="button" 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => setShowAadharUpload(true)}
                                                    >
                                                        Change
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={() => {
                                const data = form.getValues();
                                onSubmit(data);
                            }}
                        >
                            <XIcon className="size-4 mr-2" />
                            Reject
                        </Button>
                        <Button 
                            type="button" 
                            variant="primary" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                                const data = form.getValues();
                                onSubmit(data);
                            }}
                        >
                            <CheckIcon className="size-4 mr-2" />
                            Approve
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default AdminKycDetails; 