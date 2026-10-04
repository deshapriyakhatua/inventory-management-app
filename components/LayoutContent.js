"use client";

import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar/Sidebar";
import { Toaster } from "./ui";
import styles from "./LayoutContent.module.css";

export default function LayoutContent({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    // While loading, AuthProvider shows its own loading state
    // but we return nothing here to prevent flash of unstyled content
    if (isLoading) return null;

    if (!isAuthenticated) {
        return (
            <>
                <Toaster />
                <main className={styles.publicMain}>{children}</main>
            </>
        );
    }

    return (
        <div className={styles.layout}>
            <Toaster />
            <Sidebar />
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}

