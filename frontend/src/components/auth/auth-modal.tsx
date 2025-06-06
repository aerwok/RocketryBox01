import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
        <DialogTitle className="text-2xl font-semibold text-center">
          {type === "login" ? "Login" : "Sign up"}
        </DialogTitle>
        <DialogDescription className="text-lg text-center">
          Start your shipping journey as
        </DialogDescription>

        <div className="flex flex-col items-center gap-8 py-4">
          <div className="flex w-full gap-4">
            <Link to={`/customer/auth/${type === "login" ? "login" : "register"}`} className="w-full">
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
