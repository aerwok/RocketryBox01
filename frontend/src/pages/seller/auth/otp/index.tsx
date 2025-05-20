import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const SellerOTPPage = () => {
    const [otp, setOtp] = useState("");
    const location = useLocation();
    const { phone, email } = location.state || {};

    const handleVerify = () => {
        // Handle OTP verification logic here
        console.log("OTP:", otp);
        // After verification, navigate to the appropriate page
        // navigate("/seller/dashboard");
    };

    return (
        <div className="h-full bg-white">
            <div className="container mx-auto px-4 py-10">
                <div className="grid lg:grid-cols-2 gap-12 place-items-center">
                    {/* Left Side - Image */}
                    <div className="order-2 lg:order-1">
                        <img
                            src="/images/seller/otp.png"
                            alt="OTP Verification"
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    {/* Right Side - OTP Form */}
                    <div className="lg:px-6 w-full order-1 lg:order-2">
                        <div className="flex-1 mx-auto text-center">
                            <h2 className="text-2xl lg:text-3xl font-semibold">
                                OTP Verification
                            </h2>
                            <p className="text-muted-foreground mt-4">
                                We have sent the verification code to your {phone ? "Mobile Number" : "Email Address"}: {phone || email}
                            </p>
                        </div>

                        <div className="max-w-sm mx-auto space-y-8 pt-8">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                >
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot
                                            index={0}
                                            className="rounded-md border-[#99BCDDB5] bg-[#99BCDDB5] w-12 h-12 text-center text-lg"
                                        />
                                        <InputOTPSlot
                                            index={1}
                                            className="rounded-md border-[#99BCDDB5] bg-[#99BCDDB5] w-12 h-12 text-center text-lg"
                                        />
                                        <InputOTPSlot
                                            index={2}
                                            className="rounded-md border-[#99BCDDB5] bg-[#99BCDDB5] w-12 h-12 text-center text-lg"
                                        />
                                    </InputOTPGroup>
                                    <InputOTPSeparator className="mx-2" />
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot
                                            index={3}
                                            className="rounded-md border-[#99BCDDB5] bg-[#99BCDDB5] w-12 h-12 text-center text-lg"
                                        />
                                        <InputOTPSlot
                                            index={4}
                                            className="rounded-md border-[#99BCDDB5] bg-[#99BCDDB5] w-12 h-12 text-center text-lg"
                                        />
                                        <InputOTPSlot
                                            index={5}
                                            className="rounded-md border-[#99BCDDB5] bg-[#99BCDDB5] w-12 h-12 text-center text-lg"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    size="lg"
                                    onClick={handleVerify}
                                    className="w-1/2 bg-[#2B4EA8] hover:bg-[#2B4EA8]/90 text-white"
                                >
                                    Confirm
                                </Button>
                            </div>

                            <div className="text-center text-sm text-gray-600">
                                Didn't receive code?{" "}
                                <Button variant="link" className="text-[#2B4EA8] px-0">
                                    Resend
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerOTPPage;
