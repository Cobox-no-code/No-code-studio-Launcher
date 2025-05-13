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
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import ModalManager from "@/components/_modal/modalManager";
import Link from "next/link";
import { useRouter } from "next/router";
import RazorpayScriptLoader from "@/components/RazorpayScriptLoader";
import UserInfo from "@/components/UserInfo";

function MyApp({ Component, pageProps }: AppProps) {
  const storeRef = useRef<AppStore | null>(null);
  const [hasFirm, setHasFirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

useEffect(() => {
  const userId = localStorage.getItem("customer_id");
  const onLoginPage = router.pathname === "/login";

  if (!userId && !onLoginPage) {
    router.push("/login");
  }
}, [router.pathname]);




  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/init`)
      .then(() => console.log("Tables created successfully"))
      .catch((error) => console.error("Error creating tables:", error));
  }, []);

  // ✅ Conditionally apply layout based on route
  const isDocumentRoute = router.pathname.includes('/document') && !router.pathname.includes('list');

  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex bg-primary text-black">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="border flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex justify-end w-full items-center gap-2 px-4">
              <div className="flex justify-center gap-3">
                <Link
                  href="/document/sale_invoice"
                  className="shadow-md gap-2 h-10 text-sm font-medium py-2 px-4 items-center flex justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Sale
                </Link>
                <Link
                  href="/document/purchase_invoice"
                  className="shadow-md gap-2 h-10 text-sm font-medium py-2 px-4 items-center flex justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Purchase
                </Link>
              </div>
            </div>
          </header>
          <div className="bg-[#cfdbe6] h-full">
          
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );

  return (
    <Provider store={storeRef.current}>
      <Toaster />
        <ModalManager />

        <RazorpayScriptLoader/>
        {isDocumentRoute || router.pathname.includes('login') || router.pathname.includes('firm') && !router.pathname.includes('edit-firm') ? (
          <Component {...pageProps} />
        ) : (
          <LayoutWrapper>
            <UserInfo/>
          <Component {...pageProps} />
          </LayoutWrapper>
        )}
    </Provider>
  );
}

export default MyApp;
