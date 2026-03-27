"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/routes";

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
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                backgroundColor: "#0f172a",
                color: "#f8fafc"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        border: "3px solid rgba(255, 255, 255, 0.1)",
                        borderTop: "3px solid #38bdf8",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 1rem"
                    }}></div>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}} />
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