"use client";
import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

export default function Toast({ message, onClose, duration = 3000 }) {
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (message?.text && !isHovered) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, onClose, duration, isHovered]);

    if (!message?.text) return null;

    return (
        <div 
            className={`${styles.message} ${styles[message.type] || ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                if (onClose) onClose();
            }}
        >
            {message.text}
        </div>
    );
}
