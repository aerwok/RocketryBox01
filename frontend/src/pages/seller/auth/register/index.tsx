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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sellerRegisterSchema, type SellerRegisterInput } from "@/lib/validations/seller";
import { sellerAuthService } from "@/services/seller-auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const features = [
  "Automated NDR Management",
  "Branded Order Tracking Page",
  "Up To 45% Lesser RTOs",
];

const monthlyShipments = [
  "0-100",
  "101-500",
  "501-1000",
  "1001-5000",
  "5000+"
];

const SellerRegisterPage = () => {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const form = useForm<SellerRegisterInput>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      companyName: "",
      monthlyShipments: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SellerRegisterInput) => {
    try {
      setIsLoading(true);

      // Validate password requirements
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(data.password)) {
        form.setError("password", {
          type: "validation",
          message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
        });
        return;
      }

      // Validate phone number format (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(data.phone)) {
        form.setError("phone", {
          type: "validation",
          message: "Please provide a valid Indian phone number"
        });
        return;
      }

      // First check if the email/phone is already registered
      try {
        // Send same OTP to both email and phone for verification
        await sellerAuthService.sendOTP(data.email, 'register', { phone: data.phone });
        toast.success("Verification code sent to both email and SMS");

        // Navigate to OTP verification page with form data
        navigate("/seller/otp", {
          state: {
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            email: data.email,
            password: data.password,
            companyName: data.companyName,
            monthlyShipments: data.monthlyShipments
          }
        });
      } catch (error: any) {
        console.error("Failed to send OTP:", error);

        // Handle specific validation errors
        if (error.response?.data?.message) {
          if (error.response.data.message.includes('already registered')) {
            if (error.response.data.message.includes('email')) {
              form.setError("email", {
                type: "validation",
                message: "This email is already registered"
              });
            } else if (error.response.data.message.includes('phone')) {
              form.setError("phone", {
                type: "validation",
                message: "This phone number is already registered"
              });
            }
          } else {
            toast.error(error.response.data.message);
          }
        } else {
          toast.error("Failed to send verification code. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, message]) => {
          form.setError(field as keyof SellerRegisterInput, {
            type: "validation",
            message: message as string
          });
        });
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-white">
      <div className="container mx-auto p-4 h-full">
        <div className="grid lg:grid-cols-2 gap-12 place-items-center">
          {/* Left Content */}
          <div className="space-y-6 order-2 lg:order-1 flex flex-col justify-start w-full h-full">
            <div className="space-y-4">
              <h1 className="text-2xl lg:text-3xl font-semibold italic text-main">
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
              <p className="text-muted-foreground">
                Trusted by more than 1lakh+ brands
              </p>
            </div>
            <div className="relative h-[400px] mr-auto">
              <img
                src="/images/seller/register.png"
                alt="Register"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:px-6 w-full order-1 lg:order-2">
            <div className="flex-1 mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-semibold">
                Get Started With a Free Account
              </h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <div className="grid lg:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter first name"
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
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter last name"
                            className="bg-[#99BCDDB5]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          className="bg-[#99BCDDB5]"
                          maxLength={10}
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
                        Email id
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email id"
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
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Company Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company name"
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
                  name="monthlyShipments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Your Monthly Shipments
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#99BCDDB5]">
                            <SelectValue placeholder="Choose in the Range Filter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {monthlyShipments.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Create Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            className="bg-[#99BCDDB5]"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Enter password"
                            className="bg-[#99BCDDB5]"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
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
                          I have read and accept the privacy policy & conditions of use
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="customer"
                  className="w-full bg-[#2B4EA8] hover:bg-[#2B4EA8]/90"
                  disabled={!form.watch("acceptTerms") || isLoading}
                >
                  {isLoading ? "Processing..." : "Sign up for free"}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link to="/seller/login" className="text-[#2B4EA8] hover:underline">
                    Login
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
