import { useDeleteConfirmation } from "@/lib/context/DeleteConfirmationContext";
import toast from "react-hot-toast";

export const useDeleteActions = () => {
  const { showDeleteConfirmation } = useDeleteConfirmation();

  const deleteItem = (
    itemId: string,
    itemName: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Item",
      message: "This item will be permanently removed from your inventory.",
      itemName,
      onConfirm: async () => {
        try {
          await deleteMutation(itemId).unwrap();
          toast.success("Item deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete item");
          throw error;
        }
      },
    });
  };

  const deleteCategory = (
    categoryId: string,
    categoryName: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Category",
      message: "All items in this category will be uncategorized.",
      itemName: categoryName,
      onConfirm: async () => {
        try {
          await deleteMutation(categoryId).unwrap();
          toast.success("Category deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete category");
          throw error;
        }
      },
    });
  };

  const deleteParty = (
    partyId: string,
    partyName: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Party",
      message:
        "This will remove the party and all associated transaction history.",
      itemName: partyName,
      confirmText: "Delete Party",
      onConfirm: async () => {
        try {
          await deleteMutation(partyId).unwrap();
          toast.success("Party deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete party");
          throw error;
        }
      },
    });
  };

  const deleteDocument = (
    documentId: string,
    documentType: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Document",
      message:
        "This will permanently remove the document and all associated data.",
      itemName: `${documentType}`,
      confirmText: "Delete Document",
      onConfirm: async () => {
        try {
          await deleteMutation({
            id: documentId,
            documentType: documentType,
          }).unwrap();
          toast.success("Document deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete document");
          throw error;
        }
      },
    });
  };

  const deletePayment = (
    paymentId: string,
    paymentReference: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Payment",
      message:
        "This will permanently remove the payment record and may affect account balances.",
      itemName: `Payment ${paymentReference}`,
      confirmText: "Delete Payment",
      onConfirm: async () => {
        try {
          await deleteMutation({
            id: paymentId,
            direction: paymentReference,
          }).unwrap();
          toast.success("Payment deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete payment");
          throw error;
        }
      },
    });
  };

  const deleteBank = (
    bankId: string,
    bankName: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Bank Account",
      message:
        "This will remove the bank account and all associated transaction records.",
      itemName: bankName,
      confirmText: "Delete Bank Account",
      onConfirm: async () => {
        try {
          await deleteMutation(bankId).unwrap();
          toast.success("Bank account deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete bank account");
          throw error;
        }
      },
    });
  };

  const deleteTransaction = (
    transactionId: string,
    transactionReference: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete Transaction",
      message:
        "This will permanently remove the transaction and may affect account balances.",
      itemName: `Transaction ${transactionReference}`,
      confirmText: "Delete Transaction",
      onConfirm: async () => {
        try {
          await deleteMutation(transactionId).unwrap();
          toast.success("Transaction deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete transaction");
          throw error;
        }
      },
    });
  };

  const deleteUser = (
    userId: string,
    userName: string,
    deleteMutation: any
  ) => {
    showDeleteConfirmation({
      title: "Delete User",
      message: "This user will lose access to the system immediately.",
      itemName: userName,
      confirmText: "Delete User",
      onConfirm: async () => {
        try {
          await deleteMutation(userId).unwrap();
          toast.success("User deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete user");
          throw error;
        }
      },
    });
  };

  // Generic delete function for custom cases
  const deleteGeneric = (options: {
    id: string;
    name: string;
    title?: string;
    message?: string;
    confirmText?: string;
    successMessage?: string;
    deleteMutation: any;
  }) => {
    showDeleteConfirmation({
      title: options.title || "Delete Item",
      message: options.message || "This action cannot be undone.",
      itemName: options.name,
      confirmText: options.confirmText || "Delete",
      onConfirm: async () => {
        try {
          await options.deleteMutation(options.id).unwrap();
          toast.success(options.successMessage || "Deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.error || "Failed to delete");
          throw error;
        }
      },
    });
  };

  return {
    deleteItem,
    deleteCategory,
    deleteParty,
    deleteDocument,
    deletePayment,
    deleteBank,
    deleteTransaction,
    deleteUser,
    deleteGeneric,
  };
};
