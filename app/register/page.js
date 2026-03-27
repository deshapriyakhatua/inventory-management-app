"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import styles from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pin !== formData.confirmPin) {
      toast.error("PINs do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/public/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          pin: formData.pin,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully!");
        setTimeout(() => {
          router.push("/login"); // Redirect to login page
        }, 1500);
      } else {
        toast.error(data.error || "Registration failed");
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("An error occurred. Please try again later.");
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
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join to start managing your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={styles.input}
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className={styles.input}
              placeholder="e.g. 9876543210"
              value={formData.phone}
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
              className={styles.input}
              placeholder="••••"
              value={formData.pin}
              onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPin" className={styles.label}>
              Confirm 4-Digit PIN
            </label>
            <input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className={styles.input}
              placeholder="••••"
              value={formData.confirmPin}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPin: e.target.value.replace(/\D/g, '') }))}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <><div className={styles.spinner}></div> Creating account...</>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p className={styles.linkText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
