// pages/_app.tsx
"use client";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";

// Optional: list routes that should use Layout
const layoutRoutes = ["/home", "/lobby"]; // add more as needed

import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isLayoutPage = layoutRoutes.includes(router.pathname);

  return isLayoutPage ? (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  ) : (
    <Component {...pageProps} />
  );
}

export default MyApp;
