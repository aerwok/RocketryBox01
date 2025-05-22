import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { customerLoginSchema, type CustomerLoginInput } from "@/lib/validations/customer";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { secureStorage } from "@/utils/secureStorage";

const CustomerLoginPage = () => {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
    const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
    const [otpTimer, setOtpTimer] = useState<number>(0);
    const [generatedOtp, setGeneratedOtp] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CustomerLoginInput>({
        resolver: zodResolver(customerLoginSchema),
        defaultValues: {
            phoneOrEmail: "",
            password: "",
            otp: "",
            rememberMe: false,
        },
        mode: "onChange"
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    useEffect(() => {
        const subscription = form.watch((value) => {
            console.log('Form values changed:', value);
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    const handleSendOtp = async () => {
        const phoneOrEmail = form.watch("phoneOrEmail");
        form.clearErrors("phoneOrEmail");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(phoneOrEmail);
        const phoneRegex = /^[0-9]{10}$/;
        const isPhone = phoneRegex.test(phoneOrEmail);

        if (!phoneOrEmail) {
            form.setError("phoneOrEmail", {
                message: "Please enter a phone number or email address",
            });
            return;
        }

        if (!isEmail && !isPhone) {
            form.setError("phoneOrEmail", {
                message: "Please enter a valid phone number (10 digits) or email address",
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/v2/customer/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneOrEmail }),
            });

            if (!response.ok) {
                throw new Error('Failed to send OTP');
            }

            setIsOtpSent(true);
            setOtpTimer(30);
            form.setValue("otp", "");
            toast.success('OTP sent successfully');
        } catch (error) {
            console.error("Error sending OTP:", error);
            form.setError("phoneOrEmail", {
                message: "Failed to send OTP. Please try again.",
            });
            toast.error('Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: CustomerLoginInput) => {
        console.log('=== Login Form Submit STARTED ===');
        console.log('Form Data:', data);

        try {
            setIsLoading(true);
            console.log('=== Login Attempt STARTED ===');
            
            // Call the login function directly
            console.log('Calling login function...');
            const response = await login(data.phoneOrEmail, data.password, data.rememberMe);
            console.log('=== Login Response ===');
            console.log('Response:', response);
            
            if (response.success && response.data?.accessToken) {
                console.log('Login successful, storing token and navigating to home');
                await secureStorage.setItem('auth_token', response.data.accessToken);
                toast.success('Login successful');
                navigate("/customer/home", { replace: true });
            } else {
                console.error('Login failed:', response);
                toast.error(response.message || 'Login failed. Please check your credentials.');
            }
        } catch (error: any) {
            console.error('=== Login Error ===');
            console.error('Error details:', error);
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setIsForgotPassword(true);
        form.setValue("password", "");
    };

    const handleBackToLogin = () => {
        setIsForgotPassword(false);
        setIsOtpSent(false);
        setOtpTimer(0);
        form.setValue("otp", "");
        setGeneratedOtp("");
    };

    return (
        <div className="flex items-center justify-center pt-40">
            <div className="container mx-auto px-4">
                {/* Sitting Image - Right */}
                <motion.img
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    src="/images/customer/sitting.png"
                    alt="Sitting"
                    className="absolute right-1/8 bottom-1/8 -translate-y-1/2 h-80 hidden lg:block"
                />
                {/* Standing Image - Left */}
                <motion.img
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    src="/images/customer/standing.png"
                    alt="Standing"
                    className="absolute left-1/8 lg:left-1/4 bottom-12 lg:bottom-auto lg:top-1/2 -translate-y-1/2 h-60 lg:h-80 hidden lg:block"
                />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md mx-auto relative"
                >
                    <div className="lg:p-8 space-y-10">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-2xl lg:text-3xl font-semibold text-center"
                        >
                            {isForgotPassword ? "Reset Password" : "Customer Login"}
                        </motion.h1>

                        <Form {...form}>
                            <form
                                noValidate
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    console.log('Form submitted');
                                    const values = form.getValues();
                                    console.log('Form values:', values);
                                    onSubmit(values);
                                }}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="phoneOrEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Phone number or Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter phone number or email"
                                                    className="bg-[#99BCDDB5]"
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        if (isForgotPassword) {
                                                            setIsOtpSent(false);
                                                        }
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
                                                <FormLabel>
                                                    Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="Enter your password"
                                                            className="bg-[#99BCDDB5] pr-10"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
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
                                                onClick={handleSendOtp}
                                                disabled={otpTimer > 0 || isLoading}
                                                size="sm"
                                            >
                                                {isLoading ? "Sending..." : otpTimer > 0 ? `Resend in ${otpTimer}s` : "Send OTP"}
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

                                <div className="flex items-center justify-between">
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

                                    {!isForgotPassword ? (
                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={handleForgotPassword}
                                            className="text-main hover:text-main/80"
                                        >
                                            Forgot password?
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={handleBackToLogin}
                                            className="text-main hover:text-main/80"
                                        >
                                            Back to login
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="customer"
                                    className="w-full"
                                    disabled={(isForgotPassword && !isOtpSent) || isLoading}
                                    onClick={() => console.log('Login button clicked')}
                                >
                                    {isLoading ? "Please wait..." : isForgotPassword ? "Reset Password" : "Login"}
                                </Button>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-center text-sm text-gray-600"
                                >
                                    Don't have an account?{" "}
                                    <Link to="/customer/register" className="text-main hover:underline">
                                        Register
                                    </Link>
                                </motion.div>

                                {/* Testing Info Section */}
                                {isForgotPassword && (
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
                            </form>
                        </Form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CustomerLoginPage; 