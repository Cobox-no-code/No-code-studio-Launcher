"use client";

import { useState, useEffect, FormEvent, ChangeEvent, JSX } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Camera, Upload, X, Building2, FileText, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/redux/api/api.config";
i;
import { backend_url } from "@/backend.config";
import { useAppSelector } from "@/redux/hooks";

// Type definitions
interface Country {
  code: string;
  name: string;
}

export default function EditFirmPage(): JSX.Element {
  const router = useRouter();
  const userinfo = useAppSelector((state) => state.userinfo);
  const firmId =
    typeof window !== "undefined" ? localStorage.getItem("firmId") : null;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gstNumber: "",
    ownerName: "",
    businessName: "",
    businessLogo: "",
    address: "",
    customFields: [] as { key: string; value: string }[],
  });
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
  const [country, setCountry] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    setLoading(true);
    if (firmId) {
      axios
        .get(`${API_BASE_URL}/firms/${firmId}`)
        .then((res) => {
          const data = res.data;
          // Convert customFields from object to array format
          const customFieldsArray = Array.isArray(data.customFields)
            ? data.customFields
            : data.customFields && typeof data.customFields === "object"
            ? Object.entries(data.customFields).map(([key, value]) => ({
                key,
                value: String(value),
              }))
            : [];

          setFormData({
            ...data,
            customFields: customFieldsArray,
          });

          if (data.businessLogo) {
            setLogoPreview(data.businessLogo);
          }
          setCountry(data.country);
        })
        .catch(() => setError("Failed to load firm data"))
        .finally(() => setLoading(false));
    }
  }, [firmId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (max 300KB to avoid payload size issues)
    if (file.size > 300 * 1024) {
      setError("Logo image must be less than 300KB");
      return;
    }

    // File type validation
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
      setError("Logo must be JPG, PNG, or SVG format");
      return;
    }

    try {
      // Create preview for the UI
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);

        // For the actual API payload, we'll compress or resize if needed
        // Here we're using a smaller version for the API call
        compressImage(file).then((compressedBase64) => {
          setFormData((prev) => ({ ...prev, businessLogo: compressedBase64 }));
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError("Failed to process the image");
      console.error("Image processing error:", error);
    }
  };

  // Function to compress/resize image before sending to API
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;

        img.onload = () => {
          // Calculate new dimensions (max width/height of 200px)
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          // Create canvas and resize
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          // Draw resized image
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Could not get canvas context"));

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with reduced quality
          const quality = file.type === "image/jpeg" ? 0.7 : 0.8;
          const compressedBase64 = canvas.toDataURL(file.type, quality);

          resolve(compressedBase64);
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, businessLogo: "" }));
  };

  const addCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { key: "", value: "" }],
    }));
  };

  const removeCustomField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const handleCustomFieldChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updatedFields = [...formData.customFields];
    updatedFields[index][field] = value;
    setFormData((prev) => ({ ...prev, customFields: updatedFields }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firmId) return;

    setLoading(true);
    setError("");

    try {
      // Filter out empty custom fields before submitting
      const filteredCustomFields = formData.customFields.filter(
        (field) => field.key.trim() !== "" && field.value.trim() !== ""
      );

      // Convert custom fields back to object format for API
      const customFieldsObject = filteredCustomFields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {} as Record<string, string>);

      const submitData = {
        ...formData,
        country,
        customFields: customFieldsObject,
      };

      await axios.put(`${API_BASE_URL}/firms/${firmId}`, submitData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!firmId) return;
    const owner = userinfo.phone;
    setLoading(true);

    try {
      await axios.delete(
        `${API_BASE_URL}/firms/${firmId}?cloudurl=${encodeURIComponent(
          backend_url
        )}&owner=${owner}`
      );

      localStorage.removeItem("firmId");

      router.push("/firm");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed");
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Using form element to wrap everything for better semantics
  return (
    <div className="w-full p-8 bg-white flex-grow flex flex-col h-full">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Edit Firm Profile</h1>
        <p className="text-gray-500 mb-4">
          Update your business information and settings
        </p>

        <div className="mb-4">
          <div className="inline-flex rounded-md border pb-0 text-sm">
            <button
              className={`px-4 py-2 rounded-l-md ${
                activeTab === "general" ? "bg-gray-100" : "bg-white"
              }`}
              onClick={() => handleTabChange("general")}
            >
              General Information
            </button>
            <button
              className={`px-4 py-2 rounded-r-md ${
                activeTab === "branding" ? "bg-gray-100" : "bg-white"
              }`}
              onClick={() => handleTabChange("branding")}
            >
              Branding
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your firm profile has been updated successfully
              </AlertDescription>
            </Alert>
          )}

          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter firm name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
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
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter Address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="Enter GST number (if applicable)"
                />
              </div>

              <div className="col-span-2">
                <Label className="block mb-2">Additional Fields</Label>

                {formData?.customFields?.length > 0 &&
                  formData.customFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input
                        placeholder="Key"
                        value={field.key}
                        onChange={(e) =>
                          handleCustomFieldChange(index, "key", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) =>
                          handleCustomFieldChange(
                            index,
                            "value",
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                        className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={addCustomField}
                >
                  + Add Field
                </Button>
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-4 mb-6">
              <div>
                <Label className="flex items-center mb-2">
                  <Camera className="h-4 w-4 mr-2" />
                  Business Logo
                </Label>

                <div className="flex items-start gap-6">
                  <div className="border border-gray-200 rounded-lg h-40 w-40 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Business Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <Building2 className="h-10 w-10 mb-2" />
                        <span className="text-xs text-center px-2">
                          No logo uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your business logo to be displayed on invoices and
                      other documents.
                    </p>

                    <div>
                      <Label
                        htmlFor="logo-upload"
                        className="bg-black text-white px-4 py-2 rounded-md inline-flex items-center cursor-pointer hover:bg-gray-800 transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        Supported formats: JPG, PNG, SVG. Max size: 300KB
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  type="button"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Firm
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Are you sure you want to delete this firm?
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your firm and all associated data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Delete Firm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              type="submit"
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
