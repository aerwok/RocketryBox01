import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import RegisterForm from "../components/register-form";

const CustomerRegisterPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="h-full">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-10"
      >
        <div className="grid lg:grid-cols-2 gap-12 place-items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6 order-2 lg:order-1"
          >
            <motion.div className="space-y-4">
              <motion.h1
                variants={itemVariants}
                className="text-2xl lg:text-3xl font-semibold italic"
              >
                Transforming Shipping with US!
              </motion.h1>
              <div className="space-y-2">
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2"
                >
                  <div className="size-6 rounded-full bg-main flex items-center justify-center">
                    <ArrowRightIcon className="size-4 text-white" />
                  </div>
                  <p className="text-lg">
                    Branded Order Tracking Page
                  </p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2"
                >
                  <div className="size-6 rounded-full bg-main flex items-center justify-center">
                    <ArrowRightIcon className="size-4 text-white" />
                  </div>
                  <p className="text-lg">
                    Automated NDR Management
                  </p>
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2"
                >
                  <div className="size-6 rounded-full bg-main flex items-center justify-center">
                    <ArrowRightIcon className="size-4 text-white" />
                  </div>
                  <p className="text-lg">
                    Up To 45% Lesser RTOs
                  </p>
                </motion.div>
              </div>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground"
              >
                Trusted by more than 1lakh+ brands
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative h-[400px]"
            >
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                src="/images/hero.png"
                alt="Delivery"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>

          {/* Right Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:px-6 w-full order-1 lg:order-2"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 mx-auto text-center"
            >
              <h2 className="text-2xl font-semibold">
                My Details
              </h2>
            </motion.div>
            <RegisterForm />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-gray-600 mt-4"
            >
              Already have an account?{" "}
              <Link to="/customer/auth/login" className="text-main hover:underline">
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerRegisterPage;
