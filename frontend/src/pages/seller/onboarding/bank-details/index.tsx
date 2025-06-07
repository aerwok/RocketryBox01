import UploadModal from "@/components/shared/upload-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { sellerBankSchema, type SellerBankInput } from "@/lib/validations/seller";
import { ServiceFactory } from "@/services/service-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const features = [
  "Branded Order Tracking Page",
  "Automated NDR Management",
  "Up To 45% Lesser RTOs",
];

const SellerBankDetailsPage = () => {
  const location = useLocation();
  const { isOnboarding } = location.state || {};

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadingCheque, setUploadingCheque] = useState<boolean>(false);
  const [uploadedCheque, setUploadedCheque] = useState<{ url: string; filename: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If we're in the onboarding flow, show a message
    if (isOnboarding) {
      toast.success("Company details saved! Now let's set up your banking information.");
    }
  }, [isOnboarding]);

  const form = useForm<SellerBankInput>({
    resolver: zodResolver(sellerBankSchema),
    defaultValues: {
      accountType: "",
      bankName: "",
      accountNumber: "",
      accountHolderName: "",
      branchName: "",
      ifscCode: "",
      acceptTerms: false,
    },
  });

  const handleS3Upload = async (file: File) => {
    try {
      setUploadingCheque(true);

      const response = await ServiceFactory.seller.profile.uploadCancelledCheque(file);

      if (response.success) {
        // Update uploaded cheque state
        setUploadedCheque({
          url: response.data.documentUrl,
          filename: file.name
        });

        // Update form data
        form.setValue('cancelledChequeDocument', file);

        toast.success("Cancelled cheque uploaded successfully to S3!");
        setIsDialogOpen(false);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading cancelled cheque:', error);
      toast.error(`Failed to upload cancelled cheque: ${error.message}`);
    } finally {
      setUploadingCheque(false);
    }
  };

  const onSubmit = async (data: SellerBankInput) => {
    try {
      setIsLoading(true);

      // Check if cancelled cheque document is uploaded
      if (!uploadedCheque?.url) {
        toast.error("Please upload cancelled cheque document");
        setIsLoading(false);
        return;
      }

      console.log("Submitting bank details:", data);

      // Use the actual S3 URL for bank details
      const bankDetails = {
        accountType: data.accountType,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolderName: data.accountHolderName,
        branchName: data.branchName,
        ifscCode: data.ifscCode,
        cancelledCheque: {
          url: uploadedCheque.url,
          status: 'pending'
        }
      };

      console.log("Bank details with S3 URL:", bankDetails);

      // 🐛 DEBUG: Log validation details
      console.log("🔍 VALIDATION DEBUG:", {
        ifscCode: {
          value: data.ifscCode,
          length: data.ifscCode?.length,
          isUppercase: data.ifscCode === data.ifscCode?.toUpperCase(),
          pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode || ''),
          expected: "Format: BANK0XXXXXX (11 chars, 5th char must be '0')"
        },
        accountNumber: {
          value: data.accountNumber,
          length: data.accountNumber?.length,
          isOnlyDigits: /^\d+$/.test(data.accountNumber || ''),
          expected: "Only digits, 9-18 characters"
        },
        cancelledCheque: {
          hasUrl: !!uploadedCheque?.url,
          url: uploadedCheque?.url,
          expected: "Valid URL required"
        }
      });

      // FIXED: Call actual API to save bank details using the correct seller service
      const response = await ServiceFactory.seller.profile.updateBankDetails(bankDetails);

      if (!response.success) {
        throw new Error(response.message || 'Failed to save bank details');
      }

      console.log("✅ Bank details saved successfully:", response);
      toast.success("Bank details saved successfully! Your account setup is complete.");

      // Show account setup complete message if in onboarding flow
      if (isOnboarding) {
        toast.success("Your account is ready! Redirecting to dashboard...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Navigate to seller dashboard
      navigate('/seller/dashboard');
    } catch (error: any) {
      console.error("Error saving bank details:", error);

      // 🚨 Enhanced error logging
      if (error?.status === 400) {
        console.error("🚨 VALIDATION ERROR DETAILS:", {
          status: error.status,
          message: error.message,
          details: error.details,
          data: error.data
        });
        toast.error(`Validation Error: ${error.message || 'Please check your input format'}`);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to save bank details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = (file: File) => {
    handleS3Upload(file);
  };

  return (
    <div className="h-full min-h-[calc(100dvh-4rem)] bg-white">
      <div className="container mx-auto p-4 h-full">
        {isOnboarding && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Company details saved! Complete your banking information to finish setup.</span>
            </div>
            <div className="mt-2 text-sm text-green-600">
              <span>Step 2 of 2: Bank Details</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12 place-items-center w-full h-full">
          {/* Left Side */}
          <div className="space-y-6 order-2 lg:order-1 flex flex-col justify-start w-full h-full">
            <div className="space-y-4">
              <h1 className="text-2xl lg:text-3xl font-semibold text-[#2B4EA8] italic">
                Transforming Shipping with US!
              </h1>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-main flex items-center justify-center">
                      <ArrowRight className="size-4 text-white" />
                    </div>
                    <p className="text-lg">{feature}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-500">
                Trusted by more than 1 lakh+ brands
              </p>
            </div>
            <div className="relative h-[400px] mr-auto">
              <img
                src="/images/seller/details.png"
                alt="Bank Details"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:px-6 w-full order-1 lg:order-2 h-full">
            <div className="flex-1 mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-semibold mb-2">
                {isOnboarding ? "Final Step: Banking Details" : (
                  <>
                    <span className="text-green-500">B</span>
                    <span>ank</span>
                    {" "}
                    <span className="text-green-500">A</span>
                    <span>ccount</span>
                    {" "}
                    <span className="text-green-500">D</span>
                    <span>etails</span>
                  </>
                )}
              </h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-8">
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#99BCDDB5]">
                            <SelectValue placeholder="Savings/Current" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bank Name"
                          className="bg-[#99BCDDB5]"
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
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Account Number (digits only, 9-18 chars)"
                          className="bg-[#99BCDDB5]"
                          {...field}
                          onChange={(e) => {
                            // Allow only digits
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <p className="text-xs text-gray-600">
                          Length: {field.value.length}/18 chars
                          {field.value.length < 9 && " (minimum 9)"}
                          {field.value.length > 18 && " (maximum 18)"}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Account Name"
                          className="bg-[#99BCDDB5]"
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
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Branch Name"
                          className="bg-[#99BCDDB5]"
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
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="BANK0XXXXXX (11 chars, 5th char must be 0)"
                          className="bg-[#99BCDDB5]"
                          {...field}
                          onChange={(e) => {
                            // Convert to uppercase and limit to 11 chars
                            const value = e.target.value.toUpperCase().slice(0, 11);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <div className="text-xs">
                          <p className={`${field.value.length === 11 ? 'text-green-600' : 'text-red-600'}`}>
                            Length: {field.value.length}/11 chars
                          </p>
                          {field.value.length >= 5 && (
                            <p className={`${field.value[4] === '0' ? 'text-green-600' : 'text-red-600'}`}>
                              5th character: '{field.value[4]}' {field.value[4] === '0' ? '✓' : '(must be 0)'}
                            </p>
                          )}
                          {field.value.length === 11 && (
                            <p className={`${/^[A-Z]{4}0[A-Z0-9]{6}$/.test(field.value) ? 'text-green-600' : 'text-red-600'}`}>
                              Format: {/^[A-Z]{4}0[A-Z0-9]{6}$/.test(field.value) ? 'Valid ✓' : 'Invalid ✗'}
                            </p>
                          )}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          By Clicking Your Create Account, You Agree to RocketryBox's{" "}
                          <a href="#" className="text-[#2B4EA8]">Terms & Conditions</a>
                          {" "}And{" "}
                          <a href="#" className="text-[#2B4EA8]">Privacy Policy</a>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className={`border-0 w-full ${uploadedCheque
                      ? "bg-green-100 hover:bg-green-200 text-green-700"
                      : "bg-[#99BCDDB5] hover:bg-[#99BCDDB5]/50"
                      }`}
                    onClick={() => setIsDialogOpen(true)}
                    disabled={uploadingCheque}
                  >
                    {uploadingCheque ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading to S3...
                      </>
                    ) : uploadedCheque ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {uploadedCheque.filename} uploaded ✓
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Upload Cheque/PassBook/Bank Statement
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-[#2B4EA8] hover:bg-[#2B4EA8]/90 text-white"
                    disabled={!form.watch("acceptTerms") || isLoading}
                  >
                    {isLoading ? "Processing..." : (isOnboarding ? "Complete Setup & Go to Dashboard" : "Create Account")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <UploadModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Upload Bank Document"
        onUpload={handleUpload}
      />
    </div>
  );
};

export default SellerBankDetailsPage;
