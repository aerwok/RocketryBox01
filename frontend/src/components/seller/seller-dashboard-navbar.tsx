import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { Menu, MenuIcon, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../ui/input';

const SellerDashboardNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { hasPermission } = usePermissions();

  // Authentication is now handled by AuthProvider at app level
  // No need for component-level auth checks

  // Initialize search from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get("search");
    const awbParam = searchParams.get("awb");

    if (searchParam) {
      setSearchQuery(searchParam);
    } else if (awbParam) {
      setSearchQuery(awbParam);
    }
  }, [searchParams]);

  // Navigation links with permission requirements
  const orderSubLinks = [
    { to: "/seller/dashboard/new-order", label: "New Order", permission: "New Order" },
    { to: "/seller/dashboard/orders", label: "Orders", permission: "Order" },
    { to: "/seller/dashboard/shipments", label: "Shipments", permission: "Shipments" },
    { to: "/seller/dashboard/received", label: "Received", permission: "Received" },
  ];

  const allNavLinks = [
    { to: "/seller/dashboard", label: "Home", permission: "Dashboard access" },
    {
      to: "/seller/dashboard/orders",
      label: "Orders",
      permission: "Order",
      subLinks: orderSubLinks
    },
    { to: "/seller/dashboard/ndr", label: "NDR", permission: "NDR List" },
    { to: "/seller/dashboard/billing", label: "Billing", permission: "Fright" },
    { to: "/seller/dashboard/weight-dispute", label: "Weight Dispute", permission: "Weight Dispute" },
    { to: "/seller/dashboard/cod", label: "COD", permission: "COD Remittance" },
    { to: "/seller/dashboard/tools", label: "Tools", permission: "Service" },
  ];

  // Filter navigation links based on user permissions
  const navLinks = allNavLinks.filter(link => {
    const hasMainPermission = hasPermission(link.permission);
    if (hasMainPermission && link.subLinks) {
      // Filter sub-links based on permissions
      link.subLinks = link.subLinks.filter(subLink => hasPermission(subLink.permission));
    }
    return hasMainPermission;
  });

  const isActiveLink = (to: string) => {
    if (to === "/seller/dashboard") {
      return location.pathname === "/seller/dashboard";
    }
    return location.pathname.startsWith(to);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Helper to check if string looks like an AWB number
  const isAwbNumber = (query: string): boolean => {
    // AWB numbers are typically alphanumeric with specific formats
    // This is a simple check - update with your specific AWB format rules
    return /^[A-Z0-9]{6,18}$/i.test(query.trim());
  };

  // Perform the search with specified query
  const performSearch = (queryText: string) => {
    if (!queryText) return;

    const currentPath = location.pathname;

    // On dashboard, AWB searches go to shipments page
    if (currentPath === "/seller/dashboard" && isAwbNumber(queryText)) {
      navigate(`/seller/dashboard/shipments?awb=${encodeURIComponent(queryText)}`);
      return;
    }

    // On shipments page, use awb parameter for AWB-like queries
    if (currentPath.includes('/seller/dashboard/shipments')) {
      const paramName = isAwbNumber(queryText) ? "awb" : "search";
      const newParams = new URLSearchParams(searchParams);
      newParams.set(paramName, queryText);

      // Clear the other param to avoid conflicts
      if (paramName === "awb") {
        newParams.delete("search");
      } else {
        newParams.delete("awb");
      }

      setSearchParams(newParams);
      return;
    }

    // For all other pages, just update the search param
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", queryText);
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout if exists
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new timeout for debounce (300ms)
    searchDebounceRef.current = setTimeout(() => {
      if (value.trim()) {
        performSearch(value.trim());
      } else {
        // Clear search parameters if search is empty
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("search");
        newParams.delete("awb");
        setSearchParams(newParams);
      }
    }, 300);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any pending debounced search
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const queryText = searchQuery.trim();
    if (queryText) {
      performSearch(queryText);
    }
  };

  // Function to get the appropriate search placeholder based on current route
  const getSearchPlaceholder = () => {
    if (location.pathname.includes('/seller/dashboard/ndr')) {
      return "Search NDR by AWB, Customer, Courier...";
    } else if (location.pathname.includes('/seller/dashboard/shipments')) {
      return "Search Shipments by AWB...";
    } else if (location.pathname.includes('/seller/dashboard/orders')) {
      return "Search Orders by ID, Customer...";
    } else if (location.pathname === "/seller/dashboard") {
      return "Search shipment by AWB number...";
    }
    return "Search...";
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 border-b border-border z-50 bg-white h-16">
      <div className="px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-x-4 flex-1">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/icons/logo.svg"
                alt="Rocketry Box"
                className="h-10"
              />
            </Link>

            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="hidden lg:flex items-center max-w-md w-full mx-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder={getSearchPlaceholder()}
                    className="pl-9 bg-[#F8F7FF] w-full"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            <div className="flex items-center justify-center p-1 rounded-lg bg-main text-white gap-x-1">
              <NavigationMenu>
                <NavigationMenuList className="gap-x-1">
                  {navLinks.map((link) => (
                    <NavigationMenuItem key={link.label}>
                      {link.subLinks ? (
                        <>
                          <NavigationMenuTrigger className={cn(
                            "px-3 h-8 rounded-lg transition-all duration-200 bg-transparent hover:text-white hover:bg-white/10",
                            isActiveLink(link.to) && "bg-white/20 font-medium"
                          )}>
                            {link.label}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="grid w-48 p-2 gap-1">
                              {link.subLinks.map((subLink) => (
                                <Link
                                  key={subLink.label}
                                  to={subLink.to}
                                  className={cn(
                                    "px-4 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:bg-sky-500/10",
                                    isActiveLink(subLink.to) && "bg-sky-500/20 text-sky-700 font-medium"
                                  )}
                                >
                                  {subLink.label}
                                </Link>
                              ))}
                            </div>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <Link
                          to={link.to}
                          className={cn(
                            "px-4 py-1.5 rounded-lg transition-all duration-200",
                            isActiveLink(link.to)
                              ? "bg-white/20 font-medium"
                              : "hover:bg-white/10"
                          )}
                        >
                          {link.label}
                        </Link>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-screen p-0">
                <div className="flex flex-col h-full pt-12">
                  {/* Mobile Search */}
                  <div className="p-4 border-b">
                    <form onSubmit={handleSearchSubmit} className="relative w-full">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder={getSearchPlaceholder()}
                          className="pl-9 bg-[#F8F7FF] w-full"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                      </div>
                    </form>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex-1 overflow-auto py-4">
                    <Accordion type="single" collapsible className="px-2 space-y-2">
                      {navLinks.map((link) => (
                        <AccordionItem key={link.label} value={link.label} className="border-none">
                          {link.subLinks ? (
                            <>
                              <AccordionTrigger
                                className={cn(
                                  "px-4 py-2 rounded-lg transition-all duration-200",
                                  isActiveLink(link.to)
                                    ? "bg-sky-500/20 text-sky-700 font-medium"
                                    : "hover:bg-sky-500/10 text-gray-700"
                                )}
                              >
                                {link.label}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="flex flex-col space-y-1 pl-4">
                                  {link.subLinks.map((subLink) => (
                                    <Link
                                      key={subLink.label}
                                      to={subLink.to}
                                      onClick={handleLinkClick}
                                      className={cn(
                                        "px-4 py-2 rounded-lg transition-all duration-200",
                                        isActiveLink(subLink.to)
                                          ? "bg-sky-500/20 text-sky-700 font-medium"
                                          : "hover:bg-sky-500/10 text-gray-700"
                                      )}
                                    >
                                      {subLink.label}
                                    </Link>
                                  ))}
                                </div>
                              </AccordionContent>
                            </>
                          ) : (
                            <Link
                              to={link.to}
                              onClick={handleLinkClick}
                              className={cn(
                                "flex h-10 items-center px-4 py-2 rounded-lg transition-all duration-200",
                                isActiveLink(link.to)
                                  ? "bg-sky-500/20 text-sky-700 font-medium"
                                  : "hover:bg-sky-500/10 text-gray-700"
                              )}
                            >
                              {link.label}
                            </Link>
                          )}
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SellerDashboardNavbar;
