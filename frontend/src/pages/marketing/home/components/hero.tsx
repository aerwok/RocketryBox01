import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import { ChartNoAxesCombinedIcon, TrendingUpIcon } from "lucide-react";
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 py-12">
      {/* Left Content */}
      <div className="flex-1 space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl lg:text-4xl font-semibold leading-tight"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-red-500"
          >
            Boost
          </motion.span>{' '}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-blue-600"
          >
            Your Shipping Experience
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-900"
          >
            With{' '}
            <span className="bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
              Rocketry Box
            </span>
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-lg text-gray-600 max-w-2xl"
        >
          Get the best e-commerce shipping solution for your business with
          our All-in-One shipping aggregator platform
        </motion.p>

        <div className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-xl lg:text-2xl font-semibold"
          >
            Are you a{' '}
            <span className="text-red-500">Customer</span>{' '}
            or a{' '}
            <span className="text-red-500">Seller</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/customer/auth/register">
              <Button size="lg" variant="primary">
                Customer
              </Button>
            </Link>
            <Link to="/seller/register">
              <Button size="lg" variant="primary">
                Seller
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 relative">
        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="absolute top-0 left-20 z-10 bg-[#BDF] rounded-lg shadow-lg hidden lg:block"
        >
          <div className="flex flex-col justify-center px-3 relative size-28">
            <div className="text-sm">Delivery <br /> Performance</div>
            <div className="text-xl lg:text-2xl font-semibold">50%</div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="size-8 flex items-center justify-center bg-[#3FBDF1] absolute -bottom-4 -right-4 rounded-full z-20"
            >
              <TrendingUpIcon className="size-4" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="absolute top-40 left-0 z-10 size-28 bg-[#B7B0DB] rounded-lg shadow-lg hidden lg:block"
        >
          <div className="flex flex-col justify-center px-3 relative size-28">
            <div className="text-sm">Logistics <br /> Cost</div>
            <div className="text-xl lg:text-2xl font-semibold">10%</div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="size-8 flex items-center justify-center bg-[#3FBDF1] absolute -bottom-4 -right-4 rounded-full z-20"
            >
              <ChartNoAxesCombinedIcon className="size-4" />
            </motion.div>
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="hidden lg:block absolute -top-20 -left-10 z-10"
        >
          <img
            src="/images/hero-arrow.png"
            alt="Rocket"
            className="w-20 lg:w-28 h-auto"
          />
        </motion.div>

        {/* Rocket Icon */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="absolute -top-10 right-0 z-10"
        >
          <motion.img
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 300 }}
            src="/images/rocket.png"
            alt="Rocket"
            className="w-20 lg:w-40 h-auto"
          />
        </motion.div>

        {/* Main Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative z-0"
        >
          <img
            src="/images/hero.png"
            alt="Delivery Person"
            className="w-full h-auto lg:h-96 object-contain"
          />
        </motion.div>
      </div>
    </div>
  )
};

export default Hero;
