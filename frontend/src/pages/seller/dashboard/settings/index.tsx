import { Button } from "@/components/ui/button";
import { StoreIcon, TruckIcon, ReceiptTextIcon, UserCogIcon, MessageSquareTextIcon, TerminalIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SETTINGS_CARDS = [
    {
        title: "MANAGE STORE",
        description: "EASILY MANAGE YOUR STORES BY CONFIGURING THEM TO AUTOMATICALLY FETCH ORDERS FROM YOUR ECOMMERCE PLATFORM TO THE ROCKETRYBOX",
        image: "/images/settings/manage-store.png",
        buttonText: "MANAGE STORE",
        icon: StoreIcon,
        path: "/seller/dashboard/settings/manage-store"
    },
    {
        title: "COURIERS SETTINGS",
        description: "YOU CAN EASILY MANAGE COURIER SETTINGS, ENABLING OR DISABLING COURIERS & MODES, ALSO SET COURIER PRIORITY FOR SEAMLESS DELIVERIES",
        image: "/images/settings/courier-settings.png",
        buttonText: "COURIERS SETTINGS",
        icon: TruckIcon,
        path: "/seller/dashboard/settings/couriers"
    },
    {
        title: "LABEL SETTING",
        description: "YOU CAN CUSTOMIZE LABEL SETTINGS, LOGO, SIZE, FORMAT, AND ESSENTIAL SHIPPING INFORMATION FOR STREAMLINED AND BRANDED SHIPMENTS",
        image: "/images/settings/label-settings.png",
        buttonText: "LABEL SETTING",
        icon: ReceiptTextIcon,
        path: "/seller/dashboard/settings/labels"
    },
    {
        title: "MANAGE USER",
        description: "SELLERS CAN ADD NEW USERS, MANAGE USER ACCESS LEVELS, RESET PASSWORDS, AND CONFIGURE PERMISSIONS FOR TEAM COLLABORATION",
        image: "/images/settings/manage-user.jpeg",
        buttonText: "MANAGE USER",
        icon: UserCogIcon,
        path: "/seller/dashboard/settings/users"
    },
    {
        title: "WHATSAPP SETTING",
        description: "EASILY ENABLE WHATSAPP MESSAGING FOR ORDER CONFIRMATIONS, PACKED NOTIFICATIONS, OUT-FOR-DELIVERY UPDATES, AND DELIVERY CONFIRMATIONS TO ENHANCE CUSTOMER COMMUNICATION",
        image: "/images/settings/whatsapp-settings.jpeg",
        buttonText: "WHATSAPP SETTING",
        icon: MessageSquareTextIcon,
        path: "/seller/dashboard/settings/whatsapp"
    },
    {
        title: "API SETTING",
        description: "CONFIGURE YOUR API SETTINGS TO SEAMLESSLY INTEGRATE YOUR ECOMMERCE PLATFORM WITH ROCKETRY BOX FOR AUTOMATED SHIPPING, TRACKING, AND ORDER MANAGEMENT",
        image: "/images/settings/api-settings.png",
        buttonText: "API SETTING",
        icon: TerminalIcon,
        path: "/seller/dashboard/settings/api"
    },
];

const SellerSettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full space-y-8">
            <h1 className="text-xl lg:text-2xl font-semibold">
                Settings
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SETTINGS_CARDS.map((card) => (
                    <div
                        key={card.title}
                        className="relative bg-[#BCDDFF] rounded-xl lg:rounded-2xl overflow-hidden"
                    >
                        {/* Image */}
                        <div className="w-full h-48 relative p-4">
                            <img
                                src={card.image}
                                alt={card.title}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            {/* Store Icon */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                                <div className="bg-white p-3 rounded-lg shadow-lg">
                                    <div className="size-6 bg-white rounded-lg flex items-center justify-center">
                                       <card.icon className="size-4 lg:size-6" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 pt-6 flex flex-col items-center text-center">
                            <Button 
                                variant="purple" 
                                className="mb-4"
                                onClick={() => navigate(card.path)}
                            >
                                {card.buttonText}
                            </Button>
                            <p className="text-xs text-gray-600 font-medium">
                                {card.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SellerSettingsPage; 