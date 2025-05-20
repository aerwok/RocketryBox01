import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {

    const footerLinks = {
        resources: [
            { to: "/services", label: "Shipping Rate Calculator" },
            { to: "/services", label: "Volumetric Weight Calculator" },
            { to: "/services", label: "Free eCommerce Tools" },
            { to: "/services", label: "Knowledge Base" },
            { to: "/services", label: "Customer Stories" },
            { to: "/services", label: "Coupons" }
        ],
        features: [
            { to: "/features", label: "Cash on Delivery" },
            { to: "/features", label: "Serviceable Pin Codes" },
            { to: "/features", label: "API Integration" },
            { to: "/features", label: "Multiple Pickup Locations" },
            { to: "/features", label: "Print Shipping Labels" },
            { to: "/features", label: "Email & SMS Notifications" },
            { to: "/features", label: "All Features" }
        ],
        partner: [
            { to: "/partner/carrier", label: "Carrier" },
            { to: "https://www.aerwok.com/", label: "Technology" },
            { to: "/partner/join", label: "Become a Partner" }
        ],
        support: [
            { to: "/pricing", label: "Pricing" },
            { to: "/faqs", label: "FAQs" },
            { to: "/contact", label: "Contact us" },
            { to: "/contact", label: "Help Center" },
            { to: "/policy", label: "Policy" }
        ]
    };

    return (
        <footer className="bg-[#EEF7FF] pt-20 pb-6 relative z-0">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-full -z-10 bg-gradient-to-t from-[#BEDCF8] via-[#BEDCF8]/60 to-[#D6C0FF]"
            />
            <div className="container mx-auto px-4">
                {/* Main Footer */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                        className="md:col-span-4"
                    >
                        <Link to="/" className="block mb-4">
                            <img
                                src="/icons/logo.svg"
                                alt="Rocketry Box"
                                className="h-12"
                            />
                        </Link>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="text-sm text-gray-600 space-y-2"
                        >
                            <p className="font-semibold">ROCKETRY BOX PRIVATE LIMITED</p>
                            <p>
                                <span className="font-medium text-foreground">
                                    Registered Office:
                                </span>
                                - 2/98, Azadgarh, Regent Park, Kolkata, Kolkata, West Bengal – 700040, India
                            </p>
                            <p>
                                <span className="font-medium text-foreground">
                                    CIN:
                                </span> U53200WB2024PTC274104</p>
                            <p>
                                <span className="font-medium text-foreground">
                                    Email:
                                </span>
                                <a href="mailto:admin@rocketrybox.in" className="hover:text-gray-900">
                                    admin@rocketrybox.in</a> | <a href="mailto:rocketrybox@gmail.com" className="hover:text-gray-900">rocketrybox@gmail.com</a>
                            </p>
                            <p>
                                <span className="font-medium text-foreground">
                                    Website:
                                </span>
                                <a href="https://www.rocketrybox.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">www.rocketrybox.com</a> | <a href="https://www.rocketrybox.in" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">www.rocketrybox.in</a>
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Resources */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="md:col-span-2"
                    >
                        <h3 className="text-xl font-semibold mb-4">
                            Resources
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link, index) => (
                                <motion.li
                                    key={`${link.to}-${link.label}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                                >
                                    <Link to={link.to} className="text-gray-600 hover:text-gray-900 transition-colors">
                                        {link.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="md:col-span-2"
                    >
                        <h3 className="text-xl font-semibold mb-4">
                            Features
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.features.map((link, index) => (
                                <motion.li
                                    key={`${link.to}-${link.label}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
                                >
                                    <Link to={link.to} className="text-gray-600 hover:text-gray-900 transition-colors">
                                        {link.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Partner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="md:col-span-2"
                    >
                        <h3 className="text-xl font-semibold mb-4">
                            Partner
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.partner.map((link, index) => (
                                <motion.li
                                    key={`${link.to}-${link.label}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                                >
                                    <Link to={link.to} className="text-gray-600 hover:text-gray-900 transition-colors">
                                        {link.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="md:col-span-2"
                    >
                        <h3 className="text-xl font-semibold mb-4">
                            Support
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link, index) => (
                                <motion.li
                                    key={`${link.to}-${link.label}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
                                >
                                    <Link to={link.to} className="text-gray-600 hover:text-gray-900 transition-colors">
                                        {link.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Bottom Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="pt-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6">
                            <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                Terms & Conditions
                            </Link>
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            @ {new Date().getFullYear()} Rocketrybox pvt. ltd. All Rights Reserved
                        </p>
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">
                                Design & Developed By
                            </span>
                            <Link to="https://www.aerwok.com/" target="_blank" rel="noopener noreferrer">
                                <img
                                    src="/icons/aerwok.png"
                                    alt="Aerwok"
                                    className="h-6"
                                />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer; 