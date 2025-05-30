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

import { backend_url } from "@/backend.config";
import AddUserModal from "@/components/_modal/AddShareUser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { syncAllToCloud } from "@/lib/sync-cloud";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setUserInfo } from "@/redux/slices/userinfoSlice";
import axios from "axios";
import {
  EllipsisVertical,
  Info,
  Plus,
  RefreshCcw,
  RotateCcw,
  CheckCircle,
  XCircle,
  User,
  Shield,
  UserMinus,
  UserCog,
} from "lucide-react";
import React, { useState, useEffect } from "react";
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

import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/redux/api/api.config";
import ManagePermissionModal from "@/components/_modal/ModifySharePermision";

type Role = "admin" | "editor" | "viewer";

interface SyncedUser {
  name: string;
  phone: string;
  role: any;
}

const SyncShare = () => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.userinfo);
  const { sync_enabled } = useAppSelector((state) => state.userinfo);
  const [syncedUsers, setSyncedUsers] = useState<SyncedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [firmData, setFirmData] = useState<any>(null);
  const [isCurrentUserAdmin, setCurrentUserAdmin] = useState(false);

  // Permission management modal state
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SyncedUser | null>(null);

  // Confirm removal modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<SyncedUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchSyncedUsers();
  }, []);

  const fetchSyncedUsers = async () => {
    const firm_id = localStorage.getItem("firmId");
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${backend_url}/get-firm-users?firmId=${firm_id}`
      );
      setSyncedUsers(response.data.synced_users || []);
    } catch (error) {
      console.error("Error fetching synced users:", error);
      toast.error("Failed to load synced users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSync = async () => {
    const firmId = localStorage.getItem("firmId");
    const owner = userInfo.phone;
    try {
      setIsLoading(true);
      const payload = {
        phone: userInfo.phone,
        sync_enabled: !sync_enabled,
      };

      const response = await axios.post(`${backend_url}/toggle-sync/`, payload);

      if (response.data.status === "success") {
        dispatch(setUserInfo({ ...userInfo, sync_enabled: !sync_enabled }));
        const result = await syncAllToCloud(backend_url, firmId, owner);

        toast.success(
          `Sync ${!sync_enabled ? "enabled" : "disabled"} successfully`
        );
      } else {
        toast.error(response.data.message || "Failed to toggle sync");
      }
    } catch (error) {
      console.error("Error toggling sync:", error);
      toast.error("An error occurred while toggling sync");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSync = async () => {
    try {
      setIsLoading(true);
      await fetchSyncedUsers();
      toast.success("Sync data refreshed");
    } catch (error) {
      console.error("Error refreshing sync data:", error);
      toast.error("Failed to refresh sync data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleManagePermissions = (user: SyncedUser) => {
    setSelectedUser(user);
    setPermissionModalOpen(true);
  };

  const handleUpdateRole = async (phone: string, role: Role) => {
    const firmId = localStorage.getItem("firmId");
    if (!phone || !role || !firmId) {
      toast.error("Missing required information");
      return;
    }

    try {
      const res = await axios.post(`${backend_url}/change-role/`, {
        phone,
        firm_id: firmId,
        role,
      });

      if (res.data.status === "success") {
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
      const res = await axios.post(`${backend_url}/remove-shared-firm/`, {
        phone: userToRemove.phone,
        firm_id: firmId,
      });

      if (res.data.status === "success") {
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
          {sync_enabled && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              <CheckCircle className="h-3 w-3 mr-1 text-gray-700" />
              Sync Enabled
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {sync_enabled && isCurrentUserAdmin && (
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

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                className="p-1 hover:bg-gray-200 rounded-full px-4 bg-gray-100"
                variant={"secondary"}
              >
                <EllipsisVertical className="text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleToggleSync}>
                {sync_enabled ? "Disable Sync" : "Enable Sync"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {syncedUsers.length > 0 ? (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-semibold mb-3">
              Synced Users ({syncedUsers.length})
            </h3>
            <div className="space-y-2">
              {syncedUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name || "User"}</p>
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
                      <p className="text-sm text-gray-500">{user.phone}</p>
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
            {sync_enabled && isCurrentUserAdmin && (
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
          userToRemove?.name || "this user"
        } (${
          userToRemove?.phone || ""
        })? They will no longer have access to this firm's data.`}
        actionLabel="Remove User"
        isLoading={isRemoving}
        onConfirm={handleRemoveUser}
      />
    </div>
  );
};

export default SyncShare;
