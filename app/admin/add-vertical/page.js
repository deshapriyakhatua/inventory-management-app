"use client";
import { toast } from "sonner";



import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import FormField from "@/components/ui/FormField/FormField";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./page.module.css";


export default function AddVertical() {
    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verticals, setVerticals] = useState([]);
    const [loadingVerticals, setLoadingVerticals] = useState(true);
    const [refreshingVerticals, setRefreshingVerticals] = useState(false);
    const [touched, setTouched] = useState({});

    const errors = {
        name: name ? "" : "Vertical name is required",
        shortName: shortName ? "" : "Short name is required",
    };
    const showError = (field) => (touched[field] ? errors[field] : undefined);
    const markTouched = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));


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
            setTouched({ name: true, shortName: true });
            toast.error("Please fill in all fields.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setIsLoading(true);
        toast.dismiss("app-feedback");

        try {
            const response = await fetch("/api/admin/vertical/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, shortName }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Vertical added successfully!", { id: "app-feedback", duration: 3000 });
                setName("");
                setShortName("");
                setTouched({});
                fetchVerticals();
            } else {
                toast.error(result.error || "Failed to add vertical.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Error adding vertical:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageShell className={styles.shell}>
            <PageHeader title="Manage Verticals" />

            <Card padding="lg">
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <FormField label="Vertical Name" error={showError("name")}>
                        <Input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={markTouched("name")}
                            placeholder="e.g., Earring"
                            disabled={isLoading}
                        />
                    </FormField>

                    <FormField label="Short Name (Code)" error={showError("shortName")}>
                        <Input
                            type="text"
                            id="shortName"
                            value={shortName}
                            onChange={(e) => setShortName(e.target.value.toUpperCase())}
                            onBlur={markTouched("shortName")}
                            placeholder="e.g., ER"
                            disabled={isLoading}
                        />
                    </FormField>

                    <div className={styles.actions}>
                        <Button type="submit" loading={isLoading}>
                            {isLoading ? "Adding..." : "Add Vertical"}
                        </Button>
                    </div>
                </form>
            </Card>

            <section className={styles.list}>
                <div className={styles.listHeader}>
                    <h2 className={styles.listTitle}>Existing Verticals ({verticals.length})</h2>
                    <IconButton
                        name="refresh"
                        aria-label="Refresh Verticals"
                        title="Refresh Verticals"
                        onClick={() => fetchVerticals(true)}
                        disabled={loadingVerticals}
                        loading={refreshingVerticals}
                    />
                </div>
                {loadingVerticals ? (
                    <div className={styles.grid} aria-busy="true" aria-label="Loading verticals...">
                        {Array.from({ length: 6 }, (_, i) => (
                            <Skeleton key={i} className={styles.skeleton} />
                        ))}
                    </div>
                ) : verticals.length === 0 ? (
                    <EmptyState title="No verticals found." />
                ) : (
                    <div className={styles.grid}>
                        {verticals.map((v) => (
                            <Card key={v._id} padding="sm" className={styles.vertical}>
                                <h3 className={styles.verticalName}>{v.name}</h3>
                                <Badge tone="accent">{v.shortName}</Badge>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </PageShell>
    );
}
