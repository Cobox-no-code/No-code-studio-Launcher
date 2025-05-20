'use client'
import { useState, useEffect, FormEvent, ChangeEvent, JSX } from 'react'
import { useRouter } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Building, Check, ChevronDown, ChevronsUpDown, Link as Link1, Search,ChevronsLeft } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { setCurrentFirm } from '@/lib/firm-utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { API_BASE_URL } from '@/redux/api/api.config'
import Link from 'next/link'
import { backend_url } from '@/backend.config'
// Type definitions
interface Country {
  code: string;
  name: string;
}

interface Firm {
  id: string;
  name: string;
  country?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiError {
  error?: string;
}

const FirmCreationScreen = (): JSX.Element => {
  const router = useRouter()
  const [firmName, setFirmName] = useState<string>('')
  const [country, setCountry] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [existingFirms, setExistingFirms] = useState<Firm[]>([])
  const [fetchingFirms, setFetchingFirms] = useState<boolean>(true)
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null)
  const [openFirmDropdown, setOpenFirmDropdown] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [countries, setCountries] = useState<Country[]>([
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'RU', name: 'Russia' },
    { code: 'MX', name: 'Mexico' }
  ])

  // Check if user already has a firm selected
  useEffect(() => {
    const firmId = localStorage.getItem('firmId')
    
    // If firm ID exists, redirect to dashboard
    if (firmId) {
      router.push('/')
    }
    
    // Fetch existing firms
    fetchFirms()
  }, [router])
  
  const fetchFirms = async (): Promise<void> => {
    try {
      setFetchingFirms(true)
      const response = await axios.get<Firm[]>(API_BASE_URL+'/firms')
      setExistingFirms(response.data)
    } catch (err) {
      console.error('Error fetching firms:', err)
      setError('Failed to load existing firms')
    } finally {
      setFetchingFirms(false)
    }
  }

  const handleCreateFirm = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (!firmName.trim()) {
      setError('Firm name is required')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const response = await axios.post<Firm>(API_BASE_URL+'/firms', {
        name: firmName,
        country,
        phone,
        cloudurl:backend_url
      })
        await axios.get(API_BASE_URL+`/initData`, {
          headers: { 'x-firm-id': response.data.id }
        })
        .then(() => {
          console.log('Default data initialized successfully')
        })
        .catch((error) => {
          console.error('Error initializing default data:', error)
        })
      // Use utility function to set firm data and trigger events
      setCurrentFirm(response.data.id, response.data.name, country)
      
      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      console.error('Error creating firm:', err)
      const axiosError = err as AxiosError<ApiError>
      setError(axiosError.response?.data?.error || 'Failed to create firm')
    } finally {
      setLoading(false)
    }
  }
  
  const selectFirm = (firmId: string, firmName: string, country: string | null = null): void => {
    // Use utility function to set firm data and trigger events
    setCurrentFirm(firmId, firmName, country)
    router.push('/')
  }

  const getCountryName = (code: string | null | undefined): string => {
    if (!code) return '';
    const country = countries.find(c => c.code === code);
    return country ? country.name : code;
  }

  const filteredFirms = searchTerm 
    ? existingFirms.filter(firm => 
        firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (firm.country && getCountryName(firm.country).toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : existingFirms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 max-w-6xl mx-auto">
          {/* Left side - Logo and description */}
          <div className="w-full md:w-2/5 text-white space-y-6 mb-8 md:mb-0">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 mr-4 relative">
                <img
                  src="http://34.228.195.218/static/images/logo.png"
                  alt="Paper Bill Logo"
                  width={64}
                  height={64}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <h1 className="text-4xl font-bold">Paper Bill</h1>
            </div>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              The complete billing solution for modern businesses
            </p>
            
            <div className="space-y-4 mt-8">
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Simplified Invoicing</h3>
                  <p className="text-gray-400">Create professional invoices in seconds</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Inventory Management</h3>
                  <p className="text-gray-400">Track stock levels and manage products</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Financial Reports</h3>
                  <p className="text-gray-400">Gain insights with detailed analytics</p>
                </div>
              </div>
            </div>

           <Link href='/'> <Button className=' bg-white text-black hover:bg-white cursor-pointer'>
            <ChevronsLeft/>
            Back</Button></Link>
          </div>
          
          {/* Right side - Form */}
          <div className="w-full md:w-3/5 max-w-md">
            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Get Started</CardTitle>
                <CardDescription>Create a new firm or select an existing one</CardDescription>
              </CardHeader>
              
              {error && (
                <CardContent className="pb-0">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </CardContent>
              )}
              
              {/* Existing Firms Dropdown */}
              {existingFirms.length > 0 && (
                <CardContent className="border-b pb-6">
                  <Label className="block mb-2 text-sm font-medium">Select Existing Firm</Label>
                  <Popover open={openFirmDropdown} onOpenChange={setOpenFirmDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openFirmDropdown}
                        className="w-full justify-between"
                      >
                        {selectedFirm
                          ? selectedFirm.name
                          : "Select a firm..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search firms..." 
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>No firms found.</CommandEmpty>
                          <CommandGroup>
                            {fetchingFirms ? (
                              <div className="p-2 space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                              </div>
                            ) : (
                              filteredFirms.map((firm) => (
                                <CommandItem
                                  key={firm.id}
                                  value={firm.id}
                                  onSelect={() => {
                                    setSelectedFirm(firm);
                                    setOpenFirmDropdown(false);
                                    selectFirm(firm.id, firm.name, firm.country || null);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedFirm?.id === firm.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{firm.name}</span>
                                    {firm.country && (
                                      <span className="text-xs text-gray-500">{getCountryName(firm.country)}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              )}
              
              <CardContent>
                <div className="relative flex items-center justify-center mb-4">
                  <div className="absolute border-t border-gray-200 w-full"></div>
                  <span className="relative px-4 bg-white text-sm text-gray-500">Or create a new firm</span>
                </div>
                
                <form onSubmit={handleCreateFirm}>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firm-name">Firm Name</Label>
                      <Input 
                        id="firm-name"
                        placeholder="Enter firm name" 
                        value={firmName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFirmName(e.target.value)}
                        required
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={country}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
                        required
                      >
                        <option value="">Select a country</option>
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                       <div className="space-y-2">
                      <Label htmlFor="phone">Address (Optional)</Label>
                      <Input 
                        id="address"
                        placeholder="Enter Address " 
                        value={address}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input 
                        id="phone"
                        placeholder="Enter phone number" 
                        value={phone}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2"
                    >
                      {loading ? 'Creating...' : 'Create New Firm'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FirmCreationScreen