import { cn } from "@/lib/utils";
import { Link, Outlet, useLocation } from "react-router-dom";

const SETTINGS_LINKS = [
    { to: "profile", label: "Profile" },
    { to: "account", label: "Account" },
    { to: "appearance", label: "Appearance" },
    { to: "notification", label: "Notification" },
    { to: "display", label: "Display" },
];

const AdminSettingsLayout = () => {
    
    const { pathname } = useLocation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-semibold">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="md:w-48">
                    <nav className="flex flex-col space-y-1">
                        {SETTINGS_LINKS.map((link) => {
                            const isActive = pathname.includes(link.to);
                            return (
                                <Link
                                    key={link.label}
                                    to={link.to}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-neutral-100 text-neutral-900"
                                            : "text-muted-foreground hover:bg-neutral-100 hover:text-neutral-900"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content Area */}
                <div className="flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsLayout; 