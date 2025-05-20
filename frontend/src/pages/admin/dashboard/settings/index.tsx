import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, Bell, FileText, Power } from "lucide-react";
import { Link } from "react-router-dom";

const SETTINGS_CARDS = [
    {
        title: "System Configuration",
        description: "Configure basic system settings like timezone, currency, and display preferences.",
        icon: Settings2,
        to: "/admin/dashboard/settings/system"
    },
    {
        title: "Notification Settings",
        description: "Manage email and SMS notification settings, templates, and delivery methods.",
        icon: Bell,
        to: "/admin/dashboard/settings/notification"
    },
    {
        title: "Policy Pages",
        description: "Manage system policies, terms, and conditions with SEO optimization.",
        icon: FileText,
        to: "/admin/dashboard/settings/policy"
    },
    {
        title: "Maintenance Mode",
        description: "Enable maintenance mode and customize the maintenance page content.",
        icon: Power,
        to: "/admin/dashboard/settings/maintenance"
    }
];

const SettingsPage = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SETTINGS_CARDS.map((card) => (
                    <Link key={card.title} to={card.to}>
                        <Card className="h-full hover:bg-neutral-50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <card.icon className="size-5 text-muted-foreground" />
                                    <CardTitle>{card.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{card.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage; 