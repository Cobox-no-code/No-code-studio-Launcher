'use client'
import { useState, useEffect, JSX } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Check, ChevronsUpDown, Building, PlusCircle, LogOut } from 'lucide-react'
import { setCurrentFirm, clearCurrentFirm } from '@/lib/firm-utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { API_BASE_URL } from '@/redux/api/api.config'

// Type definitions
interface Company {
  id: string;
  name: string;
  country?: string | null;
  phone?: string | null;
}

interface CompanySelectorProps {
  isBottom?: boolean;
}

const CompanySelector = ({ isBottom = false }: CompanySelectorProps): JSX.Element => {
  const router = useRouter()
  const [open, setOpen] = useState<boolean>(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Get current company from localStorage
    const firmName = localStorage.getItem('firmName')
    if (firmName) {
      setSelectedCompany(firmName)
    }
    
    // Fetch all companies
    fetchCompanies()
  }, [])

  const fetchCompanies = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await axios.get<Company[]>(API_BASE_URL+'/firms')
      setCompanies(response.data)
    } catch (err) {
      console.error('Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (companyId: string, companyName: string, country: string | null = null): void => {
    // Use the utility function to update firm data and trigger events
    setCurrentFirm(companyId, companyName, country)
    
    // Update selected company state
    setSelectedCompany(companyName)
    
    // Close the popover
    setOpen(false)
    
  }

  const handleRemoveCompany = (): void => {
    // Use the utility function to clear firm data and trigger events
    clearCurrentFirm()
    router.push('/firm')
    // Reset selected company
    setSelectedCompany('')
    
    // Close the popover
    setOpen(false)
    

  }

  const handleCreateNewCompany = (): void => {
    // Clear current firm and redirect to creation page
    clearCurrentFirm()
    router.push('/firm')

  }

  return (
    <div className={cn(
      "px-4 py-2", 
      isBottom && "mt-auto border-t border-gray-700"
    )}>
     
      
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
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandInput placeholder="Search company..." />
            <CommandEmpty>No company found.</CommandEmpty>
            <CommandGroup heading="Your companies">
              {companies.map((company: Company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => handleCompanyChange(company.id, company.name, company.country || null)}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCompany === company.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{company.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
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
        onSelect={() => router.push('/edit-firm')}
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
  )
}

export default CompanySelector