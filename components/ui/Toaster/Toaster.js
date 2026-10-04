"use client";

import { useSyncExternalStore } from "react";
import { Toaster as SonnerToaster } from "sonner";
import cx from "../cx";
import styles from "./Toaster.module.css";

const mobileQuery = "(max-width: 640px)";

function subscribe(callback) {
  const mediaQuery = window.matchMedia(mobileQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export default function Toaster({ className, toastOptions, ...rest }) {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const classNames = toastOptions?.classNames || {};

  return (
    <SonnerToaster
      {...rest}
      position={isMobile ? "top-center" : "top-right"}
      className={cx(styles.root, className)}
      toastOptions={{
        duration: 3000,
        ...toastOptions,
        classNames: {
          ...classNames,
          toast: cx(styles.toast, classNames.toast),
          success: cx(styles.success, classNames.success),
          warning: cx(styles.warning, classNames.warning),
          error: cx(styles.error, classNames.error),
          info: cx(styles.info, classNames.info),
          title: cx(styles.title, classNames.title),
          description: cx(styles.description, classNames.description),
        },
      }}
    />
  );
}