import BusinessBenefits from "./components/business-benefits";
import Companies from "./components/companies";
import Hero from "./components/hero";
import Testimonials from "./components/testimonials";
import TrackOrders from "./components/track-orders";
import WhyChoose from "./components/why-choose";
import MotionWrapper from "@/components/ui/motion-wrapper";

const HomePage = () => {
    return (
        <div className="container mx-auto px-4">
            <MotionWrapper animation="fade" duration={0.8}>
                <Hero />
            </MotionWrapper>

            <MotionWrapper animation="slideRight" delay={0.2}>
                <Companies />
            </MotionWrapper>

            <MotionWrapper animation="slideUp" delay={0.3}>
                <TrackOrders />
            </MotionWrapper>

            <MotionWrapper animation="slideUp" delay={0.2}>
                <WhyChoose />
            </MotionWrapper>

            <MotionWrapper animation="slideUp" delay={0.3}>
                <BusinessBenefits />
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.4}>
                <Testimonials />
            </MotionWrapper>
        </div>
    );
};

export default HomePage;
