"use client";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { DarkModeProvider } from "@/context/DarkModeContext";

const layoutRoutes = ["/home", "/resources", "/saved", "/news", "/settings"];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLayoutPage = layoutRoutes.includes(router.pathname);

  const content = isLayoutPage ? (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  ) : (
    <Component {...pageProps} />
  );

  return <DarkModeProvider>{content}</DarkModeProvider>;
}

export default MyApp;
