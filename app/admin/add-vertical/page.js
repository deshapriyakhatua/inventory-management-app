"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Toast from "../../../components/Toast/Toast";

export default function AddVertical() {
    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verticals, setVerticals] = useState([]);
    const [loadingVerticals, setLoadingVerticals] = useState(true);
    const [refreshingVerticals, setRefreshingVerticals] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        fetchVerticals();
    }, []);

    const fetchVerticals = async (force = false) => {
        if (force) {
            setRefreshingVerticals(true);
        } else {
            setLoadingVerticals(true);
        }
        
        try {
            const response = await fetch("/api/employee/vertical");
            const result = await response.json();
            if (response.ok) {
                setVerticals(result.data || []);
            } else {
                console.error("Failed to fetch verticals:", result.error);
            }
        } catch (error) {
            console.error("Network error fetching verticals:", error);
        } finally {
            setLoadingVerticals(false);
            setRefreshingVerticals(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !shortName) {
            setMessage({ text: "Please fill in all fields.", type: "error" });
            return;
        }

        setIsLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const response = await fetch("/api/admin/vertical/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, shortName }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ text: "Vertical added successfully!", type: "success" });
                setName("");
                setShortName("");
                fetchVerticals();
            } else {
                setMessage({ text: result.error || "Failed to add vertical.", type: "error" });
            }
        } catch (error) {
            console.error("Error adding vertical:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Manage Verticals</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name" className={styles.label}>Vertical Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Earring"
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="shortName" className={styles.label}>Short Name (Code)</label>
                        <input
                            type="text"
                            id="shortName"
                            value={shortName}
                            onChange={(e) => setShortName(e.target.value.toUpperCase())}
                            placeholder="e.g., ER"
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || !name || !shortName}
                    >
                        {isLoading ? "Adding..." : "Add Vertical"}
                    </button>
                </form>

                <Toast
                    message={message}
                    onClose={() => setMessage({ text: "", type: "" })}
                />
            </div>

            <div className={styles.listSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className={styles.listTitle} style={{ marginBottom: 0 }}>Existing Verticals ({verticals.length})</h2>
                    <button
                        type="button"
                        className={`${styles.refreshBtn} ${refreshingVerticals ? styles.spinning : ''}`}
                        onClick={() => fetchVerticals(true)}
                        disabled={loadingVerticals || refreshingVerticals}
                        title="Refresh Verticals"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                </div>
                {loadingVerticals ? (
                    <div className={styles.loading}>Loading verticals...</div>
                ) : (
                    <div className={styles.grid}>
                        {verticals.map((v) => (
                            <div key={v._id} className={styles.verticalCard}>
                                <div className={styles.verticalInfo}>
                                    <h3 className={styles.verticalName}>{v.name}</h3>
                                    <span className={styles.verticalCode}>{v.shortName}</span>
                                </div>
                            </div>
                        ))}
                        {verticals.length === 0 && <p className={styles.empty}>No verticals found.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
