"use client";
import { useEffect, useState } from "react";

const EMPTY = {
    series: [],
    axis: "",
    axisText: "",
    grid: "",
    text: "",
};

function readColors() {
    const css = getComputedStyle(document.documentElement);
    const get = (name) => css.getPropertyValue(name).trim();
    return {
        series: [1, 2, 3, 4, 5, 6].map((n) => get(`--chart-${n}`)),
        axis: get("--color-border-strong"),
        axisText: get("--color-text-muted"),
        grid: get("--color-border"),
        text: get("--color-text"),
    };
}

// Re-reads tokens when `data-theme` changes or the OS scheme flips.
export function useChartColors() {
    const [colors, setColors] = useState(EMPTY);

    useEffect(() => {
        const update = () => setColors(readColors());
        update();

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
        media.addEventListener("change", update);
        return () => {
            observer.disconnect();
            media.removeEventListener("change", update);
        };
    }, []);

    return colors;
}
