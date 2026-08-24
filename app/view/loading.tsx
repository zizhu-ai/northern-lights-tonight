import styles from "@/app/part4.module.css";

export default function ViewLoading() {
  return (
    <main className={`tool-page ${styles.page} ${styles.narrow}`}>
      <p role="status">Reading tonight’s sky…</p>
    </main>
  );
}
