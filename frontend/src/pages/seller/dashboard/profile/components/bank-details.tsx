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
import { BankDetailsInput, bankDetailsSchema } from "@/lib/validations/bank-details";
import { ServiceFactory } from "@/services/service-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface BankDetailsProps {
  onSave: () => void;
}

const BankDetails = ({ onSave }: BankDetailsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingCheque, setUploadingCheque] = useState(false);
  const [uploadedCheque, setUploadedCheque] = useState<{ url: string; filename: string } | null>(null);

  const form = useForm<BankDetailsInput>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      branchName: "",
      accountType: "",
      ifscCode: "",
    },
  });

  const handleChequeUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setUploadingCheque(true);

      const response = await ServiceFactory.seller.profile.uploadCancelledCheque(file);

      if (response.success) {
        setUploadedCheque({
          url: response.data.documentUrl,
          filename: file.name
        });

        toast.success("Cancelled cheque uploaded successfully to S3!");
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

  const onSubmit = async (data: BankDetailsInput) => {
    try {
      setIsLoading(true);
      const response = await ServiceFactory.seller.profile.update({
        bankDetails: {
          bankName: data.bankName,
          accountHolderName: data.accountName,
          accountNumber: data.accountNumber,
          branchName: data.branchName,
          accountType: data.accountType,
          ifscCode: data.ifscCode,
          cancelledCheque: uploadedCheque ? {
            status: 'pending',
            url: uploadedCheque.url
          } : undefined
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update bank details');
      }

      toast.success('Bank details updated successfully');
      onSave();
    } catch (error) {
      console.error('Error updating bank details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update bank details');
    } finally {
      setIsLoading(false);
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
                      placeholder="Enter your bank name"
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
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Type *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-[#F8F7FF]">
                        <SelectValue placeholder="-Account Type-" />
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
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    IFSC code *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter IFSC code"
                      className="bg-[#F8F7FF] uppercase"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancelledChequeImage"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>
                    Cancelled Cheque Image *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="bg-[#F8F7FF] file:bg-main file:text-white file:border-0 file:text-xs file:rounded-md file:px-3 file:py-1.5 file:mr-4 hover:file:bg-main/90"
                        onChange={(e) => {
                          onChange(e.target.files);
                          handleChequeUpload(e.target.files);
                        }}
                        disabled={uploadingCheque}
                        {...field}
                      />
                      {uploadingCheque && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading to S3...
                        </div>
                      )}
                      {uploadedCheque && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {uploadedCheque.filename} uploaded successfully ✓
                        </div>
                      )}
                    </div>
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

export default BankDetails;
