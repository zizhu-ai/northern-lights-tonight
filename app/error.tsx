"use client";

import Link from "next/link";

import copy from "@/content/ui-copy.json";
import styles from "@/app/part4.module.css";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={styles.notFound}>
      <h1>{copy.error.title}</h1>
      <p>{copy.error.body}</p>
      <div className={styles.notFoundActions}>
        <button type="button" onClick={reset}>
          {copy.chrome.try_again}
        </button>
        <Link href="/">{copy.error.home_cta}</Link>
      </div>
    </main>
  );
}
