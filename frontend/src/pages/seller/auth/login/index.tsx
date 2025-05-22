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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const features = [
    "Branded Order Tracking Page",
    "Automated NDR Management",
    "Up To 45% Lesser RTOs",
];

interface ValidationError {
    response: {
        data: {
            errors: Record<string, string>;
        };
    };
}

function isValidationError(error: unknown): error is ValidationError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object' &&
        (error as any).response !== null &&
        'data' in (error as any).response &&
        typeof (error as any).response.data === 'object' &&
        (error as any).response.data !== null &&
        'errors' in (error as any).response.data &&
        typeof (error as any).response.data.errors === 'object'
    );
}

function SellerLoginPage() {

    const navigate = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState<string>("");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const form = useForm<SellerLoginInput>({
        resolver: zodResolver(sellerLoginSchema),
        defaultValues: {
            emailOrPhone: "",
            password: "",
            otp: "",
            newPassword: "",
            confirmPassword: "",
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

    const handleSendOTP = async () => {
        const emailOrPhone = form.watch("emailOrPhone");
        form.clearErrors("emailOrPhone");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(emailOrPhone);
        const phoneRegex = /^[0-9]{10}$/;
        const isPhone = phoneRegex.test(emailOrPhone);

        if (!emailOrPhone) {
            form.setError("emailOrPhone", {
                message: "Please enter an email address or phone number",
            });
            return;
        }

        if (!isEmail && !isPhone) {
            form.setError("emailOrPhone", {
                message: "Please enter a valid email address or phone number (10 digits)",
            });
            return;
        }

        try {
            setIsLoading(true);
            
            // Use the seller auth service to send OTP
            await sellerAuthService.sendOTP(emailOrPhone, 'reset-password');
            
            // For dev purposes, we'll still generate a mock OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            console.log("Generated OTP:", otp);
            setGeneratedOtp(otp);

            setIsOtpSent(true);
            setOtpTimer(30);
            form.setValue("otp", "");
            toast.success("OTP sent successfully!");
            setIsLoading(false);
        } catch (error) {
            console.error("Error sending OTP:", error);
            form.setError("emailOrPhone", {
                message: "Failed to send OTP. Please try again.",
            });
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: SellerLoginInput) => {
        console.log('onSubmit function called with:', {
            emailOrPhone: data.emailOrPhone,
            hasPassword: !!data.password,
            rememberMe: data.rememberMe
        });

        if (isForgotPassword) {
            if (!isOtpSent) {
                await handleSendOTP();
                return;
            }

            if (data.otp !== generatedOtp) {
                form.setError("otp", {
                    message: "Invalid OTP. Please try again.",
                });
                return;
            }

            if (!isOtpVerified) {
                try {
                    setIsLoading(true);
                    // Verify OTP with the server
                    await sellerAuthService.verifyOTP(
                        data.emailOrPhone || "", 
                        data.otp || "", 
                        'reset-password'
                    );
                    setIsOtpVerified(true);
                    toast.success("OTP verified successfully!");
                    setIsLoading(false);
                } catch (error) {
                    setIsLoading(false);
                    return;
                }
                return;
            }

            if (data.newPassword !== data.confirmPassword) {
                form.setError("confirmPassword", {
                    message: "Passwords do not match",
                });
                return;
            }
            
            try {
                setIsLoading(true);
                // Reset password with the server
                await sellerAuthService.resetPassword(
                    data.emailOrPhone || "", 
                    data.otp || "", 
                    data.newPassword || "", 
                    data.confirmPassword || ""
                );
                setIsLoading(false);
                toast.success("Password reset successfully! Please login with your new password.");
                handleBackToLogin();
            } catch (error) {
                setIsLoading(false);
            }
            return;
        }

        // Normal login flow
        try {
            if (!data.emailOrPhone || !data.password) {
                console.error('Missing required fields:', {
                    hasEmailOrPhone: !!data.emailOrPhone,
                    hasPassword: !!data.password
                });
                toast.error('Please fill in all required fields');
                return;
            }

            setIsLoading(true);
            console.log('Calling sellerAuthService.login...');

            const loginData = {
                emailOrPhone: data.emailOrPhone,
                password: data.password,
                rememberMe: data.rememberMe || false
            };

            console.log('Login request data:', {
                emailOrPhone: loginData.emailOrPhone,
                hasPassword: !!loginData.password,
                rememberMe: loginData.rememberMe
            });

            const response = await sellerAuthService.login(loginData);
            console.log('Login response received:', {
                success: response.success,
                hasData: !!response.data,
                hasToken: !!(response.data?.accessToken)
            });

            if (response.success && response.data?.accessToken) {
                toast.success('Welcome back!');
                // Brief delay to show the welcome message
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate('/seller/dashboard');
            } else {
                console.warn('Login response without success or token:', response);
                toast.error(response.message || 'Login failed. Please check your credentials.');
            }
        } catch (error: any) {
            console.error('Login error:', {
                name: error.name,
                message: error.message,
                status: error.status,
                code: error.code
            });

            if (error.status === 401) {
                toast.error('Invalid email/phone or password');
                form.setError('password', {
                    type: 'manual',
                    message: 'Invalid password'
                });
            } else if (error.status === 404) {
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
                toast.error(error.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    const handleForgotPassword = () => {
        setIsForgotPassword(true);
        form.setValue("password", "");
    };

    const handleBackToLogin = () => {
        setIsForgotPassword(false);
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setOtpTimer(0);
        form.setValue("otp", "");
        setGeneratedOtp("");
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
                            <h2 className="text-2xl lg:text-3xl font-semibold text-[#412A5F] mb-8">
                                {isForgotPassword ? "Reset Password" : "Business User Login"}
                            </h2>
                        </div>

                        <Form {...form}>
                            <form 
                                noValidate
                                onSubmit={form.handleSubmit(async (formData) => {
                                    console.log('Form submit event triggered');
                                    
                                    try {
                                        // Clear any existing errors
                                        form.clearErrors();
                                        
                                        // Validate required fields
                                        if (!formData.emailOrPhone) {
                                            form.setError("emailOrPhone", {
                                                type: "required",
                                                message: "Email or phone number is required"
                                            });
                                            return;
                                        }

                                        if (!formData.password) {
                                            form.setError("password", {
                                                type: "required",
                                                message: "Password is required"
                                            });
                                            return;
                                        }

                                        // Validate email/phone format
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        const phoneRegex = /^[0-9]{10}$/;
                                        if (!emailRegex.test(formData.emailOrPhone) && !phoneRegex.test(formData.emailOrPhone)) {
                                            form.setError("emailOrPhone", {
                                                type: "format",
                                                message: "Please enter a valid email address or phone number (10 digits)"
                                            });
                                            return;
                                        }

                                        // Validate password length
                                        if (formData.password.length < 6) {
                                            form.setError("password", {
                                                type: "minLength",
                                                message: "Password must be at least 6 characters"
                                            });
                                            return;
                                        }

                                        // Call the onSubmit function
                                        await onSubmit(formData);
                                    } catch (error: unknown) {
                                        console.error('Error in form submission:', error);
                                        
                                        // Handle specific validation errors
                                        if (isValidationError(error)) {
                                            const validationErrors = error.response.data.errors;
                                            Object.keys(validationErrors).forEach(field => {
                                                form.setError(field as keyof SellerLoginInput, {
                                                    type: "server",
                                                    message: validationErrors[field]
                                                });
                                            });
                                        } else {
                                            toast.error('An error occurred while submitting the form');
                                        }
                                    }
                                })}
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
                                                    placeholder="Enter email address/ mobile number"
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

                                {!isForgotPassword ? (
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
                                                            placeholder="Enter password"
                                                            className="bg-[#99BCDDB5]"
                                                            {...field}
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
                                                <div className="flex items-center justify-between">
                                                    {!isForgotPassword && (
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
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="text-sm text-red-500 hover:text-red-600 px-0"
                                                        onClick={handleForgotPassword}
                                                    >
                                                        Forgot password?
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <FormLabel>
                                                OTP
                                            </FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSendOTP}
                                                disabled={otpTimer > 0 || isLoading}
                                                size="sm"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : otpTimer > 0 ? (
                                                    `Resend in ${otpTimer}s`
                                                ) : (
                                                    "Send OTP"
                                                )}
                                            </Button>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="otp"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <InputOTP
                                                            maxLength={6}
                                                            {...field}
                                                            disabled={!isOtpSent}
                                                        >
                                                            <InputOTPGroup className="gap-2">
                                                                <InputOTPSlot index={0} className="bg-[#99BCDDB5] rounded-md w-8 h-8" />
                                                                <InputOTPSlot index={1} className="bg-[#99BCDDB5] rounded-md w-8 h-8" />
                                                                <InputOTPSlot index={2} className="bg-[#99BCDDB5] rounded-md w-8 h-8" />
                                                                <InputOTPSlot index={3} className="bg-[#99BCDDB5] rounded-md w-8 h-8" />
                                                                <InputOTPSlot index={4} className="bg-[#99BCDDB5] rounded-md w-8 h-8" />
                                                                <InputOTPSlot index={5} className="bg-[#99BCDDB5] rounded-md w-8 h-8" />
                                                            </InputOTPGroup>
                                                        </InputOTP>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#2B4EA8] hover:bg-[#2B4EA8]/90 text-white"
                                        disabled={isLoading || (isForgotPassword && !isOtpSent)}
                                        onClick={() => {
                                            console.log('Login button clicked');
                                            console.log('Form state:', form.getValues());
                                            console.log('Form errors:', form.formState.errors);
                                        }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="size-4 mr-2 animate-spin" />
                                                {isForgotPassword ? "Verifying..." : "Logging in..."}
                                            </>
                                        ) : (
                                            isForgotPassword ? "Reset Password" : "Log In"
                                        )}
                                    </Button>

                                    {isForgotPassword && (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="w-full text-[#2B4EA8]"
                                            onClick={handleBackToLogin}
                                        >
                                            Back to Login
                                        </Button>
                                    )}
                                </div>

                                {!isForgotPassword && (
                                    <>
                                        <div className="text-center text-sm text-gray-600">
                                            New User?{" "}
                                            <Link to="/seller/register" className="text-[#2B4EA8] hover:underline">
                                                Create account
                                            </Link>
                                        </div>
                                        <div className="text-center text-sm text-gray-600">
                                            <Link to="/seller/dashboard" className="text-[#2B4EA8] hover:underline">
                                                Go to Dashboard
                                            </Link>
                                        </div>
                                    </>
                                )}

                                {/* Testing Info Section */}
                                {process.env.NODE_ENV === 'development' && isForgotPassword && (
                                    <div className="mt-8 p-4 space-y-2">
                                        <div className="text-sm space-y-1">
                                            <p>
                                                Generated OTP:
                                                <span className="font-mono bg-white px-2 py-0.5 rounded">
                                                    {generatedOtp || 'Not generated'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}

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