import { Marquee } from '@/components/ui/marquee';
import { motion } from "framer-motion";
import "@/styles/marquee.css";

// Define company logos array
const companyLogos = [
    "/images/company1.png",
    "/images/company2.png",
    "/images/company3.png",
    "/images/company4.png",
    "/images/company5.png",
    "/images/company6.png",
    "/images/company7.png",
    "/images/company8.png",
    "/images/company9.png",
    "/images/company10.png",
    "/images/company11.png",
    "/images/company12.png",
    "/images/company13.png",
];

// Repeat the logos to ensure enough content for smooth scrolling
const repeatedFirstRowLogos = [...companyLogos.slice(0, 6), ...companyLogos.slice(0, 6), ...companyLogos.slice(0, 6)];
const repeatedSecondRowLogos = [...companyLogos.slice(6), ...companyLogos.slice(6), ...companyLogos.slice(6)];

const Companies = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl lg:text-4xl font-semibold leading-tight text-center mb-12"
            >
                Anywhere, Anytime - With Your <br className="hidden lg:block" /> Choice of{' '}
                <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-900"
                >
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Courier Partners
                    </span>
                </motion.span>
            </motion.h1>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full overflow-hidden"
            >
                {/* First row - left to right */}
                <Marquee className="mb-8" pauseOnHover speed={25}>
                    {repeatedFirstRowLogos.map((logo, index) => (
                        <div
                            key={`first-${index}`}
                            className="marquee-item bg-white rounded-lg shadow-sm p-6 flex items-center justify-center"
                            style={{ width: '180px', height: '80px' }}
                        >
                            <img
                                src={logo}
                                alt={`Company ${index % 6 + 1}`}
                                className="max-h-10 w-auto object-contain"
                            />
                        </div>
                    ))}
                </Marquee>

                {/* Second row - right to left */}
                <Marquee reverse pauseOnHover speed={20}>
                    {repeatedSecondRowLogos.map((logo, index) => (
                        <div
                            key={`second-${index}`}
                            className="marquee-item bg-white rounded-lg shadow-sm p-6 flex items-center justify-center"
                            style={{ width: '180px', height: '80px' }}
                        >
                            <img
                                src={logo}
                                alt={`Company ${index % 7 + 7}`}
                                className="max-h-10 w-auto object-contain"
                            />
                        </div>
                    ))}
                </Marquee>
            </motion.div>
        </div>
    );
};

export default Companies;
