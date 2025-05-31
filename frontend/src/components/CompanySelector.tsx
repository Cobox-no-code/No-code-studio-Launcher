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
import { API_BASE_URL } from "@/redux/api/api.config";
import { backend_url } from "@/backend.config";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Badge } from "@/components/ui/badge";
import { setCurrentFirm, updateRole } from "@/redux/slices/firmSlice";
import { setUserInfo } from "@/redux/slices/userinfoSlice";
import { syncAllToCloud, syncAllToLocal } from "@/lib/sync-cloud";
import toast from "react-hot-toast";
import {
  useGetPurchaseInvoicesQuery,
  useGetSaleInvoicesQuery,
} from "@/redux/api/documentApi";
import { useGetItemsQuery } from "@/redux/api/itemsApi";
import { useGetBankAccountsQuery } from "@/redux/api/bankingApi";

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
  const [open, setOpen] = useState<boolean>(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullPageLoading, setIsFullPageLoading] = useState<boolean>(false);
  const [syncSteps, setSyncSteps] = useState<SyncStep[]>([]);
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

  useEffect(() => {
    // Get current company from localStorage
    const firmName = localStorage.getItem("firmName");
    if (firmName) {
      setSelectedCompany(firmName);
    }

    // Fetch all companies
    if (user.phone) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<Company[]>(
        `${API_BASE_URL}/firms?phone=${user.phone}`
      );
      const ownedCompanies = response.data || [];
      try {
        // Fetch shared firms
        const responseSharedFirm = await axios.get(
          `${backend_url}/get-shared-firms?phone=${user.phone}`
        );
        const sharedFirms = responseSharedFirm.data.shared_firms || [];

        // Add isShared flag to shared firms
        const formattedSharedFirms = sharedFirms.map((firm: any) => ({
          id: firm.firm_id,
          name: firm.firm_name,
          isShared: true,
          role: firm.role,
        }));

        // Combine owned and shared companies
        const allCompanies = [...ownedCompanies, ...formattedSharedFirms];

        setCompanies(allCompanies);
      } catch (e) {}
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const performSteppedSync = async (company: any) => {
    const owner = user.phone;

    try {
      const result = await syncAllToLocal(backend_url, company.id, owner);

      if (result.status === "completed") {
        // Step 1: Company Data
        updateSyncStep("company-data", "loading");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing time
        updateSyncStep(
          "company-data",
          "completed",
          "Company data loaded successfully"
        );

        // Step 2: Items Data
        updateSyncStep("items-data", "loading");
        try {
          await refetchItems();
          updateSyncStep(
            "items-data",
            "completed",
            `${items.length} items synced`
          );
        } catch (error) {
          updateSyncStep("items-data", "error", "Failed to sync items");
          throw error;
        }

        // Step 3: Sales Data
        updateSyncStep("sales-data", "loading");
        try {
          await refetchSales();
          updateSyncStep(
            "sales-data",
            "completed",
            `${salesInvoices.length} sales records synced`
          );
        } catch (error) {
          updateSyncStep("sales-data", "error", "Failed to sync sales data");
          throw error;
        }

        // Step 4: Purchase Data
        updateSyncStep("purchase-data", "loading");
        try {
          await refetchPurchase();
          updateSyncStep(
            "purchase-data",
            "completed",
            `${purchaseInvoices.length} purchase records synced`
          );
        } catch (error) {
          updateSyncStep(
            "purchase-data",
            "error",
            "Failed to sync purchase data"
          );
          throw error;
        }

        // Step 5: Bank Data
        updateSyncStep("bank-data", "loading");
        try {
          await refetchBank();
          updateSyncStep(
            "bank-data",
            "completed",
            `${bankAccounts.length} bank accounts synced`
          );
        } catch (error) {
          updateSyncStep("bank-data", "error", "Failed to sync bank data");
          throw error;
        }
      }
      // Step 6: Finalize
      updateSyncStep("finalize", "loading");

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Finalization delay
      updateSyncStep("finalize", "completed", "Sync completed successfully");

      // Small delay before redirect
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success(`Successfully switched to ${company.name}`);
      router.push("/");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync data. Please try again.");
      setIsFullPageLoading(false);
    }
  };

  const handleCompanyChange = async (company: any) => {
    // Initialize full page loading
    setIsFullPageLoading(true);
    setSyncSteps(initializeSyncSteps());

    dispatch(setCurrentFirm(company));
    setSelectedCompany(company.name);
    setOpen(false);

    if (company.isShared) {
      dispatch(updateRole(company.role));
      try {
        // Perform stepped sync
        await performSteppedSync(company);
      } catch (e) {
        console.error("Failed to toggle sync:", e);
      }
    }
  };

  const handleRemoveCompany = (): void => {
    clearCurrentFirm();
    router.push("/firm");
    setSelectedCompany("");
    setOpen(false);
  };

  const handleCreateNewCompany = (): void => {
    clearCurrentFirm();
    router.push("/firm");
  };

  // Group companies by type (owned vs shared)
  const ownedCompanies = companies.filter((company) => !company.isShared);
  const sharedCompanies = companies.filter((company) => company.isShared);

  // Full page loading overlay
  if (isFullPageLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Switching Company
            </h2>
            <p className="text-gray-600 text-sm">
              Please wait while we sync your data...
            </p>
          </div>

          <div className="space-y-4">
            {syncSteps.map((step) => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {step.status === "pending" && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  {step.status === "loading" && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {step.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {step.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        step.status === "completed" && "text-green-700",
                        step.status === "loading" && "text-blue-700",
                        step.status === "error" && "text-red-700",
                        step.status === "pending" && "text-gray-500"
                      )}
                    >
                      {step.label}
                    </span>
                    {step.status === "loading" && (
                      <span className="text-xs text-blue-600 animate-pulse">
                        Processing...
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs mt-1",
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
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>This may take a few moments...</span>
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
          >
            {loading ? (
              <span className="flex items-center">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                Loading...
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
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCompany === company.name
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
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
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCompany === company.name
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
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

              {selectedCompany && (
                <>
                  <CommandItem
                    onSelect={handleRemoveCompany}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out of company
                  </CommandItem>

                  <CommandItem
                    onSelect={() => router.push("/edit-firm")}
                    className="text-muted-foreground"
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Edit company
                  </CommandItem>
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
