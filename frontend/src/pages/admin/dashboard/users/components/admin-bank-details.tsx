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
import { BankDetailsInput, bankDetailsSchema } from "@/lib/validations/admin-user";
import { ServiceFactory } from "@/services/service-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, FileIcon, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

interface AdminBankDetailsProps {
  onSave: (message?: string) => void;
}

const AdminBankDetails = ({ onSave }: AdminBankDetailsProps) => {
  const { id } = useParams();
  const [showChequeUpload, setShowChequeUpload] = useState(false);
  const [existingCheque, setExistingCheque] = useState<{ url: string; status: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mongoId, setMongoId] = useState<string | null>(null); // Store the MongoDB ObjectId

  const form = useForm<BankDetailsInput>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      branchName: "",
      ifscCode: "",
      cancelledChequeImage: undefined
    },
  });

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!id) return;
      try {
        console.log('🏦 Fetching bank details for ID:', id);

        const response = await ServiceFactory.admin.getTeamMember(id);
        console.log('📡 Full Bank API Response:', response);

        if (response.success && response.data) {
          console.log('✅ API Success, response.data:', response.data);

          // Handle nested response structure for sellers
          let sellerData = null;

          if (response.data.seller) {
            console.log('📊 Found nested seller data');
            sellerData = response.data.seller;
          } else if (response.data.data && response.data.data.seller) {
            console.log('📊 Found double nested seller data');
            sellerData = response.data.data.seller;
          } else {
            console.log('📊 Using direct data as seller data');
            sellerData = response.data;
          }

          console.log('🏦 Extracted seller data:', sellerData);

          // Extract and store the MongoDB ObjectId
          const sellerId = sellerData._id || sellerData.id;
          if (sellerId) {
            setMongoId(sellerId);
            console.log('🆔 Extracted MongoDB ObjectId:', sellerId);
          } else {
            console.error('❌ No MongoDB ObjectId found in seller data');
          }

          if (sellerData && sellerData.bankDetails) {
            console.log('💳 Found bankDetails:', sellerData.bankDetails);

            // bankDetails is now a single object, not an array
            const bankAccount = sellerData.bankDetails;
            console.log('🏧 Bank account to use:', bankAccount);

            if (bankAccount && typeof bankAccount === 'object') {
              const formData = {
                bankName: bankAccount.bankName || "",
                accountName: bankAccount.accountHolderName || bankAccount.accountName || "",
                accountNumber: bankAccount.accountNumber || "",
                branchName: bankAccount.branchName || bankAccount.branch || "",
                ifscCode: bankAccount.ifscCode || "",
              };

              console.log('📝 Bank form data to populate:', formData);
              form.reset(formData);

              // Check for existing cancelled cheque
              if (bankAccount.cancelledCheque?.url) {
                setExistingCheque({
                  url: bankAccount.cancelledCheque.url,
                  status: bankAccount.cancelledCheque.status || 'pending'
                });
                console.log('📄 Found existing cancelled cheque:', bankAccount.cancelledCheque);
              }

              console.log('✅ Bank form populated successfully');
            } else {
              console.warn('⚠️ No valid bank account found');
            }
          } else {
            console.warn('⚠️ No bankDetails found in seller data');
          }
        } else {
          console.error('❌ API request failed or no data:', response);
        }
      } catch (error: any) {
        console.error('❌ Error fetching bank details:', error);

        // Try to extract more details from the error
        if (error.response) {
          console.error('📡 Error response:', error.response);
        }
      }
    };
    fetchBankDetails();
  }, [id, form]);

  const handleViewCheque = async () => {
    if (!existingCheque?.url) return;

    try {
      // If it's already a full URL, open it directly
      if (existingCheque.url.startsWith('http')) {
        window.open(existingCheque.url, '_blank');
      } else {
        // If it's a relative path, we might need to get a signed URL
        // For now, try to construct the full URL
        const fullUrl = existingCheque.url.startsWith('/')
          ? `${window.location.origin}${existingCheque.url}`
          : existingCheque.url;
        window.open(fullUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing cheque:', error);
      toast.error('Failed to open document');
    }
  };

  const handleVerifyCheque = async (status: 'verified' | 'rejected') => {
    if (!mongoId || !existingCheque) {
      console.error('❌ Missing MongoDB ObjectId or cancelled cheque data');
      toast.error('Unable to verify: Missing required data');
      return;
    }

    try {
      setIsVerifying(true);

      console.log('🔍 Using MongoDB ObjectId for verification:', mongoId);

      // Simple payload - just update the cancelled cheque status
      const payload = {
        bankDetails: {
          cancelledCheque: {
            url: existingCheque.url,
            status: status
          }
        }
      };

      await ServiceFactory.admin.updateSellerBankDetails(mongoId, payload);

      setExistingCheque(prev => prev ? { ...prev, status } : null);

      const message = status === 'verified'
        ? 'Cancelled cheque verified successfully'
        : 'Cancelled cheque rejected';

      toast.success(message);
      onSave(message);

    } catch (error: any) {
      console.error('❌ Verification error:', error);
      toast.error(`Failed to ${status === 'verified' ? 'verify' : 'reject'} cancelled cheque. Please try again.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: BankDetailsInput) => {
    if (!mongoId) {
      console.error('❌ Missing MongoDB ObjectId for bank details update');
      onSave('Unable to save: Missing required data');
      return;
    }

    try {
      console.log('🔍 Using MongoDB ObjectId for bank details update:', mongoId);

      // Create bank details payload in the format expected by the new endpoint
      const bankDetailsPayload = {
        accountType: "Current Account", // Default for business accounts
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        accountHolderName: data.accountName,
        branchName: data.branchName,
        // Preserve existing cancelled cheque if no new one is uploaded
        cancelledCheque: existingCheque || {
          status: 'pending',
          url: '/documents/admin-updated-bank-details.pdf'
        }
      };

      // Use the new proper admin endpoint
      await ServiceFactory.admin.updateSellerBankDetails(mongoId, bankDetailsPayload);
      onSave("Bank details saved successfully");
    } catch (err: any) {
      console.error('❌ Bank details save error:', err);
      onSave(`Failed to save bank details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Bank Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter bank name"
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
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter account name"
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
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Number *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter account number"
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
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Branch Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter branch name"
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
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    IFSC Code *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter IFSC code"
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
              name="cancelledChequeImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cancelled Cheque Document
                  </FormLabel>
                  <FormControl>
                    {existingCheque && !showChequeUpload ? (
                      <div className="space-y-2">
                        {/* Display existing document */}
                        <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F8F7FF]">
                          <div className="flex items-center gap-2 flex-1">
                            <FileIcon className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">Cancelled Cheque</p>
                              <p className="text-xs text-gray-500">
                                Status: <span className={`font-medium ${existingCheque.status === 'verified' ? 'text-green-600' :
                                  existingCheque.status === 'pending' ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                  {existingCheque.status}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleViewCheque}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {existingCheque.status === 'pending' && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleVerifyCheque('verified')}
                                  disabled={isVerifying}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleVerifyCheque('rejected')}
                                  disabled={isVerifying}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setShowChequeUpload(true)}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                        {existingCheque.status === 'verified' && (
                          <div className="text-xs text-green-600 font-medium">
                            ✅ Document verified by admin
                          </div>
                        )}
                        {existingCheque.status === 'rejected' && (
                          <div className="text-xs text-red-600 font-medium">
                            ❌ Document rejected by admin
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
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
                          <input id="dropzone-file" type="file" className="hidden" onChange={(e) => {
                            if (e.target.files?.[0]) {
                              field.onChange(e.target.files[0]);
                              setShowChequeUpload(false);
                            }
                          }} />
                        </label>
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
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminBankDetails;
