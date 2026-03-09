"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function AddInventory() {
    const [inventoryId, setInventoryId] = useState("");
    const [brand, setBrand] = useState("");
    const [vertical, setVertical] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate a random 6-character alphanumeric ID
    const generateId = async () => {
        try {
            setIsGenerating(true);
            setMessage({ text: "", type: "" });
            if (!brand || !vertical) {
                setMessage({ text: "Please enter both Brand and Vertical to generate an ID.", type: "error" });
                return;
            }
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    pin: sessionStorage.getItem("app_pin"),
                    action: "generateId",
                    brand: brand,
                    vertical: vertical
                }),
            });

            const result = await response.json();
            if (result.status === 200) {
                setInventoryId(result.message); // This sets 'CZ-ER-004'
            } else {
                setMessage({ text: "Failed to generate ID: " + (result.message || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error generating ID:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create a preview URL for the selected image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!inventoryId) {
            setMessage({ text: "Please generate or enter an Inventory ID.", type: "error" });
            return;
        }

        // 1. Grab the PIN from storage
        const storedPin = sessionStorage.getItem("app_pin");

        if (!storedPin) {
            setMessage({ text: "Session expired. Please log in again.", type: "error" });
            return;
        }

        setIsLoading(true);

        try {
            let base64Image = "";
            if (imageFile) {
                // If there's an image, we need to send the base64 string
                base64Image = imagePreview.split(',')[1]; // extract base64 part
            }

            const payload = {
                pin: storedPin,
                action: "addInventory",
                item: {
                    id: inventoryId,
                    brand: brand,
                    vertical: vertical,
                    imageName: imageFile ? imageFile.name : "",
                    imageMimeType: imageFile ? imageFile.type : "",
                    imageData: base64Image
                }
            };

            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.status === 200) {
                setMessage({ text: "Inventory item added successfully!", type: "success" });
                // Reset form
                setInventoryId("");
                setBrand("");
                setVertical("");
                setImageFile(null);
                setImagePreview(null);
                // Reset file input value natively
                document.getElementById('imageUpload').value = "";
            } else {
                setMessage({ text: "Failed to add inventory: " + (result.message || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Add New Inventory</h1>

                <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Brand Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="brand" className={styles.label}>Brand</label>
                        <input
                            type="text"
                            id="brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value.toUpperCase())}
                            placeholder="e.g., CZ"
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Vertical Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="vertical" className={styles.label}>Vertical</label>
                        <input
                            type="text"
                            id="vertical"
                            value={vertical}
                            onChange={(e) => setVertical(e.target.value.toUpperCase())}
                            placeholder="e.g., ER"
                            className={styles.input}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Inventory ID Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="inventoryId" className={styles.label}>Inventory ID</label>
                        <div className={styles.idRow}>
                            <input
                                type="text"
                                id="inventoryId"
                                value={inventoryId}
                                onChange={(e) => setInventoryId(e.target.value.toUpperCase())}
                                placeholder="e.g., CZ-ER-004"
                                className={styles.input}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={async () => await generateId()}
                                className={styles.generateBtn}
                                disabled={isLoading || isGenerating}
                            >
                                {isGenerating ? "Generating..." : inventoryId ? "Regenerate ID" : "Generate ID"}
                            </button>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="imageUpload" className={styles.label}>Upload Image</label>
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Image Preview Section */}
                    {imagePreview && (
                        <div className={styles.previewContainer}>
                            <p className={styles.previewLabel}>Image Preview:</p>
                            <div style={{ position: 'relative', width: '100%', height: '250px' }}>
                                <Image
                                    src={imagePreview}
                                    alt="Inventory Preview"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className={styles.previewImage}
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || (!inventoryId && !imageFile)}
                    >
                        {isLoading ? "Adding Item..." : "Add to Inventory"}
                    </button>

                </form>

                {/* Feedback Message */}
                {message.text && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
