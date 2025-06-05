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
import { Upload } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

interface AdminBankDetailsProps {
  onSave: (message?: string) => void;
}

const AdminBankDetails = ({ onSave }: AdminBankDetailsProps) => {
  const { id } = useParams();

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

          if (sellerData && sellerData.bankDetails) {
            console.log('💳 Found bankDetails:', sellerData.bankDetails);

            // Get the first (primary) bank account
            let bankAccount = null;
            if (Array.isArray(sellerData.bankDetails) && sellerData.bankDetails.length > 0) {
              bankAccount = sellerData.bankDetails[0]; // Get first bank account
            } else if (sellerData.bankDetails && typeof sellerData.bankDetails === 'object') {
              bankAccount = sellerData.bankDetails; // Direct object
            }

            console.log('🏧 Bank account to use:', bankAccount);

            if (bankAccount) {
              const formData = {
                bankName: bankAccount.bankName || "",
                accountName: bankAccount.accountHolderName || bankAccount.accountName || "",
                accountNumber: bankAccount.accountNumber || "",
                branchName: bankAccount.branchName || bankAccount.branch || "",
                ifscCode: bankAccount.ifscCode || "",
              };

              console.log('📝 Bank form data to populate:', formData);
              form.reset(formData);
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
      } catch (error) {
        console.error('❌ Error fetching bank details:', error);

        // Try to extract more details from the error
        if (error.response) {
          console.error('📡 Error response:', error.response);
        }
      }
    };
    fetchBankDetails();
  }, [id, form]);

  const onSubmit = async (data: BankDetailsInput) => {
    if (!id) return;
    try {
      console.log('💾 Saving bank details:', data);

      // Create bank details in the format expected by the seller schema
      const bankDetailsUpdate = {
        bankDetails: [{
          accountType: "Current Account", // Default for business accounts
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          accountHolderName: data.accountName,
          branchName: data.branchName,
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: 'Admin Team'
        }]
      };

      console.log('📝 Bank update payload:', bankDetailsUpdate);

      await ServiceFactory.admin.updateTeamMember(id, bankDetailsUpdate);
      console.log('✅ Bank details saved successfully');
      onSave("Bank details saved successfully");
    } catch (err: any) {
      console.error('❌ Failed to save bank details:', err);
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
                    Cancelled Cheque Image
                  </FormLabel>
                  <FormControl>
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
                          }
                        }} />
                      </label>
                    </div>
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
