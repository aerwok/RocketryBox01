import { useLocation } from "react-router-dom";

interface RouteHeader {
    title: string;
    description: string;
}

const ROUTE_HEADERS: Record<string, RouteHeader> = {
    "search": {
        title: "Search By Escalation",
        description: "Search for escalation tickets"
    },
    "statistics": {
        title: "Escalation Statistics",
        description: "View escalation metrics and analytics"
    },
    "pickups": {
        title: "Escalation - Pickups",
        description: "Manage pickup related escalations"
    },
    "shipments": {
        title: "Escalation - Shipments",
        description: "Manage shipment related escalations"
    },
    "billing": {
        title: "Escalation - Billing & Remittance",
        description: "Manage billing and remittance escalations"
    },
    "weight-issues": {
        title: "Escalation - Weight Issues",
        description: "Manage weight related escalations"
    },
    "tech-issues": {
        title: "Escalation - Tech Issues",
        description: "Manage Call Back Request"
    }
};

const EscalationHeader = () => {

    const { pathname } = useLocation();

    const currentRoute = pathname.split("/").pop() || "search";
    const headerInfo = ROUTE_HEADERS[currentRoute];

    return (
        <div className="flex flex-col gap-2">
            <h1 className="text-xl lg:text-2xl font-semibold">
                {headerInfo?.title}
            </h1>
            <p className="text-muted-foreground">
                {headerInfo?.description}
            </p>
        </div>
    );
};

export default EscalationHeader; 