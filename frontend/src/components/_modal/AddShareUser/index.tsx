"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

import axios from "axios";
import { backend_url, cloud_url } from "@/backend.config";
import { Loader2, User, UserCog, Eye } from "lucide-react";

type Role =
  | "secondary_admin"
  | "salesman"
  | "biller"
  | "biller_salesman"
  | "ca_accountant"
  | "stock_keeper"
  | "ca_account_edit";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onShareSuccess: () => void;
}

const AddUserModal = ({ open, onClose, onShareSuccess }: AddUserModalProps) => {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("biller");
  const [loading, setLoading] = useState(false);

  // Available roles with descriptions
  const roles = [
    {
      value: "secondary_admin" as Role,
      label: "Secondary Admin",
      description: "Near-full access with administrative capabilities",
      icon: <UserCog className="h-4 w-4" />,
    },
    {
      value: "salesman" as Role,
      label: "Salesman",
      description:
        "Can manage sales orders, quotations, and customer interactions",
      icon: <User className="h-4 w-4" />,
    },
    {
      value: "biller" as Role,
      label: "Biller",
      description: "Can create and manage invoices and billing operations",
      icon: <Eye className="h-4 w-4" />,
    },
    {
      value: "biller_salesman" as Role,
      label: "Biller and Salesman",
      description: "Combined access to both billing and sales operations",
      icon: <User className="h-4 w-4" />,
    },
    {
      value: "ca_accountant" as Role,
      label: "CA/Accountant",
      description: "Access to accounting, financial reports, and compliance",
      icon: <UserCog className="h-4 w-4" />,
    },
    {
      value: "stock_keeper" as Role,
      label: "Stock Keeper",
      description: "Manage inventory, stock levels, and warehouse operations",
      icon: <Eye className="h-4 w-4" />,
    },
    {
      value: "ca_account_edit" as Role,
      label: "CA/Account (Edit Access)",
      description: "Full accounting access with editing capabilities",
      icon: <UserCog className="h-4 w-4" />,
    },
  ];

  const handleShare = async () => {
    const firmId = localStorage.getItem("firmId");
    if (!phone || !role || !firmId) {
      toast.error("Phone and role are required");
      return;
    }

    // Basic phone validation
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${cloud_url}/firm-share`, {
        user_number:phone,
        firm_id: firmId,
        role,
      });

      if (res.data.id) {
        toast.success("Firm shared successfully");
        setPhone("");
        setRole("biller");
        onShareSuccess();
        onClose();
      } else {
        toast.error(res.data.error || "Failed to share firm");
      }
    } catch (err: any) {
      console.error("Error sharing firm:", err);
      toast.error(err?.response?.data?.error || "Error sharing firm");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPhone("");
      setRole("biller");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add User to Firm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number (10 digits)"
              value={phone}
              onChange={(e) => {
                // Only allow digits and limit to 10
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(value);
              }}
              maxLength={10}
              disabled={loading}
            />
            {phone && phone.length < 10 && (
              <p className="text-xs text-gray-500">
                {10 - phone.length} more digits required
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select User Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              className="grid gap-3 grid-cols-2"
              disabled={loading}
            >
              {roles.map((roleOption) => (
                <div
                  key={roleOption.value}
                  className="flex items-center space-x-3 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <RadioGroupItem
                    value={roleOption.value}
                    id={roleOption.value}
                    disabled={loading}
                  />
                  <Label
                    htmlFor={roleOption.value}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {roleOption.icon}
                      <span className="font-medium">{roleOption.label}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {roleOption.description}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={loading || phone.length !== 10}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add User"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
