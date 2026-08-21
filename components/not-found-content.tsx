import Link from "next/link";

import copy from "@/content/ui-copy.json";

import { PlaceSearchForm } from "./place-search-form";
import styles from "@/app/part4.module.css";

type NotFoundContentProps = {
  variant?: "generic" | "boston";
};

export function NotFoundContent({ variant = "generic" }: NotFoundContentProps) {
  const isBoston = variant === "boston";

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
