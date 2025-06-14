"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    Check,
    ChevronsLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, JSX, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { useApiUrl } from "@/hooks/useApiUrl";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
    createFirm,
    setCurrentFirm
} from "@/redux/slices/firmSlice";
import Link from "next/link";
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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { firms, currentFirm, loading, error } = useAppSelector(
    (state) => state.firm
  );
const apiUrl = useApiUrl()
  const userinfo = useAppSelector((state) => state.userinfo);
  const [firmName, setFirmName] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [phone, setPhone] = useState<string>(userinfo.phone);
  const [address, setAddress] = useState<string>("");

  const [countries, setCountries] = useState<Country[]>([
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "IN", name: "India" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
    { code: "BR", name: "Brazil" },
    { code: "ZA", name: "South Africa" },
    { code: "SG", name: "Singapore" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "NZ", name: "New Zealand" },
    { code: "RU", name: "Russia" },
    { code: "MX", name: "Mexico" },
  ]);

  const handleCreateFirm = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const owner = userinfo.phone;
    const res = await dispatch(
      createFirm({
        name: firmName,
        country,
        phone,
        apiUrl: apiUrl,
        address,
        owner,
        ownerName: userinfo.name,
      })
    ).unwrap();

    console.log(res);
    dispatch(setCurrentFirm({ id: res.id, name: firmName, country, phone }));
    router.push("/");
  };

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
                  <p className="text-gray-400">
                    Create professional invoices in seconds
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Inventory Management</h3>
                  <p className="text-gray-400">
                    Track stock levels and manage products
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Financial Reports</h3>
                  <p className="text-gray-400">
                    Gain insights with detailed analytics
                  </p>
                </div>
              </div>
            </div>

            <Link href="/">
              {" "}
              <Button className=" bg-white text-black hover:bg-white cursor-pointer">
                <ChevronsLeft />
                Back
              </Button>
            </Link>
          </div>

          {/* Right side - Form */}
          <div className="w-full md:w-3/5 max-w-md">
            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Get Started</CardTitle>
                <CardDescription>
                  Create a new firm or select an existing one
                </CardDescription>
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

              <CardContent>
                <form onSubmit={handleCreateFirm}>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firm-name">Firm Name</Label>
                      <Input
                        id="firm-name"
                        placeholder="Enter firm name"
                        value={firmName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFirmName(e.target.value)
                        }
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
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          setCountry(e.target.value)
                        }
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
                      <Label htmlFor="phone">Phone </Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={phone}
                        required
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setPhone(e.target.value)
                        }
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Address (Optional)</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter Address "
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2"
                    >
                      {loading ? "Creating..." : "Create New Firm"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirmCreationScreen;
