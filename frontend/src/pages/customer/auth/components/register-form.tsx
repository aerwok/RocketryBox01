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
import { customerRegisterSchema } from "@/lib/validations/customer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { CustomerRegisterInput } from "@/lib/validations/customer";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/auth.service";

const RegisterForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mobileOtpSent, setMobileOtpSent] = useState(false);
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const navigate = useNavigate();
    const authService = new AuthService();

    const form = useForm<CustomerRegisterInput>({
        resolver: zodResolver(customerRegisterSchema),
        defaultValues: {
            name: "",
            mobile: "",
            mobileOtp: "",
            email: "",
            emailOtp: "",
            password: "",
            confirmPassword: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            pincode: "",
            acceptTerms: false,
        },
    });

    const sendMobileOtp = useMutation({
        mutationFn: async (mobile: string) => {
            try {
                console.log('Sending mobile OTP request for:', mobile);
                const response = await fetch('http://localhost:8000/api/customer/auth/send-mobile-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ mobile }),
                    credentials: 'include',
                });
                
                console.log('Response status:', response.status);
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                if (!response.ok) {
                    let errorMessage;
                    try {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                    } catch (e) {
                        errorMessage = `HTTP error! status: ${response.status}, response: ${responseText}`;
                    }
                    throw new Error(errorMessage);
                }
                
                const data = JSON.parse(responseText);
                return data;
            } catch (error: any) {
                console.error('Mobile OTP request error:', {
                    error,
                    message: error?.message || 'Unknown error',
                    stack: error?.stack
                });
                throw error;
            }
        },
        onSuccess: () => {
            setMobileOtpSent(true);
            toast.success('Mobile OTP sent successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send mobile OTP');
            console.error('Mobile OTP error:', error);
        },
    });

    const sendEmailOtp = useMutation({
        mutationFn: async (email: string) => {
            try {
                const response = await fetch('/api/customer/auth/send-email-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                    credentials: 'include',
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Email OTP request error:', error);
                throw error;
            }
        },
        onSuccess: () => {
            setEmailOtpSent(true);
            toast.success('Email OTP sent successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send email OTP');
            console.error('Email OTP error:', error);
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (data: CustomerRegisterInput) => {
            return await authService.register({ ...data, role: 'customer' });
        },
        onSuccess: () => {
            toast.success("Registration successful! Please login.");
            navigate("/customer/login");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Registration failed");
        },
    });

    const onSubmit = (data: CustomerRegisterInput) => {
        registerMutation.mutate(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Field */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Enter your name"
                                    className="bg-[#99BCDDB5]"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Mobile & Mobile OTP Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Mobile Number
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter mobile number"
                                                className="bg-[#99BCDDB5]"
                                                maxLength={10}
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => sendMobileOtp.mutate(field.value)}
                                                disabled={!field.value || field.value.length !== 10 || mobileOtpSent}
                                                className="whitespace-nowrap"
                                            >
                                                {mobileOtpSent ? 'OTP Sent' : 'Send OTP'}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Always show Mobile OTP Field */}
                        <FormField
                            control={form.control}
                            name="mobileOtp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile OTP</FormLabel>
                                    <FormControl>
                                        <InputOTP
                                            maxLength={6}
                                            {...field}
                                        >
                                            <InputOTPGroup className="gap-2">
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
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
                                        Email
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter email address"
                                                className="bg-[#99BCDDB5]"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => sendEmailOtp.mutate(field.value)}
                                                disabled={!field.value || emailOtpSent}
                                                className="whitespace-nowrap"
                                            >
                                                {emailOtpSent ? 'OTP Sent' : 'Send OTP'}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Always show Email OTP Field */}
                        <FormField
                            control={form.control}
                            name="emailOtp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email OTP</FormLabel>
                                    <FormControl>
                                        <InputOTP
                                            maxLength={6}
                                            {...field}
                                        >
                                            <InputOTPGroup className="gap-2">
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
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
                                    <FormMessage className="text-xs" />
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
                                                {...field}
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className="bg-[#99BCDDB5] pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Address Fields in Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="address1"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address 1</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter address line 1"
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
                        name="address2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address 2 (Optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter address line 2"
                                        className="bg-[#99BCDDB5]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* City, State, Pincode in One Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter city"
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
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter state"
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
                        name="pincode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pincode</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter pincode"
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
                    className="w-full"
                    disabled={!form.watch("acceptTerms")}
                >
                    Register
                </Button>
            </form>
        </Form>
    );
};

export default RegisterForm; 