"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { spring } from "@/lib/motion";
import { Button, Icon, IconButton, Sheet } from "@/components/ui";
import cx from "@/components/ui/cx";
import { useAuth } from "@/components/AuthProvider";
import styles from "./Sidebar.module.css";

function formatRole(role) {
    if (!role) return "Employee";
    return role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, " $1");
}

function MobileTopBar({ onOpen }) {
    return (
        <div className={styles.mobileTopBar}>
            <IconButton
                name="toggle-sidebar"
                size="md"
                variant="ghost"
                aria-label="Open navigation menu"
                onClick={onOpen}
                className={styles.mobileToggle}
            />
            <Link href="/" className={styles.mobileBrand}>
                CRAZYKUDI
            </Link>
        </div>
    );
}

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window === "undefined") return true;

        try {
            const savedPreference = window.localStorage.getItem("sidebar-expanded");
            if (savedPreference !== null) {
                return JSON.parse(savedPreference);
            }
        } catch (error) {
            console.warn("Unable to read sidebar preference", error);
        }

        return window.innerWidth >= 768;
    });
    const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const syncMobileState = () => {
            const mobileView = window.innerWidth < 768;
            setIsMobile(mobileView);
            if (mobileView) {
                setIsExpanded(false);
            }
        };

        window.addEventListener("resize", syncMobileState);
        return () => window.removeEventListener("resize", syncMobileState);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || isMobile) return;

        try {
            window.localStorage.setItem("sidebar-expanded", JSON.stringify(isExpanded));
        } catch (error) {
            console.warn("Unable to save sidebar preference", error);
        }
    }, [isExpanded, isMobile]);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/public/auth/logout", {
                method: "POST",
            });

            if (res.ok) {
                sessionStorage.removeItem("app_pin");
                toast.success("Logged out successfully");
                router.push("/login");
                return;
            }

            toast.error("Logout failed");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("An error occurred during logout");
        }
    };

    const navItems = useMemo(() => {
        const items = [
            { type: "category", title: "Inventory" },
            { title: "Add Inventory", path: "/add-inventory", icon: "add-another-product" },
            { title: "All Inventory", path: "/all-inventory", icon: "add-inventory" },
            { type: "category", title: "Listings" },
            { title: "Add Listing", path: "/add-listing", icon: "add-listing" },
            { title: "All Listings", path: "/all-listings", icon: "all-listings" },
            { type: "category", title: "Purchases" },
            { title: "Add Purchase", path: "/add-purchase", icon: "add-purchase" },
            { title: "Purchase History", path: "/purchase-history", icon: "purchase-history" },
            { type: "category", title: "Sales Log" },
            { title: "Add Sales/Returns", path: "/add-sales-log", icon: "add-sales-returns" },
            { title: "Sales Records", path: "/sales-records", icon: "sales-data" },
            { title: "P&L Summary", path: "/pl-summary", icon: "icon-7e710d4a" },
            { type: "category", title: "B2B Sales" },
            { title: "Create B2B Invoice", path: "/create-b2b-invoice", icon: "create-b2b-invoice" },
            { title: "All Invoices", path: "/all-invoices", icon: "all-invoices" },
            { title: "Custom Payment QR", path: "/custom-qr", icon: "payment-qr-balance" },
            { type: "category", title: "Sellers" },
            { title: "Add Seller", path: "/add-seller", icon: "icon-d5851a0c" },
            { title: "All Sellers", path: "/all-sellers", icon: "icon-2df76557" },
            { type: "category", title: "Map Inventory" },
            { title: "Map Sources", path: "/map-sources", icon: "map-sources" },
        ];

        if (user?.role === "admin" || user?.role === "superadmin") {
            items.push({ type: "category", title: "Admin" });
            items.push({ title: "Add Vertical", path: "/admin/add-vertical", icon: "edit-inventory" });
        }

        return items;
    }, [user?.role]);

    const renderNavItems = (compact) => (
        <nav className={cx(styles.navMenu, compact && styles.compactNav)}>
            {navItems.map((item, index) => {
                if (item.type === "category") {
                    return (
                        <div key={`category-${index}`} className={styles.categoryHeader}>
                            {compact ? (
                                <span className={styles.categoryDivider} aria-hidden="true" />
                            ) : (
                                <span className={styles.categoryTitle}>{item.title}</span>
                            )}
                        </div>
                    );
                }

                const isActive = pathname === item.path;

                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cx(styles.navItem, isActive && styles.active, compact && styles.compactItem)}
                        aria-current={isActive ? "page" : undefined}
                        title={compact ? item.title : undefined}
                    >
                        {isActive && <motion.span layoutId="sidebar-active-pill" className={styles.activePill} aria-hidden="true" />}
                        <span className={styles.iconWrap}>
                            <Icon name={item.icon} size={20} />
                        </span>
                        <span className={styles.navText}>{item.title}</span>
                    </Link>
                );
            })}
        </nav>
    );

    const userInitials = useMemo(() => {
        const source = user?.name || "User";
        return source
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("") || "U";
    }, [user?.name]);

    if (isMobile) {
        return (
            <>
                <MobileTopBar onOpen={() => setIsMobileMenuOpen(true)} />
                <Sheet
                    open={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    side="right"
                    title="Navigation"
                    description={user ? `${formatRole(user.role)} workspace` : "Workspace"}
                    ariaLabel="Navigation menu"
                    closeLabel="Close navigation"
                    closeOnScrim
                >
                    <div className={styles.mobileSheetContent}>
                        {renderNavItems(true)}
                    </div>
                    <div className={styles.sheetFooter}>
                        <div className={styles.userPanel}>
                            <div className={styles.userAvatar}>{userInitials}</div>
                            <div className={styles.userMeta}>
                                <span className={styles.userName}>{user?.name || "User"}</span>
                                <span className={styles.userRole}>{formatRole(user?.role)}</span>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleLogout}
                            className={styles.logoutButton}
                            leftIcon={<Icon name="logout" size={18} />}
                        >
                            Logout
                        </Button>
                    </div>
                </Sheet>
            </>
        );
    }

    return (
        <motion.aside
            className={cx(styles.sidebar, isExpanded ? styles.isExpanded : styles.isCollapsed)}
            initial={false}
            animate={{ width: isExpanded ? 260 : 72 }}
            transition={spring.default}
        >
            <div className={styles.sidebarHeader}>
                <IconButton
                    name="toggle-sidebar"
                    size="md"
                    variant="ghost"
                    aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                    onClick={() => setIsExpanded((current) => !current)}
                    className={styles.toggleButton}
                />
                {isExpanded && (
                    <Link href="/" className={styles.logoText}>
                        CRAZYKUDI
                    </Link>
                )}
            </div>

            {renderNavItems(!isExpanded)}

            <div className={styles.sidebarFooter}>
                <div className={cx(styles.userPanel, !isExpanded && styles.userPanelCompact)}>
                    <div className={styles.userAvatar}>{userInitials}</div>
                    <div className={styles.userMeta}>
                        <span className={styles.userName}>{user?.name || "User"}</span>
                        <span className={styles.userRole}>{formatRole(user?.role)}</span>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleLogout}
                    className={styles.logoutButton}
                    leftIcon={<Icon name="logout" size={18} />}
                >
                    {isExpanded ? "Logout" : ""}
                </Button>
            </div>
        </motion.aside>
    );
}

