"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useGetGroupsQuery, useGetPartiesQuery } from "@/redux/api/partiesApi";
import {
    AlertCircle as AlertCircleIcon,
    Download as DownloadIcon,
    Mail as MailIcon,
    MapPin as MapPinIcon,
    Phone as PhoneIcon,
    Printer as PrinterIcon,
    RefreshCw as RefreshCwIcon,
    Search as SearchIcon,
    SlidersHorizontal as SlidersHorizontalIcon,
    Users as UsersIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { DownloadButton } from "../Xl";

const AllPartiesReport = () => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [gstType, setGstType] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch parties and groups
  const {
    data: parties,
    isLoading: isLoadingParties,
    isError: isPartiesError,
    refetch: refetchParties,
  } = useGetPartiesQuery({
    search: searchTerm || undefined,
    gstType: gstType || undefined,
    groupId: groupId || undefined,
  });

  const { data: groups, isLoading: isLoadingGroups } = useGetGroupsQuery();

  // Group map for lookup
  const groupMap =
    groups?.reduce((acc, group) => {
      acc[group.id] = group.groupName;
      return acc;
    }, {} as Record<string, string>) || {};
 useEffect(() => {
    // Immediately refetch data when component mounts
    refetchParties();

    // Set up interval for periodic refetching (every 5 seconds)
    const intervalId = setInterval(() => {
      refetchParties();
    }, 5000); // Adjust this time as needed

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetchParties]);
  // Handle printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "All Parties",
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 15mm 10mm;
      }
    `,

    onAfterPrint: () => console.log("Print completed"),
  });

  // Calculate stats
  const calculateStats = () => {
    if (!parties) return { total: 0, customers: 0, suppliers: 0, both: 0 };

    const stats = parties.reduce(
      (acc, party) => {
        // Calculate if party is a customer, supplier, or both based on opening balance type
        if (party.openingBalanceType === "to_receive") {
          acc.customers++;
        } else if (party.openingBalanceType === "to_pay") {
          acc.suppliers++;
        } else {
          // If no opening balance set, consider as both
          acc.both++;
        }

        return acc;
      },
      { total: parties.length, customers: 0, suppliers: 0, both: 0 }
    );

    return stats;
  };

  const stats = calculateStats();

  // Get the company name and phone from localStorage if available
  const companyName =
    typeof window !== "undefined"
      ? localStorage.getItem("firmName") || "My Company"
      : "My Company";
  const companyPhone =
    typeof window !== "undefined"
      ? localStorage.getItem("firmPhone") || "9752133459"
      : "9752133459";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Parties</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint()}
            className="flex items-center gap-1"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <DownloadButton buttonText='Export XlSX'  data={ parties|| []} fileName="all-party-report" />
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handlePrint()}
          >
            <DownloadIcon className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center">
            <SlidersHorizontalIcon className="h-4 w-4 mr-2 text-primary" />
            Filter Parties
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="searchTerm"
                  placeholder="Search by name, phone or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstType">GST Type</Label>
              <Select value={gstType} onValueChange={setGstType}>
                <SelectTrigger id="gstType">
                  <SelectValue placeholder="All GST Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">All GST Types</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Composition">Composition</SelectItem>
                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                  <SelectItem value="Consumer">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupId">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="groupId">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">All Groups</SelectItem>
                  {!isLoadingGroups &&
                    groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.groupName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => refetchParties()} className="gap-1">
              <RefreshCwIcon className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Parties</p>
            <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Customers</p>
            <h3 className="text-2xl font-bold mt-1 text-green-600">
              {stats.customers}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Suppliers</p>
            <h3 className="text-2xl font-bold mt-1 text-blue-600">
              {stats.suppliers}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Both/Others</p>
            <h3 className="text-2xl font-bold mt-1 text-amber-600">
              {stats.both}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Parties Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="pb-3 print:hidden">
          <CardTitle className="text-md flex items-center">
            <UsersIcon className="h-4 w-4 mr-2 text-primary" />
            Party List
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoadingParties ? (
            <div className="space-y-3 print:hidden">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isPartiesError ? (
            <Alert variant="destructive" className="print:hidden">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Failed to load parties. Please try again.
              </AlertDescription>
            </Alert>
          ) : parties?.length === 0 ? (
            <div className="text-center py-10 text-gray-500 print:hidden">
              <UsersIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No parties found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto print:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>GST Type</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Address</TableHead>

                    <TableHead className="text-right">Balance Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties?.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">
                        {party.name.length>20? party.name.slice(0, 20) + '...': party.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {party.phone && (
                            <div className="flex items-center text-xs">
                              <PhoneIcon className="h-3 w-3 mr-1 text-gray-400" />
                              {party.phone}
                            </div>
                          )}
                          {party.email && (
                            <div className="flex items-center text-xs">
                              <MailIcon className="h-3 w-3 mr-1 text-gray-400" />
                              {party.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5"
                        >
                          {party.gstType}
                        </Badge>
                        {party.gstNumber && (
                          <div className="text-xs mt-1 text-gray-500">
                            {party.gstNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {party.groupId ? groupMap[party.groupId] || "-" : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {party.billingAddress ? (
                            <div className="flex items-start">
                              <MapPinIcon className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                              <span className="text-xs">
                                {party.billingAddress.split("\n")[0]}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {party.currentBalance
                          ? `₹${party.currentBalance.toFixed(2)}`
                          : "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Printable content */}
          <div ref={printRef} className="hidden print:block">
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-sm">Phone no.: {companyPhone}</p>
              <h3 className="text-lg font-semibold mt-4 border-b-2 border-gray-300 pb-2">
                Party List
              </h3>
            </div>

            {/* Date */}
            <p className="mb-4">
              Generated on: {new Date().toLocaleDateString()}
            </p>

            {/* Party Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">NAME</th>
                  <th className="border border-gray-300 p-2 text-left">
                    PHONE
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    EMAIL
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    GST TYPE
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    GST NUMBER
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    GROUP
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    ADDRESS
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    BALANCE TYPE
                  </th>
                  <th className="border border-gray-300 p-2 text-left">
                    BALANCE AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {!isLoadingParties &&
                  !isPartiesError &&
                  parties?.map((party) => (
                    <tr key={party.id}>
                      <td className="border border-gray-300 p-2">
                        {party.name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.phone || "-"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.email || "-"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.gstType}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.gstNumber || "-"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.groupId ? groupMap[party.groupId] || "-" : "-"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.billingAddress || "-"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.openingBalanceType === "to_receive"
                          ? "Customer (To Receive)"
                          : party.openingBalanceType === "to_pay"
                          ? "Supplier (To Pay)"
                          : "No Balance"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {party.openingBalance
                          ? `₹${party.openingBalance.toFixed(2)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                {(!parties || parties.length === 0) && (
                  <tr>
                    <td
                      colSpan={9}
                      className="border border-gray-300 p-2 text-center"
                    >
                      No parties found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mt-6 border border-gray-300 p-4 bg-gray-50">
              <h3 className="text-md font-semibold mb-2">Summary</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p>
                    <strong>Total Parties:</strong> {stats.total}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Customers:</strong> {stats.customers}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Suppliers:</strong> {stats.suppliers}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Both/Others:</strong> {stats.both}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          td,
          th {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default AllPartiesReport;
