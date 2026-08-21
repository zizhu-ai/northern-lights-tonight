"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import copy from "@/content/ui-copy.json";

import { PlaceSearchForm } from "./place-search-form";
import styles from "@/app/part4.module.css";

export function NotFoundContent() {
  const pathname = usePathname();
  const isBoston = pathname.toLowerCase().replace(/\/+$/, "") === "/forecast/boston";

  return (
    <main className={styles.notFound}>
      <h1>{copy.not_found.title}</h1>
      <p>{isBoston ? copy.not_found.boston : copy.not_found.generic}</p>

      {isBoston ? (
        <div className={styles.notFoundActions}>
          <Link href="/forecast/massachusetts">{copy.not_found.boston_cta}</Link>
        </div>
      ) : (
        <div className={styles.notFoundActions}>
          <p>{copy.not_found.find_cta}</p>
          <PlaceSearchForm />
        </div>
      )}
    </main>
  );
}
