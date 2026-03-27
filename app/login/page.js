"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: "", pin: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/public/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.identifier,
          pin: formData.pin,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful!");
        // Small delay to show the toast
        setTimeout(() => {
          router.push("/"); // Redirect to dashboard / home
        }, 1000);
      } else {
        toast.error(data.error || "Login failed");
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("An error occurred during login. Please try again.");
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className={styles.container}>
      <Toaster position="top-center" richColors />
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to access your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier" className={styles.label}>
              Phone Number
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              className={styles.input}
              placeholder="Enter phone number"
              value={formData.identifier}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="pin" className={styles.label}>
              4-Digit PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className={`${styles.input} ${styles.pinInput}`}
              placeholder="••••"
              value={formData.pin}
              onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <><div className={styles.spinner}></div> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className={styles.linkText}>
          Don't have an account?{" "}
          <Link href="/register" className={styles.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
