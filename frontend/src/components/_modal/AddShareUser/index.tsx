"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/redux/api/api.config";
import axios from "axios";
import { backend_url } from "@/backend.config";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onShareSuccess: () => void;
}

const AddUserModal = ({ open, onClose, onShareSuccess }: AddUserModalProps) => {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    const firmId = localStorage.getItem("firmId");
    if (!phone || !role || !firmId) {
      toast.error("Phone and role are required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${backend_url}/share-firm/`, {
        phone,
        firm_id: firmId,
        role,
      });

      if (res.data.status === "success") {
        toast.success("Firm shared successfully");
        setPhone("");
        setRole("viewer");
        onShareSuccess();
        onClose();
      } else {
        toast.error(res.data.error || "Failed to share firm");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error sharing firm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share Firm with User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Enter customer's phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Enter role (e.g., admin, editor, viewer)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Button className="w-full" onClick={handleShare} disabled={loading}>
            {loading ? "Sharing..." : "Share Firm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
