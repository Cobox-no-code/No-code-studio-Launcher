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
import { syncAllToCloud } from "@/lib/sync-cloud";
import toast from "react-hot-toast";

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

const CompanySelector = ({
  isBottom = false,
}: CompanySelectorProps): JSX.Element => {
  const router = useRouter();
  const user = useAppSelector((state) => state.userinfo);
  const [open, setOpen] = useState<boolean>(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useAppDispatch();
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
      const response = await axios.get<Company[]>(API_BASE_URL + "/firms");
      const ownedCompanies = response.data || [];

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
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (company: any) => {
    // Use the utility function to update firm data and trigger events
    const firmId = localStorage.getItem("firmId");
    dispatch(setCurrentFirm(company));
    // Update selected company state
    setSelectedCompany(company.name);

    // Close the popover
    setOpen(false);
    if (company.isShared && !user.sync_enabled) {
      dispatch(updateRole(company.role));
      try {
        const payload = {
          phone: user.phone,
          sync_enabled: !user.sync_enabled,
        };

        const response = await axios.post(
          `${backend_url}/toggle-sync/`,
          payload
        );

        if (response.data.status === "success") {
          dispatch(setUserInfo({ ...user, sync_enabled: !user.sync_enabled }));
          const result = await syncAllToCloud(backend_url, firmId);

          toast.success(
            `Sync ${!user.sync_enabled ? "enabled" : "disabled"} successfully`
          );
        } else {
          toast.error(response.data.message || "Failed to toggle sync");
        }
      } catch (e) {}
    }
    router.push("/");
  };

  const handleRemoveCompany = (): void => {
    // Use the utility function to clear firm data and trigger events
    clearCurrentFirm();
    router.push("/firm");
    // Reset selected company
    setSelectedCompany("");

    // Close the popover
    setOpen(false);
  };

  const handleCreateNewCompany = (): void => {
    // Clear current firm and redirect to creation page
    clearCurrentFirm();
    router.push("/firm");
  };

  // Group companies by type (owned vs shared)
  const ownedCompanies = companies.filter((company) => !company.isShared);
  const sharedCompanies = companies.filter((company) => company.isShared);

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
