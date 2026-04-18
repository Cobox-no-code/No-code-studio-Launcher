"use client";
import Layout from "@/components/Layout";
import { DarkModeProvider } from "@/context/DarkModeContext";
import { DownloadProvider } from "@/context/ProgressContext";
import { UserProvider } from "@/context/UserContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
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

  return (
    <UserProvider>
      <DownloadProvider>
        <Toaster
          // The desired position for the toasts
          position="top-center" // Options: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right, center
          toastOptions={{
            // Use a long duration to give users time to read
            duration: 2000,

            // This style is applied to the container of our custom component
            // We make it transparent because our component has its own styling
            style: {
              background: "transparent",
              boxShadow: "none",
              padding: 0,
            },
          }}
        />
        <DarkModeProvider>{content}</DarkModeProvider>
      </DownloadProvider>
    </UserProvider>
  );
}

export default MyApp;
