// ManagePermissionModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  UserCog,
  User,
  Eye,
  Package,
  Calculator,
  Users,
} from "lucide-react";

type Role =
  | "secondary_admin"
  | "salesman"
  | "biller"
  | "biller_salesman"
  | "ca_accountant"
  | "stock_keeper"
  | "ca_account_edit";

interface ManagePermissionModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    name: string;
    phone: string;
    role: Role;
  } | null;
  onUpdateRole: (phone: string, role: any) => Promise<void>;
}

const ManagePermissionModal: React.FC<ManagePermissionModalProps> = ({
  open,
  onClose,
  user,
  onUpdateRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(
    user?.role || "biller"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available roles with descriptions and icons
  const roles = [
    {
      value: "secondary_admin" as Role,
      label: "Secondary Admin",
      description: "Near-full access with administrative capabilities",
      icon: <UserCog className="h-4 w-4 text-blue-600" />,
    },
    {
      value: "salesman" as Role,
      label: "Salesman",
      description:
        "Can manage sales orders, quotations, and customer interactions",
      icon: <Users className="h-4 w-4 text-green-600" />,
    },
    {
      value: "biller" as Role,
      label: "Biller",
      description: "Can create and manage invoices and billing operations",
      icon: <Eye className="h-4 w-4 text-purple-600" />,
    },
    {
      value: "biller_salesman" as Role,
      label: "Biller and Salesman",
      description: "Combined access to both billing and sales operations",
      icon: <User className="h-4 w-4 text-orange-600" />,
    },
    {
      value: "ca_accountant" as Role,
      label: "CA/Accountant",
      description: "Access to accounting, financial reports, and compliance",
      icon: <Calculator className="h-4 w-4 text-indigo-600" />,
    },
    {
      value: "stock_keeper" as Role,
      label: "Stock Keeper",
      description: "Manage inventory, stock levels, and warehouse operations",
      icon: <Package className="h-4 w-4 text-yellow-600" />,
    },
    {
      value: "ca_account_edit" as Role,
      label: "CA/Account (Edit Access)",
      description: "Full accounting access with editing capabilities",
      icon: <Calculator className="h-4 w-4 text-red-600" />,
    },
  ];

  // Reset selected role when user changes
  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await onUpdateRole(user.phone, selectedRole);
      onClose();
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (roleValue: Role) => {
    const roleColorMap = {
      secondary_admin: "bg-blue-100 text-blue-800",
      salesman: "bg-green-100 text-green-800",
      biller: "bg-purple-100 text-purple-800",
      biller_salesman: "bg-orange-100 text-orange-800",
      ca_accountant: "bg-indigo-100 text-indigo-800",
      stock_keeper: "bg-yellow-100 text-yellow-800",
      ca_account_edit: "bg-red-100 text-red-800",
    };
    return roleColorMap[roleValue] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage User Permissions</DialogTitle>
          <DialogDescription>
            Update access permissions for {user?.name || "user"} (
            {user?.phone || ""})
          </DialogDescription>
          {user && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getRoleBadgeColor(
                  user.role
                )} rounded-full`}
              >
                Current:{" "}
                {roles.find((r) => r.value === user.role)?.label || user.role}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as Role)}
            className="grid gap-3 grid-cols-2"
          >
            {roles.map((role) => (
              <div
                key={role.value}
                className="flex items-center space-x-3 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <RadioGroupItem value={role.value} id={role.value} />
                <Label htmlFor={role.value} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    {role.icon}
                    <span className="font-medium">{role.label}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {role.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedRole === user?.role}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePermissionModal;
