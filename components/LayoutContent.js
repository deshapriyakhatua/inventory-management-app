"use client";

import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar/Sidebar";

export default function LayoutContent({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    // While loading, AuthProvider shows its own loading state
    // but we return nothing here to prevent flash of unstyled content
    if (isLoading) return null;

    if (!isAuthenticated) {
        return (
            <main style={{ height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
                {children}
            </main>
        );
    }

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
            <Sidebar />
            <main style={{ 
                flex: 1, 
                height: "100vh", 
                overflowY: "auto", 
                overflowX: "hidden", 
                background: "var(--background)" 
            }}>
                {children}
            </main>
        </div>
    );
}
