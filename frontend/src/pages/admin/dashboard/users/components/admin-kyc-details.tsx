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
import { ServiceFactory } from "@/services/service-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";

// Define schema for KYC details
const kycDetailsSchema = z.object({
  gstNumber: z.string().min(15, "GST number must be 15 characters").max(15, "GST number must be 15 characters").optional(),
  gstDocument: z.instanceof(File).optional(),
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

  // Track the current KYC status
  const [currentStatus, setCurrentStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const [gstDocument, setGstDocument] = useState<{ name: string; url: string; status?: string } | null>(null);
  const [panDocument, setPanDocument] = useState<{ name: string; url: string; status?: string } | null>(null);
  const [aadharDocuments, setAadharDocuments] = useState<Array<{ name: string; url: string; status?: string }>>([]);
  const [mongoId, setMongoId] = useState<string | null>(null); // Store the MongoDB ObjectId

  const form = useForm<KycDetailsInput>({
    resolver: zodResolver(kycDetailsSchema),
    defaultValues: {
      gstNumber: "",
      panNumber: "",
      aadharNumber: "",
      kycStatus: currentStatus,
      aadharImages: [],
    },
  });

  useEffect(() => {
    const fetchKycDetails = async () => {
      if (!id) return;
      try {
        console.log('🔍 Fetching KYC details for ID:', id);
        const response = await ServiceFactory.admin.getTeamMember(id);
        console.log('📡 KYC API Response:', response);

        if (response.success && response.data) {
          // Handle nested response structure for sellers
          let sellerData = null;

          if (response.data.seller) {
            sellerData = response.data.seller;
          } else if (response.data.data?.seller) {
            sellerData = response.data.data.seller;
          } else {
            sellerData = response.data;
          }

          console.log('📋 Seller data for KYC:', sellerData);

          // Extract and store the MongoDB ObjectId
          const sellerId = sellerData._id || sellerData.id;
          if (sellerId) {
            setMongoId(sellerId);
            console.log('🆔 Extracted MongoDB ObjectId for KYC:', sellerId);
          } else {
            console.error('❌ No MongoDB ObjectId found in seller data for KYC');
          }

          if (sellerData) {
            console.log('📄 KYC Documents found:', sellerData.documents);

            // Extract real KYC details from seller documents
            const gstNumber = sellerData.documents?.gstin?.number || "";
            const panNumber = sellerData.documents?.pan?.number || "";
            const aadharNumber = sellerData.documents?.aadhaar?.number || "";

            // Determine overall KYC status based on document statuses
            const gstStatus = sellerData.documents?.gstin?.status || "pending";
            const panStatus = sellerData.documents?.pan?.status || "pending";
            const aadharStatus = sellerData.documents?.aadhaar?.status || "pending";

            let overallKycStatus = "pending";
            if (gstStatus === "verified" && panStatus === "verified" && aadharStatus === "verified") {
              overallKycStatus = "approved";
            } else if (gstStatus === "rejected" || panStatus === "rejected" || aadharStatus === "rejected") {
              overallKycStatus = "rejected";
            }

            const kycDetails = {
              gstNumber,
              panNumber,
              aadharNumber,
              kycStatus: overallKycStatus as "pending" | "approved" | "rejected"
            };

            console.log('📋 Extracted KYC details:', kycDetails);

            form.reset(kycDetails);
            setCurrentStatus(kycDetails.kycStatus);

            // Set GST document if available
            if (sellerData.documents?.gstin?.url) {
              setGstDocument({
                name: 'GST Certificate Document',
                url: sellerData.documents.gstin.url,
                status: sellerData.documents.gstin.status
              });
              console.log('📄 GST document found:', sellerData.documents.gstin);
            } else {
              setGstDocument(null);
              console.log('📄 No GST document found');
            }

            // Set PAN document if available
            if (sellerData.documents?.pan?.url) {
              setPanDocument({
                name: 'PAN Card Document',
                url: sellerData.documents.pan.url,
                status: sellerData.documents.pan.status
              });
              console.log('📄 PAN document found:', sellerData.documents.pan);
            } else {
              setPanDocument(null);
              console.log('📄 No PAN document found');
            }

            // Set Aadhaar document if available
            if (sellerData.documents?.aadhaar?.url) {
              setAadharDocuments([{
                name: 'Aadhaar Card Document',
                url: sellerData.documents.aadhaar.url,
                status: sellerData.documents.aadhaar.status
              }]);
              console.log('📄 Aadhaar document found:', sellerData.documents.aadhaar);
            } else {
              setAadharDocuments([]);
              console.log('📄 No Aadhaar document found');
            }
          } else {
            console.log('⚠️ No seller data found');
            // Reset to empty state instead of mock data
            setGstDocument(null);
            setPanDocument(null);
            setAadharDocuments([]);
          }
        } else {
          console.error('❌ Failed to fetch KYC details');
          // Reset to empty state instead of mock data
          setGstDocument(null);
          setPanDocument(null);
          setAadharDocuments([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch KYC details:', error);
        // Reset to empty state instead of mock data
        setGstDocument(null);
        setPanDocument(null);
        setAadharDocuments([]);
      }
    };
    fetchKycDetails();
  }, [id, form]);

  const handleDocumentVerification = async (documentType: 'gstin' | 'pan' | 'aadhaar', status: 'verified' | 'rejected') => {
    if (!mongoId) {
      console.error('❌ Missing MongoDB ObjectId for KYC verification');
      onSave('Unable to verify: Missing required data');
      return;
    }

    try {
      console.log(`📝 ${status === 'verified' ? 'Verifying' : 'Rejecting'} ${documentType} document for seller ${mongoId}`);
      console.log('🔍 Using MongoDB ObjectId for KYC verification:', mongoId);

      // Call the KYC update API
      await ServiceFactory.admin.updateSellerKYC(mongoId, {
        status: status === 'verified' ? 'approved' : 'rejected',
        documentType,
        comments: `${documentType.toUpperCase()} document ${status} by admin`
      });

      // Update local state
      if (documentType === 'gstin' && gstDocument) {
        setGstDocument(prev => prev ? { ...prev, status } : null);
      } else if (documentType === 'pan' && panDocument) {
        setPanDocument(prev => prev ? { ...prev, status } : null);
      } else if (documentType === 'aadhaar' && aadharDocuments.length > 0) {
        setAadharDocuments(prev => prev.map(doc => ({ ...doc, status })));
      }

      // Update overall KYC status
      const newGstStatus = documentType === 'gstin' ? status : gstDocument?.status || 'pending';
      const newPanStatus = documentType === 'pan' ? status : panDocument?.status || 'pending';
      const newAadharStatus = documentType === 'aadhaar' ? status : aadharDocuments[0]?.status || 'pending';

      console.log('📊 Checking overall KYC status:', {
        gst: newGstStatus,
        pan: newPanStatus,
        aadhaar: newAadharStatus
      });

      let newOverallStatus: 'pending' | 'approved' | 'rejected' = 'pending';
      if (newGstStatus === 'verified' && newPanStatus === 'verified' && newAadharStatus === 'verified') {
        newOverallStatus = 'approved';
        console.log('✅ All documents verified - KYC approved!');
      } else if (newGstStatus === 'rejected' || newPanStatus === 'rejected' || newAadharStatus === 'rejected') {
        newOverallStatus = 'rejected';
        console.log('❌ At least one document rejected - KYC rejected!');
      } else {
        console.log('⏳ Documents still pending - KYC remains pending');
      }

      // Update UI state
      setCurrentStatus(newOverallStatus);
      form.setValue('kycStatus', newOverallStatus);

      // If all documents are verified or any is rejected, update the overall seller KYC status
      if (newOverallStatus === 'approved' || newOverallStatus === 'rejected') {
        try {
          console.log(`🔄 Updating overall seller KYC status to: ${newOverallStatus}`);
          if (mongoId) {
            await ServiceFactory.admin.updateSellerKYC(mongoId, {
              status: newOverallStatus,
              comments: `Overall KYC ${newOverallStatus} - all documents processed`
            });
            console.log('✅ Overall seller KYC status updated successfully');
          }
        } catch (overallError) {
          console.error('❌ Failed to update overall seller KYC status:', overallError);
        }
      }

      const message = `${documentType.toUpperCase()} document ${status === 'verified' ? 'verified' : 'rejected'} successfully`;
      onSave(message);

    } catch (error: any) {
      console.error(`❌ Error ${status === 'verified' ? 'verifying' : 'rejecting'} ${documentType} document:`, error);
      onSave(`Failed to ${status === 'verified' ? 'verify' : 'reject'} ${documentType} document`);
    }
  };

  const onSubmit = async (data: KycDetailsInput) => {
    if (!mongoId) {
      console.error('❌ Missing MongoDB ObjectId for KYC update');
      onSave('Unable to save: Missing required data');
      return;
    }

    try {
      console.log('🔍 Using MongoDB ObjectId for KYC update:', mongoId);
      await ServiceFactory.admin.updateTeamMember(mongoId, {
        kycDetails: {
          ...data,
          gstDocument,
          panDocument,
          aadharDocuments
        }
      });
      onSave("KYC details saved successfully");
    } catch (error) {
      console.error('Failed to save KYC details:', error);
      onSave('Failed to save KYC details');
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
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    GST Number *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter GST number"
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
              render={({ field: _ }) => (
                <FormItem>
                  <FormLabel>
                    GST Certificate Document
                  </FormLabel>
                  <FormControl>
                    {gstDocument ? (
                      <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F8F7FF]">
                        <div className="flex items-center gap-2 flex-1">
                          <FileIcon className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{gstDocument.name}</p>
                            <p className="text-xs text-gray-500">
                              Status: <span className={`font-medium ${gstDocument.status === 'verified' ? 'text-green-600' :
                                gstDocument.status === 'rejected' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                {gstDocument.status || 'pending'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(gstDocument.url, '_blank')}
                          >
                            View
                          </Button>
                          {gstDocument.status === 'pending' && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleDocumentVerification('gstin', 'verified')}
                              >
                                Verify
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleDocumentVerification('gstin', 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <p className="text-gray-500">No GST document uploaded</p>
                      </div>
                    )}
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
              render={({ field: _ }) => (
                <FormItem>
                  <FormLabel>
                    PAN Card Document
                  </FormLabel>
                  <FormControl>
                    {panDocument ? (
                      <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F8F7FF]">
                        <div className="flex items-center gap-2 flex-1">
                          <FileIcon className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{panDocument.name}</p>
                            <p className="text-xs text-gray-500">
                              Status: <span className={`font-medium ${panDocument.status === 'verified' ? 'text-green-600' :
                                panDocument.status === 'rejected' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                {panDocument.status || 'pending'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(panDocument.url, '_blank')}
                          >
                            View
                          </Button>
                          {panDocument.status === 'pending' && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleDocumentVerification('pan', 'verified')}
                              >
                                Verify
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleDocumentVerification('pan', 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <p className="text-gray-500">No PAN document uploaded</p>
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
                      placeholder="Enter Aadhaar number"
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
              render={({ field: _ }) => (
                <FormItem className="col-span-2">
                  <FormLabel>
                    Aadhaar Card Document
                  </FormLabel>
                  <FormControl>
                    {aadharDocuments && aadharDocuments.length > 0 ? (
                      <div className="border rounded-md bg-[#F8F7FF] p-4">
                        <div className="flex flex-col gap-4">
                          {aadharDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 border rounded-md bg-white">
                              <div className="flex items-center gap-2 flex-1">
                                <FileIcon className="h-8 w-8 text-blue-500" />
                                <div>
                                  <p className="text-sm font-medium">{doc.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Status: <span className={`font-medium ${doc.status === 'verified' ? 'text-green-600' :
                                      doc.status === 'rejected' ? 'text-red-600' :
                                        'text-yellow-600'
                                      }`}>
                                      {doc.status || 'pending'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  View
                                </Button>
                                {doc.status === 'pending' && (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => handleDocumentVerification('aadhaar', 'verified')}
                                    >
                                      Verify
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={() => handleDocumentVerification('aadhaar', 'rejected')}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <p className="text-gray-500">No Aadhaar document uploaded</p>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminKycDetails;
