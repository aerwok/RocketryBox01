import Hero from "./components/hero";
import Features from "./components/features";
import Perks from "./components/perks";
import Services from "./components/services";
import CTA from "../../../components/shared/cta";

const FeaturesPage = () => {
    return (
        <>
            <div className="container mx-auto px-4">
                <Hero />
                <Features />
                <Perks />
                <Services />
            </div>
            <CTA />
        </>
    );
};

export default FeaturesPage;
