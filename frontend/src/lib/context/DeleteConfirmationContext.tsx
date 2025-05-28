"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

interface DeleteConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  onConfirm: (() => Promise<void>) | null;
  isLoading: boolean;
  confirmText?: string;
  cancelText?: string;
}

interface DeleteConfirmationContextType {
  showDeleteConfirmation: (options: {
    title?: string;
    message?: string;
    itemName: string;
    onConfirm: () => Promise<void>;
    confirmText?: string;
    cancelText?: string;
  }) => void;
  hideDeleteConfirmation: () => void;
}

const DeleteConfirmationContext = createContext<
  DeleteConfirmationContextType | undefined
>(undefined);

export const useDeleteConfirmation = () => {
  const context = useContext(DeleteConfirmationContext);
  if (!context) {
    throw new Error(
      "useDeleteConfirmation must be used within a DeleteConfirmationProvider"
    );
  }
  return context;
};

export const DeleteConfirmationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DeleteConfirmationState>({
    isOpen: false,
    title: "",
    message: "",
    itemName: "",
    onConfirm: null,
    isLoading: false,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  const showDeleteConfirmation = (options: {
    title?: string;
    message?: string;
    itemName: string;
    onConfirm: () => Promise<void>;
    confirmText?: string;
    cancelText?: string;
  }) => {
    setState({
      isOpen: true,
      title: options.title || "Delete Item",
      message: options.message || "This action cannot be undone.",
      itemName: options.itemName,
      onConfirm: options.onConfirm,
      isLoading: false,
      confirmText: options.confirmText || "Delete",
      cancelText: options.cancelText || "Cancel",
    });
  };

  const hideDeleteConfirmation = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  };

  const handleConfirm = async () => {
    if (!state.onConfirm) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await state.onConfirm();
      hideDeleteConfirmation();
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      // Error handling is done in the onConfirm function
    }
  };

  const DeleteConfirmationModal = () => (
    <div className={`fixed inset-0 z-50 ${state.isOpen ? "block" : "hidden"}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!state.isLoading ? hideDeleteConfirmation : undefined}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {state.title}
            </h3>
            <p className="text-sm text-gray-600">{state.message}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold">&quot;{state.itemName}&quot;</span>?
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={hideDeleteConfirmation}
            disabled={state.isLoading}
          >
            {state.cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              state.confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DeleteConfirmationContext.Provider
      value={{ showDeleteConfirmation, hideDeleteConfirmation }}
    >
      {children}
      <DeleteConfirmationModal />
    </DeleteConfirmationContext.Provider>
  );
};
