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
import { sellerLoginSchema, type SellerLoginInput } from "@/lib/validations/seller";
import { sellerAuthService } from "@/services/seller-auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const features = [
    "Branded Order Tracking Page",
    "Automated NDR Management",
    "Up To 45% Lesser RTOs",
];

function SellerLoginPage() {

    const navigate = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const form = useForm<SellerLoginInput>({
        resolver: zodResolver(sellerLoginSchema),
        defaultValues: {
            emailOrPhone: "",
            password: "",
            rememberMe: false,
        }
    });

    // Debug form state changes
    useEffect(() => {
        const subscription = form.watch((value) => {
            console.log('Form values changed:', {
                ...value,
                password: value.password ? '***' : undefined
            });
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const onSubmit = async (data: SellerLoginInput) => {
        console.log('=== SELLER LOGIN DEBUG START ===');
        console.log('onSubmit function called with:', {
            emailOrPhone: data.emailOrPhone,
            hasPassword: !!data.password,
            rememberMe: data.rememberMe
        });

        // Normal login flow - validate required fields manually since schema is flexible
        if (!data.emailOrPhone?.trim()) {
            form.setError("emailOrPhone", {
                message: "Email or phone number is required",
            });
            toast.error('Please enter your email or phone number');
            return;
        }

        if (!data.password?.trim()) {
            form.setError("password", {
                message: "Password is required",
            });
            toast.error('Please enter your password');
            return;
        }

        try {
            console.log('🔄 Starting normal login flow...');
            
            setIsLoading(true);
            console.log('🚀 Calling sellerAuthService.login...');

            const loginData = {
                emailOrPhone: data.emailOrPhone,
                password: data.password,
                rememberMe: data.rememberMe || false
            };

            console.log('📝 Login request data:', {
                emailOrPhone: loginData.emailOrPhone,
                hasPassword: !!loginData.password,
                rememberMe: loginData.rememberMe
            });

            const response = await sellerAuthService.login(loginData);
            console.log('📥 Login response received:', {
                success: response.success,
                hasData: !!response.data,
                hasToken: !!(response.data?.accessToken),
                responseData: response.data,
                fullResponse: response
            });

            if (response.success && response.data?.accessToken) {
                console.log('✅ Login successful! Redirecting to dashboard...');
                toast.success('Welcome back!');
                // Brief delay to show the welcome message
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('🏠 Navigating to /seller/dashboard');
                navigate('/seller/dashboard');
            } else {
                console.warn('⚠️ Login response without success or token:', response);
                toast.error(response.message || 'Login failed. Please check your credentials.');
            }
        } catch (error: any) {
            console.error('💥 Login error occurred:', {
                name: error.name,
                message: error.message,
                status: error.status,
                code: error.code,
                response: error.response,
                stack: error.stack
            });

            if (error.status === 401) {
                console.log('🔒 Authentication failed - 401');
                toast.error('Invalid email/phone or password');
                form.setError('password', {
                    type: 'manual',
                    message: 'Invalid password'
                });
            } else if (error.status === 404) {
                console.log('👤 User not found - 404');
                toast.error('Account not found. Please check your email/phone or register a new account.');
                form.setError('emailOrPhone', {
                    type: 'manual',
                    message: 'Account not found with this email/phone'
                });
                // Add a helper message with registration link
                form.setError('root', {
                    type: 'manual',
                    message: 'Don\'t have an account? Register now!'
                });
            } else {
                console.log('❌ Other error:', error.message);
                toast.error(error.message || 'Login failed. Please try again.');
            }
        } finally {
            console.log('🏁 Login process completed, setting loading to false');
            setIsLoading(false);
            console.log('=== SELLER LOGIN DEBUG END ===');
        }
    };

    return (
        <div className="h-[calc(100dvh-4rem)] bg-white">
            <div className="container mx-auto p-4 h-full">
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
                                src="/images/seller/login.png"
                                alt="Login"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="lg:px-6 w-full order-1 lg:order-2 h-full">
                        <div className="flex-1 mx-auto text-center">
                            <h2 className="text-2xl lg:text-3xl font-semibold text-[#412A5F] mb-2">
                                Business User Login
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Login as a main seller or team member
                            </p>
                        </div>

                        <Form {...form}>
                            <form 
                                noValidate
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4 h-full"
                            >
                                <FormField
                                    control={form.control}
                                    name="emailOrPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email address/ Mobile Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    required
                                                    placeholder="Enter your email address or mobile number"
                                                    className="bg-[#99BCDDB5]"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        // Clear errors when user starts typing
                                                        form.clearErrors("emailOrPhone");
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        required
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your password"
                                                        className="bg-[#99BCDDB5]"
                                                        {...field}
                                                        value={field.value || ""}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            // Clear errors when user starts typing
                                                            form.clearErrors("password");
                                                        }}
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
                                            <div className="flex items-center justify-start">
                                                <FormField
                                                    control={form.control}
                                                    name="rememberMe"
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
                                                                    Remember me
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#2B4EA8] hover:bg-[#2B4EA8]/90 text-white"
                                        disabled={isLoading}
                                        onClick={(e) => {
                                            console.log('🖱️ Login button clicked directly');
                                            console.log('Form state:', form.getValues());
                                            console.log('Form errors:', form.formState.errors);
                                            console.log('Form valid:', form.formState.isValid);
                                            
                                            // Bypass form validation and call onSubmit directly
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('🔄 Calling onSubmit directly...');
                                            onSubmit(form.getValues());
                                        }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                                Logging in...
                                            </>
                                        ) : (
                                            "Log In"
                                        )}
                                    </Button>
                                    
                                    {/* Team Member Info */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium text-blue-800">Team Members</p>
                                                <p className="text-blue-700">
                                                    Use your assigned email address and password provided by your admin to log in as a team member.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center text-sm text-gray-600">
                                    New Business?{" "}
                                    <Link to="/seller/register" className="text-[#2B4EA8] hover:underline">
                                        Create account
                                    </Link>
                                </div>

                                {/* Display any root level errors */}
                                {form.formState.errors.root && (
                                    <div className="text-sm text-red-600 flex items-center justify-between">
                                        <span>{form.formState.errors.root.message}</span>
                                        <Link 
                                            to="/seller/register" 
                                            className="text-[#2B4EA8] hover:underline font-medium"
                                        >
                                            Register Now
                                        </Link>
                                    </div>
                                )}
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SellerLoginPage; 