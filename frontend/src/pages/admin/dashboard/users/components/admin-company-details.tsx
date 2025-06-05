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
import { CompanyDetailsInput, companyDetailsSchema } from "@/lib/validations/admin-user";
import { ServiceFactory } from "@/services/service-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

interface AdminCompanyDetailsProps {
  onSave: (message?: string) => void;
}

const AdminCompanyDetails = ({ onSave }: AdminCompanyDetailsProps) => {
  const { id } = useParams();

  const form = useForm<CompanyDetailsInput>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      companyCategory: "",
      companyName: "",
      sellerName: "",
      email: "",
      contactNumber: ""
    },
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!id) return;
      try {
        console.log('🔍 Fetching company details for ID:', id);

        // Use the correct admin API endpoint
        const response = await ServiceFactory.admin.getTeamMember(id);
        console.log('📡 Full API Response:', response);

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

          console.log('🏢 Extracted seller data:', sellerData);

          if (sellerData) {
            const formData = {
              companyCategory: sellerData.companyCategory || "",
              companyName: sellerData.businessName || sellerData.companyName || "",
              sellerName: sellerData.name || "",
              email: sellerData.email || "",
              contactNumber: sellerData.phone || sellerData.supportContact || ""
            };

            console.log('📝 Form data to populate:', formData);

            // Validate the data before setting
            if (formData.contactNumber && formData.contactNumber.length < 10) {
              console.warn('⚠️ Contact number too short:', formData.contactNumber);
              // Try to use supportContact if phone is too short
              if (sellerData.supportContact && sellerData.supportContact.replace(/\D/g, '').length >= 10) {
                formData.contactNumber = sellerData.supportContact.replace(/\D/g, '').slice(-10);
                console.log('✅ Using cleaned support contact:', formData.contactNumber);
              }
            }

            form.reset(formData);
            console.log('✅ Form populated successfully');
          } else {
            console.warn('⚠️ No seller data found in response');
          }
        } else {
          console.error('❌ API request failed or no data:', response);
        }
      } catch (error) {
        console.error('❌ Error fetching company details:', error);

        // Try to extract more details from the error
        if (error.response) {
          console.error('📡 Error response:', error.response);
        }
      }
    };
    fetchCompanyDetails();
  }, [id, form]);

  const onSubmit = async (data: CompanyDetailsInput) => {
    if (!id) return;
    try {
      await ServiceFactory.admin.updateTeamMember(id, {
        businessName: data.companyName,
        companyCategory: data.companyCategory,
        name: data.sellerName,
        email: data.email,
        phone: data.contactNumber
      });
      onSave("Company details saved successfully");
    } catch (error) {
      console.error('Failed to save company details:', error);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="companyCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company Category *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#F8F7FF]">
                        <SelectValue placeholder="Select company category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Electronics & Technology">Electronics & Technology</SelectItem>
                      <SelectItem value="Fashion & Apparel">Fashion & Apparel</SelectItem>
                      <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                      <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                      <SelectItem value="Sports & Outdoors">Sports & Outdoors</SelectItem>
                      <SelectItem value="Books & Media">Books & Media</SelectItem>
                      <SelectItem value="Automotive">Automotive</SelectItem>
                      <SelectItem value="Food & Beverages">Food & Beverages</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter company name"
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
              name="sellerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Seller Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter seller name"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Address *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
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
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Contact Number *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter contact number"
                      className="bg-[#F8F7FF]"
                      {...field}
                    />
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

export default AdminCompanyDetails;
