import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AuthModalProps {
    children: React.ReactNode;
    type: "login" | "signup";
}

const AuthModal = ({ children, type }: AuthModalProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <div className="flex flex-col items-center gap-8 py-4">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-semibold">
                            {type === "login" ? "Login" : "Sign up"}
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Start your shipping journey as
                        </p>
                    </div>

                    <div className="flex w-full gap-4">
                        <Link to={`/customer/${type === "login" ? "login" : "register"}`} className="w-full">
                            <Button
                                variant="primary"
                                className="w-full"
                            >
                                Customer
                            </Button>
                        </Link>
                        <Link to={`/seller/${type === "login" ? "login" : "register"}`} className="w-full">
                            <Button
                                variant="primary"
                                className="w-full"
                            >
                                Seller
                            </Button>
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal; 