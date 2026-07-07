"use client";

import { useEffect, useRef } from "react";

type FormDraftManagerProps = {
  restore: boolean;
  storageKey: string;
};

export function FormDraftManager({ restore, storageKey }: FormDraftManagerProps) {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = markerRef.current?.closest("form");

    if (!form) {
      return;
    }

    if (!restore) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    const storedDraft = window.sessionStorage.getItem(storageKey);

    if (!storedDraft) {
      return;
    }

    try {
      const values = JSON.parse(storedDraft) as Record<string, string>;
      restoreFormValues(form, values);
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [restore, storageKey]);

  useEffect(() => {
    const form = markerRef.current?.closest("form");

    if (!form) {
      return;
    }

    const handleSubmit = () => {
      window.sessionStorage.setItem(storageKey, JSON.stringify(collectFormValues(form)));
    };

    form.addEventListener("submit", handleSubmit);

    return () => {
      form.removeEventListener("submit", handleSubmit);
    };
  }, [storageKey]);

  return <span ref={markerRef} hidden />;
}

function collectFormValues(form: HTMLFormElement) {
  const formData = new FormData(form);
  const values: Record<string, string> = {};

  for (const [name, value] of formData.entries()) {
    if (typeof value === "string") {
      values[name] = value;
    }
  }

  return values;
}

function restoreFormValues(form: HTMLFormElement, values: Record<string, string>) {
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input[name], select[name], textarea[name]",
  );

  fields.forEach((field) => {
    if (field instanceof HTMLInputElement && field.type === "password") {
      return;
    }

    const value = values[field.name];

    if (typeof value !== "string") {
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = value === "on" || value === field.value;
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "radio") {
      field.checked = value === field.value;
      return;
    }

    field.value = value;
  });
}
