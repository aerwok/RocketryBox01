import Companies from "./components/companies";
import DeliveryServices from "./components/delivery-services";
import Features from "./components/features";
import Hero from "./components/hero";
import HowItWorks from "./components/how-it-works";
import Stats from "./components/stats";
import VideoPlayer from "./components/video-player";

const ServicesPage = () => {
    return (
        <>
            <div className="container mx-auto px-4">
                <Hero />
                <DeliveryServices />
                <Features />
                <Stats />
                <VideoPlayer videoId="YOUR_YOUTUBE_VIDEO_ID" />
            </div>
            <div className="bg-gradient-to-t from-[#E3DEFF]">
                <Companies />
                <HowItWorks />
            </div>
        </>
    );
};

export default ServicesPage;
