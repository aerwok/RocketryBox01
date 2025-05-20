import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface TestimonialProps {
    content: string;
    author: string;
    role: string;
    rating: number;
    image?: string;
    index: number;
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ))}
    </div>
);

const testimonials = [
    {
        content: "Switching to Rocketry Box reduced our shipping costs by 30% and cut delivery times in half. Their rate comparison tool is a game-changer for our growing business.",
        author: "Rajiv Mehta",
        role: "Founder, TrendyFashion.in",
        rating: 5,
        image: "/images/user1.jpeg"
    },
    {
        content: "After struggling with logistics for years, I found Rocketry Box. Their NDR management system alone has saved us countless hours and improved our delivery success rate by 25%.",
        author: "Priya Sharma",
        role: "CEO, HomeCrafts",
        rating: 4.5,
        image: "/images/user2.jpeg"
    },
    {
        content: "If you're looking for the best shipping solution, look no further. Their multi-courier platform gives us the flexibility to choose the best option for each delivery zone, significantly reducing RTO rates.",
        author: "James Knight",
        role: "Operations Manager, ElectroGadgets",
        rating: 5,
        image: "/images/user3.jpeg"
    },
    {
        content: "The automated tracking updates have dramatically reduced our customer service inquiries about order status. Our buyers love the real-time notifications via WhatsApp and SMS.",
        author: "Pam Cornwell",
        role: "Customer Experience Head, BeautyEssentials",
        rating: 5,
        image: "/images/user4.jpeg"
    },
    {
        content: "As a small handicraft business, managing shipping was overwhelming until I found Rocketry Box. Their platform is intuitive, and I can now reach customers in remote areas I couldn't serve before.",
        author: "Meera Patel",
        role: "Owner, HandmadeTreasures",
        rating: 4.5,
        image: "/images/user5.jpeg"
    },
    {
        content: "The transparency in shipping rates and delivery estimates has been crucial for our business model. We've seen a 15% increase in conversions since we implemented their checkout integration.",
        author: "Rahul Kumar",
        role: "E-commerce Director, UrbanWear",
        rating: 4,
        image: "/images/user6.jpeg"
    },
    {
        content: "Handling returns was our biggest pain point until we integrated with Rocketry Box. Their reverse logistics solution has streamlined our process and improved customer satisfaction scores.",
        author: "Nikhil Reddy",
        role: "Logistics Manager, PremiumApparel",
        rating: 5,
        image: "/images/user7.jpeg"
    },
    {
        content: "As a wholesale distributor, we ship hundreds of parcels daily. Their bulk order processing and automated label generation save us at least 4 hours every day.",
        author: "Sunita Joshi",
        role: "Operations Head, BulkSupplies",
        rating: 4.5,
        image: "/images/user8.jpeg"
    },
    {
        content: "The weight discrepancy protection feature has saved us from unexpected shipping cost adjustments. Their pre-shipment verification process ensures we're always charged correctly.",
        author: "Amit Patel",
        role: "Founder, JewelCraft",
        rating: 4,
        image: "/images/user9.jpeg"
    }
];

const TestimonialCard = ({ content, author, role, rating, image, index }: TestimonialProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="bg-white rounded-xl p-4 break-inside-avoid mb-6"
    >
        <div className="flex items-start gap-3">
            {image && (
                <motion.img
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                    src={image}
                    alt={author}
                    className="size-12 rounded-full object-cover object-top"
                />
            )}
            <div className="flex-1">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    className="text-sm md:text-base text-gray-800 mb-2"
                >
                    {content}
                </motion.p>
                <div className="flex items-center gap-2">
                    <StarRating rating={rating} />
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="mt-2"
                >
                    <p className="text-sm md:text-base font-semibold">
                        - {author}
                    </p>
                    <p className="text-xs text-gray-600">
                        {role}
                    </p>
                </motion.div>
            </div>
        </div>
    </motion.div>
);

const Testimonials = () => {
    return (
        <section id="customers" className="py-16 relative z-0">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-full -z-10 bg-gradient-to-b from-[#EEF7FF] via-[#EEF7FF]/60 to-[#D6C0FF]"
            />
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl lg:text-4xl font-semibold">
                        Words From{' '}
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-main"
                        >
                            Our Valued Customers
                        </motion.span>
                    </h2>
                </motion.div>

                <div className="max-w-6xl mx-auto">
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                        {testimonials.map((testimonial, index) => (
                            <TestimonialCard
                                key={index}
                                {...testimonial}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
