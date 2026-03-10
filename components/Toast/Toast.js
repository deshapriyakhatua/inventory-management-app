"use client";
import { useEffect } from "react";
import styles from "./Toast.module.css";

export default function Toast({ message, onClose, duration = 3000 }) {
    useEffect(() => {
        if (message?.text) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, onClose, duration]);

    if (!message?.text) return null;

    return (
        <div className={`${styles.message} ${styles[message.type] || ""}`}>
            {message.text}
        </div>
    );
}
