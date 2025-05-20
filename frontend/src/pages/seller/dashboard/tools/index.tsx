import { Button } from "@/components/ui/button";
import { HeadphonesIcon, Warehouse, Search, Package, FileSpreadsheet, Truck, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ToolCard {
    title: string;
    description: string;
    icon: React.ReactNode;
    buttonText: string;
    onClick: () => void;
}

const toolCards: ToolCard[] = [
    {
        title: "Warehouse",
        description: "Manage your inventory and warehouse operations",
        icon: <Warehouse className="size-6" />,
        buttonText: "WAREHOUSE",
        onClick: () => console.log("Warehouse clicked")
    },
    {
        title: "Service Check",
        description: "Check service availability in different areas",
        icon: <Search className="size-6" />,
        buttonText: "SERVICE CHECK",
        onClick: () => console.log("Service Check clicked")
    },
    {
        title: "Support",
        description: "Get help and support for your queries",
        icon: <HeadphonesIcon className="size-6" />,
        buttonText: "SUPPORT",
        onClick: () => console.log("Support clicked")
    },
    {
        title: "Products SKU",
        description: "Manage your product SKUs and inventory",
        icon: <Package className="size-6" />,
        buttonText: "PRODUCT SKU",
        onClick: () => console.log("Products SKU clicked")
    },
    {
        title: "Bulk Orders",
        description: "Handle multiple orders at once",
        icon: <FileSpreadsheet className="size-6" />,
        buttonText: "BULK ORDERS",
        onClick: () => console.log("Bulk Orders clicked")
    },
    {
        title: "Shipment Tracking",
        description: "Track your shipments in real-time",
        icon: <Truck className="size-6" />,
        buttonText: "TRACKING",
        onClick: () => console.log("Shipment Tracking clicked")
    },
    {
        title: "Settings",
        description: "Manage your account settings",
        icon: <Settings className="size-6" />,
        buttonText: "SETTINGS",
        onClick: () => console.log("Settings clicked")
    },
];

const ToolCard = ({ title, description, icon, buttonText, onClick }: ToolCard) => {
    return (
        <div className="bg-[#BCDDFF] rounded-lg lg:rounded-xl px-4 py-3 lg:px-6 lg:py-4 flex flex-col">
            <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-semibold">
                    {title}
                </h3>
                <div className="bg-[#653BFB]/20 p-2 rounded-full">
                    {icon}
                </div>
            </div>
            <p className="text-sm text-gray-600 flex-grow mt-4">
                {description}
            </p>
            <Button
                variant="purple"
                onClick={onClick}
                className="w-full mt-4"
            >
                {buttonText}
            </Button>
        </div>
    );
};

const SellerToolsPage = () => {
    const navigate = useNavigate();

    const handleToolClick = (tool: string) => {
        switch (tool) {
            case "WAREHOUSE":
                navigate("/seller/dashboard/warehouse");
                break;
            case "SERVICE CHECK":
                navigate("/seller/dashboard/service-check");
                break;
            case "SUPPORT":
                navigate("/seller/dashboard/support");
                break;
            case "PRODUCT SKU":
                navigate("/seller/dashboard/products");
                break;
            case "BULK ORDERS":
                navigate("/seller/dashboard/bulk-orders");
                break;
            case "TRACKING":
                navigate("/seller/dashboard/shipments");
                break;
            case "SETTINGS":
                navigate("/seller/dashboard/settings");
                break;
            default:
                console.log(`${tool} clicked`);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-xl lg:text-2xl font-semibold">
                Tools
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolCards.map((card, index) => (
                    <ToolCard 
                        key={index} 
                        {...card} 
                        onClick={() => handleToolClick(card.buttonText)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SellerToolsPage; 