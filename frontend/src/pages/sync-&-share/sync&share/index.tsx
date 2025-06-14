"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

import { cloud_url } from "@/backend.config";
import AddUserModal from "@/components/_modal/AddShareUser";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import axios from "axios";
import {
    CheckCircle,
    EllipsisVertical,
    Plus,
    RefreshCcw,
    User,
    UserCog,
    UserMinus
} from "lucide-react";
import React, { useEffect, useState } from "react";
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel: string;
  isLoading?: boolean;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  title,
  description,
  actionLabel,
  isLoading = false,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              actionLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import ManagePermissionModal from "@/components/_modal/ModifySharePermision";
import PermissionsDialog from "@/components/PermissionTable";
import SyncToggle from "@/components/Toogle";
import { useApiUrl } from "@/hooks/useApiUrl";
import { toast } from "react-hot-toast";

type Role = "admin" | "editor" | "viewer";

interface SyncedUser {
  user_number: string;
  role: any;
  id: string;
}

const SyncShare = () => {
  const dispatch = useAppDispatch();
  const apiUrl = useApiUrl();
  const userInfo = useAppSelector((state) => state.userinfo);
  const [sync_enabled, setSyncEnabled] = useState(false);
  const { isEnabled ,isLoading} = useAppSelector((state) => state.sync);
  const [syncedUsers, setSyncedUsers] = useState<SyncedUser[]>([]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [firmData, setFirmData] = useState<any>(null);
  const [isCurrentUserAdmin, setCurrentUserAdmin] = useState(false);
  const [openPermissionTable, setOpenPermissionTable] = useState(false);
  // Permission management modal state
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SyncedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  // Confirm removal modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<SyncedUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);


  useEffect(() => {
    if (isEnabled) {
      fetchSyncedUsers();
    }
  }, [isEnabled]);

  const fetchSyncedUsers = async () => {
    if (!isEnabled) {
      return;
    }
    const firm_id = localStorage.getItem("firmId");
    try {
    
      const response = await axios.get(`${cloud_url}/firm/${firm_id}/shares`);
      console.log(response.data);
      setSyncedUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching synced users:", error);
      toast.error("Failed to load synced users");
    } finally {

    }
  };

  const handleRefreshSync = async () => {
    try {
  
      await fetchSyncedUsers();
      toast.success("Sync data refreshed");
    } catch (error) {
      console.error("Error refreshing sync data:", error);
      toast.error("Failed to refresh sync data");
    } finally {
    
    }
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleManagePermissions = (user: SyncedUser) => {
    setSelectedUser(user);
    setPermissionModalOpen(true);
  };

  const handleUpdateRole = async (id: string, role: Role) => {
    const firmId = localStorage.getItem("firmId");
    if (!id || !role || !firmId) {
      toast.error("Missing required information");
      return;
    }

    try {
      const res = await axios.put(`${cloud_url}/firm-share/${id}`, {
        role,
      });

      if (res.data) {
        toast.success("Permissions updated successfully");
        await fetchSyncedUsers();
      } else {
        toast.error(res.data.error || "Failed to update permissions");
      }
    } catch (err: any) {
      console.error("Error updating permissions:", err);
      toast.error(err?.response?.data?.error || "Error updating permissions");
    }
  };

  const openRemoveConfirmation = (user: SyncedUser) => {
    setUserToRemove(user);
    setConfirmModalOpen(true);
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    const firmId = localStorage.getItem("firmId");
    if (!firmId) {
      toast.error("Firm ID not found");
      return;
    }

    try {
      setIsRemoving(true);
      const res = await axios.delete(
        `${cloud_url}/firm-share/${userToRemove.id}`,
        {}
      );

      if (res.data) {
        toast.success("User removed successfully");
        await fetchSyncedUsers();
        setConfirmModalOpen(false);
      } else {
        toast.error(res.data.error || "Failed to remove user");
      }
    } catch (err: any) {
      console.error("Error removing user:", err);
      toast.error(err?.response?.data?.error || "Error removing user");
    } finally {
      setIsRemoving(false);
    }
  };

  // Determine if current user is an admin (to show/hide certain controls)
  useEffect(() => {
    if (userInfo) {
      const firmPhone = localStorage.getItem("firmPhone");
      setCurrentUserAdmin(firmPhone == userInfo.phone);
    }
  }, [userInfo]);

  // Get role badge color
  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "editor":
        return "bg-green-100 text-green-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-slate-50 h-full">
      <div className="flex items-center justify-between py-4 border-b bg-white px-4">
        <div className="flex items-center gap-4">
          <p className="font-semibold text-xl">Sync & Share</p>
          {isEnabled && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              <CheckCircle className="h-3 w-3 mr-1 text-gray-700" />
              Sync Enabled
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isEnabled && isCurrentUserAdmin && (
            <Button
              className="p-1 hover:bg-gray-200 rounded-full"
              variant={"outline"}
              onClick={handleAddUser}
            >
              <Plus className="mr-1" /> Add User
            </Button>
          )}
        </div>
      </div>
      <section className="flex flex-col gap-1 p-1 h-full">
        <div className="flex items-center justify-between py-4 border-b bg-white px-4 rounded-xl">
          <div>
            <p className="font-normal text-sm text-gray-400">
              Currently logged in with the following number:
            </p>
            <p className="font-semibold text-md flex items-center gap-2">
              {userInfo.phone || "Not available"}
              <Button
                variant={"secondary"}
                className="bg-gray-100 rounded-full size-5"
                onClick={handleRefreshSync}
                disabled={isLoading}
              >
                <RefreshCcw className="text-gray-700" size={12} />
              </Button>
            </p>
            <div className="flex items-center gap-2 mt-1">
              {userInfo.name && (
                <p className="text-xs text-gray-500">
                  Account: {userInfo.name}{" "}
                  {userInfo.email ? `(${userInfo.email})` : ""}
                </p>
              )}
            </div>
          </div>

          <SyncToggle />
        </div>

     { isLoading ? (
  <div className="flex flex-col items-center justify-center h-[60dvh] rounded-xl gap-6 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
    {/* Background Animation */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 animate-pulse"></div>
    
    {/* Main Loading Content */}
    <div className="relative z-10 flex flex-col items-center gap-6">
      {/* Animated Icon */}
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-ping"></div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-800">
          Syncing Users...
        </h3>
        <p className="text-sm text-gray-600">
          Please wait while we sync your team data
        </p>
      </div>

      {/* Animated Progress Dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  </div>
) : !isLoading && syncedUsers.length > 0 ? (
  <div className="bg-white rounded-xl p-4">
    <h3 className="font-semibold mb-3">
      Synced Users ({syncedUsers.length})
    </h3>
    <div className="space-y-2">
      {syncedUsers.map((user, index) => (
        <div
          onClick={() => {
            setOpenPermissionTable(true);
            setSelectedRole(user.role);
          }}
          key={index}
          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-full">
              <User className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {user.user_number || "User"}
                </p>
                {user.role && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                      user.role
                    )} rounded-full`}
                  >
                    {user.role.charAt(0).toUpperCase() +
                      user.role.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isCurrentUserAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  className="p-1 hover:bg-gray-200 rounded-full"
                  variant={"ghost"}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleManagePermissions(user)}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => openRemoveConfirmation(user)}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  </div>
) : (
  <div className="flex flex-col items-center justify-center h-[60dvh] rounded-xl gap-3 bg-white">
    <span className="items-center text-center">
      <p className="text-md font-semibold">
        You have not added any users till now.
      </p>
      <p className="text-xs text-gray-400">
        Add users, assign roles and let your employees manage your
        business
      </p>
    </span>
    {isEnabled && isCurrentUserAdmin && (
      <Button
        className="p-1  h-10 w-40 text-lg rounded-full bg-black text-white"
        onClick={handleAddUser}
      >
        <Plus className="mr-1" /> Add User
      </Button>
    )}
  </div>
)}
      </section>

      {/* Add User Modal */}
      <AddUserModal
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onShareSuccess={fetchSyncedUsers}
      />

      {/* Manage Permissions Modal */}
      <ManagePermissionModal
        open={permissionModalOpen}
        onClose={() => {
          setPermissionModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUpdateRole={handleUpdateRole}
      />

      {/* Confirm Remove User Modal */}
      <ConfirmModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setUserToRemove(null);
        }}
        title="Remove User"
        description={`Are you sure you want to remove ${
          userToRemove?.user_number || "this user"
        } )? They will no longer have access to this firm's data.`}
        actionLabel="Remove User"
        isLoading={isRemoving}
        onConfirm={handleRemoveUser}
      />
      <PermissionsDialog
        isOpen={
          openPermissionTable && !permissionModalOpen && !confirmModalOpen
        }
        selectedRole={selectedRole}
        onOpenChange={() => setOpenPermissionTable(false)}
      />
    </div>
  );
};

export default SyncShare;
