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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = {
    name: formData.name.trim() ? "" : "Full name is required",
    phone: formData.phone.trim() ? "" : "Phone number is required",
    pin: /^\d{4}$/.test(formData.pin) ? "" : "PIN must be 4 digits",
    confirmPin: formData.pin !== formData.confirmPin ? "PINs do not match" : "",
  };
  const showError = (name) => (touched[name] ? errors[name] : undefined);
  const markTouched = (e) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(errors).some(Boolean)) {
      setTouched({ name: true, phone: true, pin: true, confirmPin: true });
      if (errors.confirmPin) toast.error("PINs do not match!");
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

  const pinChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value.replace(/\D/g, '') }));

  return (
    <div className={styles.container}>
      <Card variant="raised" padding="lg" className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join to start managing your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField label="Full Name" error={showError("name")}>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              onBlur={markTouched}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Phone Number" error={showError("phone")}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={formData.phone}
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
              onChange={pinChange("pin")}
              onBlur={markTouched}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Confirm 4-Digit PIN" error={showError("confirmPin")}>
            <Input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              className={styles.pinInput}
              placeholder="••••"
              value={formData.confirmPin}
              onChange={pinChange("confirmPin")}
              onBlur={markTouched}
              disabled={isLoading}
            />
          </FormField>

          <Button type="submit" size="lg" loading={isLoading}>
            {isLoading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className={styles.linkText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
