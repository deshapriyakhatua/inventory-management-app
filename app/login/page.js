"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: "", pin: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = {
    identifier: formData.identifier.trim() ? "" : "Phone number is required",
    pin: /^\d{4}$/.test(formData.pin) ? "" : "Enter your 4-digit PIN",
  };
  const showError = (name) => (touched[name] ? errors[name] : undefined);
  const markTouched = (e) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errors.identifier || errors.pin) {
      setTouched({ identifier: true, pin: true });
      return;
    }
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
        
        // Save PIN for Google Apps Script interactions
        sessionStorage.setItem("app_pin", formData.pin);

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
      <Card variant="raised" padding="lg" className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to access your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField label="Phone Number" error={showError("identifier")}>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              required
              placeholder="Enter phone number"
              value={formData.identifier}
              onChange={handleChange}
              onBlur={markTouched}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="4-Digit PIN" error={showError("pin")}>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className={styles.pinInput}
              placeholder="••••"
              value={formData.pin}
              onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
              onBlur={markTouched}
              disabled={isLoading}
            />
          </FormField>

          <Button type="submit" size="lg" loading={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className={styles.linkText}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.link}>
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
