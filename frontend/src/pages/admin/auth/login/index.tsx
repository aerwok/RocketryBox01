import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/validations/admin";
import { ApiService } from "@/services/api.service";
import { secureStorage } from "@/utils/secureStorage";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminLoginPage = () => {

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const apiService = ApiService.getInstance();

  const form = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: AdminLoginInput) => {
    try {
      setIsLoading(true);
      interface LoginData {
        token: string;
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          department: string;
          isSuperAdmin: boolean;
          permissions: string[];
        }
      }

      const response = await apiService.post('admin/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      }) as { success: boolean; data: LoginData };

      if (response.success && response.data) {
        // Store auth data properly for AuthProvider
        await secureStorage.setItem('auth_token', response.data.token);
        await secureStorage.setItem('user_type', 'admin');
        await secureStorage.setItem('user_context', JSON.stringify(response.data.user));
        await secureStorage.setItem('user_permissions', JSON.stringify(response.data.user.permissions || []));

        // Also store in localStorage for backward compatibility
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        toast.success('Login successful');
        navigate('/admin/dashboard');
      } else {
        toast.error('Login failed. Invalid response from server.');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 bg-white">
      <div className="container mx-auto p-4 h-full">
        <div className="grid lg:grid-cols-2 gap-12 place-items-center w-full h-full">
          {/* Left Side - Content & Image */}
          <div className="space-y-6 order-2 lg:order-1 flex flex-col justify-center w-full h-full">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-bold">
                Welcome Back, <span className="text-[#B91C1C]">Captain!</span> 🚢
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Manage consignments, track shipments, and streamline logistics—all from one
                powerful dashboard.
              </p>
              <p className="text-lg font-semibold">
                Login to take control!
              </p>
            </div>
            <div className="relative h-[400px] w-full">
              <img
                src="/images/auth.png"
                alt="Login"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-md space-y-6 order-1 lg:order-2">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Admin User Login
              </h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email address/ Mobile Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email address/ mobile number"
                          className="bg-[#D9D9D9]"
                          {...field}
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
                      <FormLabel>
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            className="bg-[#D9D9D9]"
                            {...field}
                          />
                          <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  <Link
                    to="#"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Button>

                <div className="text-center text-sm">
                  <Link
                    to="/admin/forgot-password"
                    className="font-medium text-primary hover:underline"
                  >
                    Forgot your password?
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

export default AdminLoginPage;
