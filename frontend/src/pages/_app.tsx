"use client";
import "@/styles/globals.css";
import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { AppProps } from "next/app";
import { makeStore, AppStore } from "@/redux/store";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import FirmCreationScreen from "@/components/FirmCreation";
import { API_BASE_URL } from "@/redux/api/api.config";
import { AppSidebar } from "@/components/SideBar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import ModalManager from "@/components/_modal/modalManager";
import Link from "next/link";
import { useRouter } from "next/router";
import RazorpayScriptLoader from "@/components/RazorpayScriptLoader";
import UserInfo from "@/components/UserInfo";
import SubscriptionExpiredModal from "@/components/_modal/SubscriptionExpireModal";
import { useAppSelector } from "@/redux/hooks";
import Sync from "@/components/Sync";
import Updater from "@/components/Updater";
import { DeleteConfirmationProvider } from "@/lib/context/DeleteConfirmationContext";
import { hasPermission } from "@/lib/role-permissions-mapping";
// Subscription access control wrapper component
const SubscriptionGuard = ({ children, router }) => {
  const userInfo = useAppSelector((state) => state.userinfo);
  const [showRouteBlocked, setShowRouteBlocked] = useState(false);

  // Define allowed routes that don't require subscription
  const publicRoutes = [
    "/login",
    "/pricing",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const homeRoutes = ["/", "/home", "/dashboard"];

  const isPublicRoute = publicRoutes.some((route) =>
    router.pathname.startsWith(route)
  );
  const isHomeRoute = homeRoutes.some((route) => router.pathname === route);

  useEffect(() => {
    // Skip checking for public routes
    if (isPublicRoute) return;

    // If subscription is expired and route is not allowed
    if (userInfo?.isExpired && !isHomeRoute) {
      setShowRouteBlocked(true);

      // Redirect to pricing after a short delay if not already there
      const timer = setTimeout(() => {
        router.push("/pricing");
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowRouteBlocked(false);
    }
  }, [userInfo?.isExpired, router.pathname, isPublicRoute, isHomeRoute]);

  if (showRouteBlocked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Subscription Required</h3>
          <p className="text-gray-600 mb-6">
            Your subscription has expired. You need an active subscription to
            access this page. Redirecting to pricing page...
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function MyApp({ Component, pageProps }: AppProps) {
  const storeRef = useRef<AppStore | null>(null);
  const [hasFirm, setHasFirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  const handleUpdateComplete = () => {
    // Handle post-update actions
    console.log("Update completed successfully");
    router.push("/");
  };

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/init`)
      .then(() => console.log("Tables created successfully"))
      .catch((error) => console.error("Error creating tables:", error));
  }, []);

  // ✅ Conditionally apply layout based on route
  const isDocumentRoute =
    router.pathname.includes("/document") && !router.pathname.includes("list");

  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
     const role = useAppSelector((state) => state.firm.role);
    return(
   

    <div className="w-full flex bg-primary text-black">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="border flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex justify-end w-full items-center gap-2 px-4">
              <div className="flex justify-center gap-3">
                { hasPermission(role , 'sale_invoice','create') &&<Link
                  href="/document/sale_invoice"
                  className="shadow-md gap-2 h-10 text-sm font-medium py-2 px-4 items-center flex justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Sale
                </Link>}
                { hasPermission(role , 'purchase_invoice','create') &&<Link
                  href="/document/purchase_invoice"
                  className="shadow-md gap-2 h-10 text-sm font-medium py-2 px-4 items-center flex justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Purchase
                </Link>}
              </div>
            </div>
          </header>
          <div className="bg-[#cfdbe6] h-full">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );}

  // Wrapper with store to use Redux hooks
  const AppWrapper = () => {
    const login = useAppSelector((state) => state.userinfo.login);
    useEffect(() => {
      const userId = localStorage.getItem("customer_id");
      const onLoginPage = router.pathname === "/login";

      if (!userId && !onLoginPage && !login) {
        router.push("/login");
      }
    }, [router.pathname]);
    return (
      <>
        <Updater onUpdateComplete={handleUpdateComplete} />
        <Sync />
        <UserInfo />
        <SubscriptionExpiredModal />

        <SubscriptionGuard router={router}>
          {isDocumentRoute ||
          router.pathname.includes("login") ||
          (router.pathname.includes("firm") &&
            !router.pathname.includes("edit-firm")) ? (
            <Component {...pageProps} />
          ) : (
            <LayoutWrapper>
              <Component {...pageProps} />
            </LayoutWrapper>
          )}
        </SubscriptionGuard>
      </>
    );
  };

  return (
    <Provider store={storeRef.current}>
      <Toaster />
      <ModalManager />
      <RazorpayScriptLoader />
      <DeleteConfirmationProvider>
        <AppWrapper />
      </DeleteConfirmationProvider>
    </Provider>
  );
}

export default MyApp;
