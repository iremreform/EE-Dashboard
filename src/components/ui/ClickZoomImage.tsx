"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ClickZoomImage.module.css";

type ClickZoomImageProps = {
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  src: string;
};

export function ClickZoomImage({
  alt,
  className,
  loading = "lazy",
  src,
}: ClickZoomImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function close() {
      setIsOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, { passive: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label={`Zoom ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={className ?? styles.image} src={src} alt={alt} loading={loading} />
      </button>

      {isOpen
        ? createPortal(
            <div
              className={styles.lightbox}
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={() => setIsOpen(false)}
            >
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close image preview"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsOpen(false);
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.zoomedImage} src={src} alt={alt} loading="eager" />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
