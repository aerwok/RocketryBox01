import { motion } from "framer-motion";

const carrierPartners = [
  { name: "BlueDart", logo: "/images/company1.png" },
  { name: "Delhivery", logo: "/images/company2.png" },
  { name: "FedEx", logo: "/images/company3.png" },
  { name: "Ecom Express", logo: "/images/company4.png" },
  { name: "XpressBees", logo: "/images/company5.png" },
  { name: "Shadowfax", logo: "/images/company6.png" },
  { name: "DTDC", logo: "/images/company7.png" },
  { name: "India Post", logo: "/images/company8.png" },
];

const benefits = [
  {
    title: "Expand Your Reach",
    description: "Connect with thousands of eCommerce businesses and access new shipping opportunities across India."
  },
  {
    title: "Seamless Integration",
    description: "Integrate your logistics network with Rocketry Box's platform for real-time order sync and tracking."
  },
  {
    title: "Boost Your Volume",
    description: "Increase your shipment volume by partnering with a fast-growing logistics aggregator."
  },
  {
    title: "Technology Support",
    description: "Get access to advanced technology, analytics, and support to streamline your operations."
  }
];

const CarrierPartnerPage = () => (
  <div className="container mx-auto px-4 py-20">
    {/* Hero Section */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <h1 className="text-4xl font-bold mb-4 text-[#2B4EA8]">Become a Carrier Partner</h1>
      <p className="text-lg text-gray-700 max-w-2xl mx-auto">
        Join Rocketry Box's network of trusted shipping partners and grow your business with seamless technology, nationwide reach, and a thriving eCommerce ecosystem.
      </p>
    </motion.div>

    {/* Partner Logos Grid */}
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-8 justify-items-center items-center mb-16"
    >
      {carrierPartners.map((partner, idx) => (
        <motion.div
          key={partner.name}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 * idx, duration: 0.3 }}
          className="bg-white rounded-lg shadow p-6 flex flex-col items-center w-full"
        >
          <img src={partner.logo} alt={partner.name} className="h-16 object-contain mb-2" />
          <span className="text-sm font-medium text-gray-700 mt-2">{partner.name}</span>
        </motion.div>
      ))}
    </motion.div>

    {/* Benefits Section */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <h2 className="text-2xl font-semibold text-center mb-8 text-[#2B4EA8]">Why Partner With Us?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {benefits.map((benefit, idx) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * idx, duration: 0.3 }}
            className="bg-[#EEF7FF] rounded-xl p-8 shadow flex flex-col"
          >
            <h3 className="text-xl font-bold mb-2 text-[#653BFB]">{benefit.title}</h3>
            <p className="text-gray-700">{benefit.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>

    {/* Call to Action */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center mt-12"
    >
      <h2 className="text-2xl font-semibold mb-4">Ready to Join?</h2>
      <p className="text-gray-700 mb-6">Contact us to become a Rocketry Box carrier partner and unlock new growth opportunities.</p>
      <a
        href="mailto:admin@rocketrybox.in"
        className="inline-block bg-[#2B4EA8] text-white px-8 py-3 rounded-lg font-semibold shadow hover:bg-[#1d3573] transition"
      >
        Contact Us
      </a>
    </motion.div>
  </div>
);

export default CarrierPartnerPage; 