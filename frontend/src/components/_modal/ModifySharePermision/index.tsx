// ManagePermissionModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Role = 'admin' | 'editor' | 'viewer';

interface ManagePermissionModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    name: string;
    phone: string;
    role: Role;
  } | null;
  onUpdateRole: (phone: string, role: Role) => Promise<void>;
}

const ManagePermissionModal: React.FC<ManagePermissionModalProps> = ({
  open,
  onClose,
  user,
  onUpdateRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(user?.role || 'viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Permissions</DialogTitle>
          <DialogDescription>
            Update access permissions for {user?.name || "user"} ({user?.phone || ""})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as Role)}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="admin" id="admin" />
              <Label htmlFor="admin" className="flex-1 cursor-pointer">
                <div className="font-medium">Admin</div>
                <div className="text-sm text-gray-500">Full access to everything, including sharing with others</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="editor" id="editor" />
              <Label htmlFor="editor" className="flex-1 cursor-pointer">
                <div className="font-medium">Editor</div>
                <div className="text-sm text-gray-500">Can add, edit, and delete content, but cannot manage users</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="viewer" id="viewer" />
              <Label htmlFor="viewer" className="flex-1 cursor-pointer">
                <div className="font-medium">Viewer</div>
                <div className="text-sm text-gray-500">Read-only access, cannot make changes</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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