import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sellerAuthService } from "@/services/seller-auth.service";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SellerOTPPage = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30); // Initial 30s timer since OTP was just sent
  const location = useLocation();
  const navigate = useNavigate();
  const { phone, email } = location.state || {};

  // Removed automatic OTP sending on component mount
  // OTP is already sent from the registration page
  // useEffect(() => {
  //     // Send OTP when component mounts
  //     sendOTP();
  // }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOTP = async () => {
    if (!phone && !email) {
      toast.error("No phone or email provided for OTP");
      navigate("/seller/register");
      return;
    }

    try {
      setIsLoading(true);

      // Use our auth service
      const response = await sellerAuthService.sendOTP(
        phone || email,
        'register'
      );

      if (response.success) {
        setResendTimer(30);
        toast.success("OTP sent successfully");

        // For development, log the OTP if it's provided in the response
        if (process.env.NODE_ENV === 'development' &&
          response.data &&
          typeof response.data === 'object' &&
          'otp' in response.data) {
          console.log("Development OTP:", response.data.otp);
        }
      } else {
        toast.error(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast.error(error.message || "Failed to send OTP. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);

      // Use the auth service to verify OTP
      const response = await sellerAuthService.verifyOTP(
        phone || email,
        otp,
        'register'
      );

      if (response.success) {
        toast.success("OTP verified successfully");

        try {
          // Register user using our auth service
          const registerResponse = await sellerAuthService.register(
            {
              firstName: location.state?.name?.split(' ')[0] || 'Test',
              lastName: location.state?.name?.split(' ')[1] || 'User',
              email: email || location.state?.email,
              phone: phone || location.state?.phone,
              password: location.state?.password || 'password123',
              confirmPassword: location.state?.password || 'password123',
              companyName: location.state?.companyName || 'Test Business',
              monthlyShipments: location.state?.monthlyShipments || '0-100',
              acceptTerms: true
            },
            otp
          );

          if (registerResponse.success) {
            // First make it clear to the user they've been logged in automatically
            toast.success("Registration successful! You've been automatically logged in.");

            // Brief delay to let the user read the toast
            await new Promise(resolve => setTimeout(resolve, 800));

            // Navigate to company details page for onboarding
            navigate("/seller/onboarding/company-details", {
              state: {
                isNewRegistration: true,
                name: `${location.state?.name?.split(' ')[0] || 'Test'} ${location.state?.name?.split(' ')[1] || 'User'}`,
                email: email || location.state?.email,
                phone: phone || location.state?.phone,
                companyName: location.state?.companyName || 'Test Business',
              }
            });
          } else {
            toast.error(registerResponse.message || "Registration failed");
          }
        } catch (registerError: any) {
          console.error("Registration error:", registerError);
          toast.error(registerError.message || "Failed to complete registration");
          // Still navigate to company details as fallback
          navigate("/seller/onboarding/company-details");
        }
      } else {
        toast.error(response.message || "OTP verification failed");
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      toast.error(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      sendOTP();
    }
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
                  disabled={otp.length !== 6 || isLoading}
                >
                  {isLoading ? "Verifying..." : "Confirm"}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                Didn't receive code?{" "}
                <Button
                  variant="link"
                  className="text-[#2B4EA8] px-0"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                  <p>Development Note: Check console logs or backend server for OTP</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOTPPage;
