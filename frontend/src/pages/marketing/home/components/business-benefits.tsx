import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

interface BusinessCardProps {
    title: string;
    index: number;
    subtitle: string;
    metrics: {
        label: string;
        value: string;
    }[];
    image: string;
    extraImage?: string;
}

const BusinessCard = ({ title, index, subtitle, metrics, image, extraImage }: BusinessCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-white rounded-xl p-6 relative"
    >
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="flex flex-col gap-2"
        >
            <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="text-xl lg:text-2xl text-blue-600 font-semibold"
            >
                {title}
            </motion.h3>
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="text-sm text-muted-foreground"
            >
                {subtitle}
            </motion.p>
        </motion.div>

        <div className="flex flex-wrap gap-6 my-6">
            {metrics.map((metric, metricIndex) => (
                <motion.div
                    key={metricIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.05 + metricIndex * 0.05 }}
                    className="flex flex-col"
                >
                    <motion.span
                        whileHover={{ scale: 1.1 }}
                        className="text-2xl font-bold"
                    >
                        {metric.value}
                    </motion.span>
                    <span className="text-sm text-muted-foreground">
                        {metric.label}
                    </span>
                </motion.div>
            ))}
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + index * 0.05 }}
            className={cn(
                "relative h-auto w-full mt-4",
                index === 2 && "lg:mt-20"
            )}
        >
            <img
                src={image}
                alt={title}
                className={cn(
                    "w-full h-full object-contain",
                    index === 3 && "!w-3/4"
                )}
            />
        </motion.div>
        {extraImage && (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className={cn(
                    "h-auto w-full absolute bottom-0 right-0",
                )}
            >
                <img
                    src={extraImage}
                    alt={title}
                    className="w-3/5 h-full object-contain ml-auto"
                />
            </motion.div>
        )}
    </motion.div>
);

const BusinessBenefits = () => {
    return (
        <section className="py-20">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="text-center"
            >
                <h2 className="text-4xl font-semibold">
                    Which Businesses Can Benefit <br className="hidden lg:block" /> from{' '}
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-[#F6560C] to-[#FCE712] bg-clip-text text-transparent"
                    >
                        Rocketry Box
                    </motion.span>
                    ?
                </h2>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10"
            >
                <BusinessCard
                    index={1}
                    title="Social Sellers"
                    subtitle="Entrepreneurs selling on Instagram, WhatsApp, Facebook etc."
                    metrics={[
                        {
                            label: "Shipping cost reduction by",
                            value: "10-15%"
                        },
                        {
                            label: "Uplift end to end buyer",
                            value: "Experience"
                        }
                    ]}
                    image="/images/marketing/social-sellers.png"
                />

                <BusinessCard
                    index={2}
                    title="SME Online retailers"
                    subtitle="D2C brands, traders & drop shippers selling through their own website"
                    metrics={[
                        {
                            label: "Conversion increase of upto",
                            value: "25%"
                        },
                        {
                            label: "Shipping cost reduction by",
                            value: "10-15%"
                        }
                    ]}
                    image="/images/marketing/online-retail.png"
                />

                <BusinessCard
                    index={3}
                    title="Large online & offline businesses"
                    subtitle="Brands & sellers having multiple sales channels - website, stores etc."
                    metrics={[
                        {
                            label: "Business optimisation cost saving upto",
                            value: "10%"
                        }
                    ]}
                    image="/images/marketing/your-store.png"
                    extraImage="/images/marketing/large-business.png"
                />

                <BusinessCard
                    index={4}
                    title="Offline stores"
                    subtitle="Retailers, brand stores"
                    metrics={[
                        {
                            label: "Supply chain cost reduction by",
                            value: "10-15%"
                        },
                        {
                            label: "Omnichannel buyer",
                            value: "Experience"
                        }
                    ]}
                    image="/images/marketing/offline-store.png"
                />
            </motion.div>
        </section>
    );
};

export default BusinessBenefits;
