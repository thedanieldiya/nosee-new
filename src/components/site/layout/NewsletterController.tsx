"use client";

import { useEffect } from "react";

export function NewsletterController() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>("[data-newsletter-form]");
    const error = document.querySelector<HTMLElement>("[data-newsletter-error]");
    if (!form || !error) return;
    // Task 03 exception: preserve the form, but neither transmit email nor claim subscription.
    const submit = (event: SubmitEvent) => {
      event.preventDefault();
      if (form.reportValidity()) error.hidden = false;
    };
    form.addEventListener("submit", submit);
    return () => form.removeEventListener("submit", submit);
  }, []);
  return null;
}
