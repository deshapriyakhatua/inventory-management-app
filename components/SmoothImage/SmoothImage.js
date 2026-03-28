"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "./SmoothImage.module.css";

const SmoothImage = ({ src, alt, fill, className, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={styles.imageWrapper}>
            {!isLoaded && <div className={styles.placeholder}></div>}
            <Image
                src={src}
                alt={alt}
                fill={fill}
                onLoad={() => setIsLoaded(true)}
                className={`${styles.image} ${isLoaded ? styles.loaded : ""} ${className || ""}`}
                {...props}
            />
        </div>
    );
};

export default SmoothImage;
