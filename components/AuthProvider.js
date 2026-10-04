"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/routes";
import Spinner from "@/components/ui/Spinner/Spinner";
import styles from "./AuthProvider.module.css";

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    checkSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const checkSession = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/public/auth/session");
            const data = await res.json();
            
            if (data.authenticated) {
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Auth status check failed:", error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const verify = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/public/auth/session");
                const data = await res.json();
                
                const isAuth = !!data.authenticated;
                setIsAuthenticated(isAuth);
                setUser(data.user || null);
                
                // Redirection logic AFTER session is verified
                const isAuthRoute = AUTH_ROUTES.includes(pathname);
                
                if (!isAuth && !isAuthRoute) {
                    router.replace("/login");
                } else if (isAuth && isAuthRoute) {
                    router.replace("/");
                }
            } catch (error) {
                console.error("Auth verify failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        verify();
    }, [pathname, router]);

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingContent}>
                    <Spinner size="lg" label="Loading application" />
                    <p>Loading application...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
}