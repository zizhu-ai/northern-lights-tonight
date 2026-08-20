import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Northern Lights Tonight",
  description: "Local aurora go / maybe / no for the US. Pipeline stub — not indexed yet.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", margin: 0, background: "#0b1020", color: "#e8eef7" }}>
        {children}
      </body>
    </html>
  );
}
