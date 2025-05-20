import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faq = [
    {
        question: "What is Rocketry Box?",
        answer: "Rocketry Box is a comprehensive logistics solution that helps businesses manage their shipping and delivery operations efficiently."
    },
    {
        question: "How do I create an account?",
        answer: "You can create an account by clicking on the 'Register' button and following the simple registration process. We offer different account types for customers and sellers."
    },
    {
        question: "What shipping services do you offer?",
        answer: "We offer a wide range of shipping services including express delivery, standard shipping, and bulk shipping options across multiple locations."
    },
    {
        question: "How can I track my shipment?",
        answer: "You can easily track your shipment by entering your tracking number on our tracking page or through your dashboard if you're a registered user."
    },
    {
        question: "What are your delivery timeframes?",
        answer: "Delivery timeframes vary based on the shipping service selected and destination. Express delivery typically takes 1-2 business days, while standard shipping takes 3-5 business days."
    },
    {
        question: "How do I handle returns?",
        answer: "Our return process is simple. You can initiate returns through your dashboard or contact our customer support team for assistance with the return process."
    }
];

const FaqPage = () => {
    return (
        <div className="container max-w-4xl mx-auto py-16 px-4 pb-40 z-0">
            <div className="w-full text-center z-20">
                <h2 className="text-3xl lg:text-4xl font-semibold">
                    Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground text-center mt-6">
                    Find answers to common questions about our services and platform
                </p>

                <Accordion type="single" collapsible className="w-full mt-12">
                    {faq.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent>
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute bottom-0 left-1/2 z-0 -translate-x-1/2 w-[250%] h-1/8 bg-gradient-to-t from-[#D6C0FE]"
            />
        </div>
    );
};

export default FaqPage; 