"use client";

import { useState, useEffect } from "react";

export default function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedPin = sessionStorage.getItem("app_pin");
        // Any 4 digit pin acts as authenticated as per request.
        // If a specific PIN was required, we'd check against an env or hardcoded value.
        if (storedPin && /^\d{4}$/.test(storedPin)) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (/^\d{4}$/.test(pin)) {
            sessionStorage.setItem("app_pin", pin);
            setIsAuthenticated(true);
            setError("");
        } else {
            setError("Please enter a valid 4-digit PIN.");
        }
    };

    if (!isMounted) {
        return null; // Prevents hydration mismatch
    }

    if (!isAuthenticated) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", padding: "20px", fontFamily: "sans-serif" }}>
                <div style={{ maxWidth: "400px", width: "100%", padding: "2rem", border: "1px solid #eaeaea", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" }}>
                    <h2 style={{ marginBottom: "1.5rem" }}>Authentication Required</h2>
                    <p style={{ marginBottom: "1.5rem", color: "#666" }}>Please enter a 4-digit PIN to access the application.</p>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // only allow numbers
                            placeholder="Enter PIN (e.g. 1234)"
                            style={{
                                padding: "0.75rem",
                                fontSize: "1.5rem",
                                textAlign: "center",
                                letterSpacing: "0.5rem",
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                                outline: "none"
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: "0.75rem",
                                fontSize: "1rem",
                                backgroundColor: "#0070f3",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            Unlock Access
                        </button>
                    </form>
                    {error && <p style={{ color: "red", marginTop: "1rem", fontWeight: "bold" }}>{error}</p>}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
