import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AuthModal from "@/components/auth/auth-modal";
import { motion, AnimatePresence } from 'framer-motion';
import { useClickOutside } from '@/hooks/use-click-outside';

const navLinks = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/track", label: "Track" },
    { to: "/contact", label: "Contact" }
];

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const location = useLocation();

    const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('button')) {
            setIsMenuOpen(false);
        }
    }, []);

    const menuRef = useClickOutside<HTMLDivElement>(handleClickOutside);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleNavigation = () => {
        setIsMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40 bg-[#EEF7FF]"
        >
            <div className={cn(
                "container mx-auto px-4 relative",
                isMenuOpen && "border-b border-border shadow-lg md:shadow-none lg:shadow-lg shadow-black/10"
            )}>
                <div className="flex items-center justify-between py-4">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Link to="/" onClick={() => handleNavigation()}>
                            <img
                                src="/icons/logo.svg"
                                alt="Rocketry Box"
                                className="h-10"
                            />
                        </Link>
                    </motion.div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="flex items-center justify-center p-1 rounded-lg bg-main text-white gap-x-1"
                        >
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => handleNavigation()}
                                    className={cn(
                                        "px-4 py-1 rounded-lg transition-colors",
                                        location.pathname === link.to
                                            ? "bg-white/20"
                                            : "hover:bg-white/10"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </motion.div>
                    </div>

                    {/* Auth Buttons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="hidden lg:flex items-center space-x-3"
                    >
                        <AuthModal type="login">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button variant="primary" className="gap-2">
                                    Login
                                    <ChevronDownIcon className="size-4" />
                                </Button>
                            </motion.div>
                        </AuthModal>
                        <AuthModal type="signup">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button variant="primary" className="gap-2">
                                    Sign Up
                                    <ChevronDownIcon className="size-4" />
                                </Button>
                            </motion.div>
                        </AuthModal>
                    </motion.div>

                    {/* Mobile Menu Button */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMenu}
                        >
                            {isMenuOpen ? <X /> : <Menu />}
                        </Button>
                    </motion.div>
                </div>

                {/* Mobile Nav */}
                <AnimatePresence mode="wait">
                    {isMenuOpen && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden absolute top-full left-1/2 -translate-x-1/2 bg-[#EEF7FF] z-50 border-b border-border shadow-lg w-[110%] !transform px-8"
                        >
                            <motion.div className="px-2 pt-2 pb-3 flex flex-col w-full space-y-1">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.to}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.2 }}
                                    >
                                        <Link
                                            to={link.to}
                                            className={cn(
                                                "px-4 py-2 rounded-lg block transition-colors",
                                                location.pathname === link.to
                                                    ? "bg-sky-500/20 text-main"
                                                    : "hover:bg-sky-500/10"
                                            )}
                                            onClick={() => handleNavigation()}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.2 }}
                                    className="pt-4 flex flex-col space-y-3"
                                >
                                    <AuthModal type="login">
                                        <Button variant="primary" className="w-full gap-2">
                                            <LogIn className="size-4" />
                                            Login
                                        </Button>
                                    </AuthModal>
                                    <AuthModal type="signup">
                                        <Button variant="primary" className="w-full gap-2">
                                            <UserPlus className="size-4" />
                                            Sign Up
                                        </Button>
                                    </AuthModal>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
};

export default Navbar; 