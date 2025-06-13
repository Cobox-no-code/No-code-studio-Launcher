"use client";
import { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Check,
  ChevronsUpDown,
  Building,
  PlusCircle,
  LogOut,
  Share2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { clearCurrentFirm } from "@/lib/firm-utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { backend_url } from "@/backend.config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Badge } from "@/components/ui/badge";
import { fetchFirms, setCurrentFirm, updateRole } from "@/redux/slices/firmSlice";
import { setUserInfo } from "@/redux/slices/userinfoSlice";

import toast from "react-hot-toast";
import {
  useGetPurchaseInvoicesQuery,
  useGetSaleInvoicesQuery,
} from "@/redux/api/documentApi";
import { useGetItemsQuery } from "@/redux/api/itemsApi";
import { useGetBankAccountsQuery } from "@/redux/api/bankingApi";
import { fetchFirm } from "@/lib/sync-enable";
import { useApiUrl } from "@/hooks/useApiUrl";
import { setSyncEnabled } from "@/redux/slices/sync";


// Type definitions
interface Company {
  id: string;
  name: string;
  country?: string | null;
  phone?: string | null;
  isShared?: boolean;
  role?: string;
}

interface CompanySelectorProps {
  isBottom?: boolean;
}

interface SyncStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed" | "error";
  description?: string;
}

const CompanySelector = ({
  isBottom = false,
}: CompanySelectorProps): JSX.Element => {
  const router = useRouter();
  const user = useAppSelector((state) => state.userinfo);
  const {role,loading} = useAppSelector((state) => state.firm);
  const [open, setOpen] = useState<boolean>(false);
  const companies = useAppSelector((state) => state.firm.firms);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const apiUrl = useApiUrl();
  const [isFullPageLoading, setIsFullPageLoading] = useState<boolean>(false);
  const [syncSteps, setSyncSteps] = useState<SyncStep[]>([]);
  const [loadingCompanyId, setLoadingCompanyId] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  // Fetch data using RTK Query
  const {
    data: salesInvoices = [],
    isLoading: isLoadingSales,
    refetch: refetchSales,
  } = useGetSaleInvoicesQuery({});

  const {
    data: purchaseInvoices = [],
    isLoading: isLoadingPurchases,
    refetch: refetchPurchase,
  } = useGetPurchaseInvoicesQuery({});

  const {
    data: items = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = useGetItemsQuery({});

  const {
    data: bankAccounts = [],
    isLoading: isLoadingBankAccounts,
    refetch: refetchBank,
  } = useGetBankAccountsQuery();
  
  const firmId =
    typeof window !== "undefined" ? localStorage.getItem("firmId") : null;
  
  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`${apiUrl}/firms/${firmId}`);
      if (res.data) {
        setSelectedCompany(res.data.name);
      }
    };
    if (firmId) {
      fetch();
    }
  }, [firmId]);

  // Initialize sync steps
  const initializeSyncSteps = (): SyncStep[] => [
    {
      id: "company-data",
      label: "Fetching Company Data",
      status: "pending",
      description: "Loading company information and settings",
    },
    {
      id: "items-data",
      label: "Syncing Items",
      status: "pending",
      description: "Loading products and services",
    },
    {
      id: "sales-data",
      label: "Syncing Sales Data",
      status: "pending",
      description: "Loading sales invoices and transactions",
    },
    {
      id: "purchase-data",
      label: "Syncing Purchase Data",
      status: "pending",
      description: "Loading purchase invoices and bills",
    },
    {
      id: "bank-data",
      label: "Syncing Bank Accounts",
      status: "pending",
      description: "Loading bank accounts and transactions",
    },
    {
      id: "finalize",
      label: "Finalizing Setup",
      status: "pending",
      description: "Completing the sync process",
    },
  ];

  const updateSyncStep = (
    stepId: string,
    status: SyncStep["status"],
    description?: string
  ) => {
    setSyncSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? { ...step, status, description: description || step.description }
          : step
      )
    );
  };
// 1. Add helper function to handle fallback firm selection
const handleFallbackFirmSelection = () => {
  // First try to select any owned company
  if (ownedCompanies.length > 0) {
    const fallbackCompany = ownedCompanies[0];
    dispatch(setCurrentFirm(fallbackCompany));
    dispatch(updateRole("admin"));
    setSelectedCompany(fallbackCompany.name);
    localStorage.setItem("firmId", fallbackCompany.id);
    toast.success(`Switched to ${fallbackCompany.name}`);
    router.push("/");
    return true;
  }
  
  // If no owned companies, try any available company
  if (companies.length > 0) {
    const fallbackCompany = companies[0];
    dispatch(setCurrentFirm(fallbackCompany));
    dispatch(updateRole(fallbackCompany.role || "viewer"));
    setSelectedCompany(fallbackCompany.name);
    localStorage.setItem("firmId", fallbackCompany.id);
    toast.success(`Switched to ${fallbackCompany.name}`);
    router.push("/");
    return true;
  }
  
  // No companies available, redirect to firm creation
  clearCurrentFirm();
  toast.error("No companies available. Please create a new company.");
  router.push("/firm");
  return false;
};

// 2. Modified performSteppedSync function with error handling
const performSteppedSync = async (company: any) => {
  const owner = user.phone;
  console.log(company.id);
  
  try {


 

    // Step 1: Company Data
    updateSyncStep("company-data", "loading");
    await new Promise((resolve) => setTimeout(resolve, 500));
    updateSyncStep("company-data", "completed", "Company data loaded successfully");

    // Step 2: Items Data
    updateSyncStep("items-data", "loading");
    try {
      await refetchItems();
      updateSyncStep("items-data", "completed", `${items.length} items synced`);
    } catch (error) {
      updateSyncStep("items-data", "error", "Failed to sync items");
      throw error;
    }

    // Step 3: Sales Data
    updateSyncStep("sales-data", "loading");
    try {
      await refetchSales();
      updateSyncStep("sales-data", "completed", `${salesInvoices.length} sales records synced`);
    } catch (error) {
      updateSyncStep("sales-data", "error", "Failed to sync sales data");
      throw error;
    }

    // Step 4: Purchase Data
    updateSyncStep("purchase-data", "loading");
    try {
      await refetchPurchase();
      updateSyncStep("purchase-data", "completed", `${purchaseInvoices.length} purchase records synced`);
    } catch (error) {
      updateSyncStep("purchase-data", "error", "Failed to sync purchase data");
      throw error;
    }

    // Step 5: Bank Data
    updateSyncStep("bank-data", "loading");
    try {
      await refetchBank();
      updateSyncStep("bank-data", "completed", `${bankAccounts.length} bank accounts synced`);
    } catch (error) {
      updateSyncStep("bank-data", "error", "Failed to sync bank data");
      throw error;
    }

    // Step 6: Finalize
    updateSyncStep("finalize", "loading");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateSyncStep("finalize", "completed", "Sync completed successfully");
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast.success(`Successfully switched to ${company.name}`);
    router.push("/");
    
  } catch (error) {
    console.error("Sync failed:", error);
    
    // Reset loading states
    setIsFullPageLoading(false);
    setLoadingCompanyId(null);
    
    // Show error message
    toast.error(`Failed to sync ${company.name}. Switching to available company.`);
    
    // Try to switch to fallback firm
    const fallbackSuccess = handleFallbackFirmSelection();
    
    // If no fallback available, just close the loading
    if (!fallbackSuccess) {
      setOpen(false);
    }
  }
};

// 3. Add check in useEffect to handle case when current firm becomes unavailable
useEffect(() => {
  const checkCurrentFirm = async () => {
    if (firmId && companies.length > 0) {
      const currentFirm = companies.find(company => company.id === firmId);
      
      // If current firm is not found in available companies
      if (!currentFirm) {
        console.log("Current firm not found in available companies");
        handleFallbackFirmSelection();
      }
    }
  };
  
  if (companies.length > 0 && !loading) {
    checkCurrentFirm();
  }
}, [companies, firmId, loading]);

// 4. Enhanced handleCompanyChange with better error handling
const handleCompanyChange = async (company: any) => {
  setLoadingCompanyId(company.id);
  dispatch(setCurrentFirm(company));
  setSelectedCompany(company.name);
  setOpen(false);

  try {
    if (company.isShared !== undefined) {
      dispatch(setSyncEnabled(true))
      setIsFullPageLoading(true);
      setSyncSteps(initializeSyncSteps());
      dispatch(updateRole(company.role));
      await performSteppedSync(company);
    } else {
     
      dispatch(setSyncEnabled(false))
      // Simple loading for non-shared companies
      dispatch(updateRole("admin"));
      
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      toast.success(`Switched to ${company.name}`);
      setLoadingCompanyId(null);
      router.push("/");
    }
  } catch (error) {
    console.error("Company change failed:", error);
    setLoadingCompanyId(null);
    toast.error("Failed to switch company");
    
    // Try fallback selection
    handleFallbackFirmSelection();
  }
};
  useEffect(() => {
    // Fetch all companies
    if (user.phone) {
     dispatch(fetchFirms());
    }
  }, [user]);

  


  const handleRemoveCompany = (): void => {
    clearCurrentFirm();
    router.push("/firm");
    setSelectedCompany("");
    setOpen(false);
  };
  
  const handleLogout = (): void => {
    localStorage.removeItem("name");
    localStorage.removeItem("phone");
    localStorage.removeItem("email");
    localStorage.removeItem("cachedUserInfo");
    localStorage.removeItem("cachedSubscription");
    localStorage.removeItem("customer_id");
    router.push("/login");
    setOpen(false);
  };

  const handleCreateNewCompany = (): void => {
    clearCurrentFirm();
    router.push("/firm");
  };

  // Group companies by type (owned vs shared)
  const ownedCompanies = companies.filter((company) => !company.isShared);
  const sharedCompanies = companies.filter((company) => company.isShared);

  // Improved full page loading overlay for shared companies
  if (isFullPageLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-slate-200">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Syncing Company Data
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              We&lsquo;re securely syncing your shared company data. This ensures you get the latest information.
            </p>
          </div>

          <div className="space-y-5">
            {syncSteps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 relative">
                    {step.status === "pending" && (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-50" />
                    )}
                    {step.status === "loading" && (
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                        <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-ping opacity-30" />
                      </div>
                    )}
                    {step.status === "completed" && (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    {step.status === "error" && (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-semibold truncate",
                          step.status === "completed" && "text-green-700",
                          step.status === "loading" && "text-blue-700",
                          step.status === "error" && "text-red-700",
                          step.status === "pending" && "text-gray-500"
                        )}
                      >
                        {step.label}
                      </span>
                      {step.status === "loading" && (
                        <span className="text-xs font-medium text-blue-600 animate-pulse flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                      {step.status === "completed" && (
                        <span className="text-xs font-medium text-green-600">
                          Done
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs leading-relaxed",
                        step.status === "completed" && "text-green-600",
                        step.status === "loading" && "text-blue-600",
                        step.status === "error" && "text-red-600",
                        step.status === "pending" && "text-gray-400"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Progress line */}
                {index < syncSteps.length - 1 && (
                  <div className="absolute left-3 top-8 w-0.5 h-4 bg-gray-200">
                    {(step.status === "completed" || 
                      (step.status === "loading" && syncSteps[index + 1]?.status !== "pending")) && (
                      <div className="w-full h-full bg-gradient-to-b from-blue-500 to-green-500 rounded-full" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
              <span className="font-medium">Syncing in progress...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "px-4 py-2",
        isBottom && "mt-auto border-t border-gray-700"
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent border-gray-700 text-white hover:bg-gray-800 hover:text-white"
            disabled={loading || loadingCompanyId !== null}
          >
            {loading ? (
              <span className="flex items-center">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                Loading...
              </span>
            ) : loadingCompanyId ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Switching...
              </span>
            ) : selectedCompany ? (
              <span className="flex items-center truncate">
                {selectedCompany}
              </span>
            ) : (
              "Select company..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search company..." />
            <CommandEmpty>No company found.</CommandEmpty>
            <div className="max-h-[300px] overflow-y-auto">
              {ownedCompanies.length > 0 && (
                <CommandGroup heading="Your companies">
                  {ownedCompanies.map((company: Company) => (
                    <CommandItem
                      key={company.id}
                      value={company.name}
                      onSelect={() => handleCompanyChange(company)}
                      className="flex items-center"
                      disabled={loadingCompanyId === company.id}
                    >
                      {loadingCompanyId === company.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCompany === company.name
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      )}
                      <span className="truncate">{company.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {sharedCompanies.length > 0 && (
                <CommandGroup heading="Shared with you">
                  {sharedCompanies.map((company: Company) => (
                    <CommandItem
                      key={company.id}
                      value={company.name}
                      onSelect={() => handleCompanyChange(company)}
                      className="flex items-center justify-between"
                      disabled={loadingCompanyId === company.id}
                    >
                      <div className="flex items-center">
                        {loadingCompanyId === company.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCompany === company.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        )}
                        <span className="truncate">{company.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0 h-5 flex items-center"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        {company.role || "Shared"}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </div>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateNewCompany}
                className="text-primary"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create new company
              </CommandItem>
              <CommandItem onSelect={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout from {user.name}
              </CommandItem>
              {selectedCompany && (
                <>
                  <CommandItem
                    onSelect={handleRemoveCompany}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out of company
                  </CommandItem>

                  {role === "admin" && (
                    <CommandItem
                      onSelect={() => router.push("/edit-firm")}
                      className="text-muted-foreground"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Edit company
                    </CommandItem>
                  )}
                </>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CompanySelector;