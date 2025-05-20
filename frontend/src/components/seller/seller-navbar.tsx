import { Link } from "react-router-dom";

const SellerNavbar = () => {
    return (
        <div className="sticky top-0 z-50 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center lg:justify-start h-16">
                    <Link to="/">
                        <img
                            src="/icons/logo.svg"
                            alt="Rocketry Box"
                            className="h-10"
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SellerNavbar;
