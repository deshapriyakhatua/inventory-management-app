"use client";

import { useState, useEffect } from "react";

export default function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Replace with your actual Google Apps Script Web App URL
    const SCRIPT_URL = process.env.NEXT_PUBLIC_SCRIPT_URL;

    useEffect(() => {
        setIsMounted(true);

        // Using sessionStorage so the PIN is cleared when the tab is closed
        const storedPin = sessionStorage.getItem("app_pin");

        // Simple validation: Ensure it exists and is exactly 4 digits
        if (storedPin && /^\d{4}$/.test(storedPin)) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(pin)) {
            setError("Please enter a valid 4-digit PIN.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // We send as text/plain to avoid the CORS pre-flight "OPTIONS" request
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({
                    action: "verifyPin",
                    pin: pin
                }),
            });

            const text = await response.text(); // Get response as text first
            const result = JSON.parse(text);    // Then parse it manually

            if (result.status === 200) {
                sessionStorage.setItem("app_pin", pin);
                setIsAuthenticated(true);
            } else {
                // clear input field
                setPin("");
                setError("Access Denied: Invalid PIN.");
            }
        } catch (err) {
            // If we still get 'Unexpected end of input', it means the redirect failed.
            setError("Auth Error: Could not verify PIN. Please re-deploy your Script as a NEW VERSION.");
            console.error("Auth Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    if (!isAuthenticated) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                padding: "20px",
                fontFamily: "sans-serif",
                backgroundColor: "#0f172a" // Deep navy/dark background
            }}>
                <div style={{
                    maxWidth: "400px",
                    width: "100%",
                    padding: "2.5rem",
                    border: "1px solid #1e293b", // Subtle border
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                    textAlign: "center",
                    backgroundColor: "#1e293b" // Card background
                }}>
                    <h2 style={{ marginBottom: "1rem", color: "#f8fafc" }}>Inventory Access</h2>
                    <p style={{ marginBottom: "1.5rem", color: "#94a3b8" }}>Enter your secure 4-digit staff PIN.</p>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            disabled={isLoading}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            style={{
                                padding: "1rem",
                                fontSize: "2rem",
                                textAlign: "center",
                                letterSpacing: "1rem",
                                borderRadius: "8px",
                                border: "2px solid #334155",
                                outline: "none",
                                backgroundColor: "#0f172a", // Darker input background
                                color: "#38bdf8", // Bright blue text for contrast
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#0070f3"}
                            onBlur={(e) => e.target.style.borderColor = "#334155"}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: "0.85rem",
                                fontSize: "1rem",
                                backgroundColor: isLoading ? "#334155" : "#0070f3",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                fontWeight: "bold",
                                transition: "all 0.2s",
                                boxShadow: isLoading ? "none" : "0 4px 14px 0 rgba(0, 112, 243, 0.39)"
                            }}
                        >
                            {isLoading ? "Verifying..." : "Unlock Access"}
                        </button>
                    </form>
                    {error && (
                        <p style={{
                            color: "#fb7185", // Soft red/pink for dark mode errors
                            marginTop: "1.5rem",
                            fontSize: "0.9rem",
                            backgroundColor: "rgba(251, 113, 133, 0.1)",
                            padding: "8px",
                            borderRadius: "4px"
                        }}>
                            {error}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}