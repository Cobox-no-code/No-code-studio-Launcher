// 2. Create a RestoreDataModal component
// components/modals/RestoreDataModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Cloud, 
  Building, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Zap
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { restoreFromCloud, clearRestoreState } from "@/redux/slices/syncRestoreSlice";
import { cn } from "@/lib/utils";

interface RestoreDataModalProps {
  open: boolean;
  onClose: () => void;
  cloudFirms: any[];
  onRestoreComplete: () => void;
}

const RestoreDataModal: React.FC<RestoreDataModalProps> = ({
  open,
  onClose,
  cloudFirms,
  onRestoreComplete
}) => {
  const dispatch = useAppDispatch();
  const { isRestoring, restorationSteps } = useAppSelector(state => state.syncRestore);
  const { phone } = useAppSelector(state => state.userinfo);
  
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (selectAll) {
      setSelectedFirms(cloudFirms.map(firm => firm.id));
    } else {
      setSelectedFirms([]);
    }
  }, [selectAll, cloudFirms]);

  const handleFirmToggle = (firmId: string) => {
    setSelectedFirms(prev => 
      prev.includes(firmId) 
        ? prev.filter(id => id !== firmId)
        : [...prev, firmId]
    );
  };

  const handleRestore = async () => {
    if (selectedFirms.length === 0) return;
    
    try {
      await dispatch(restoreFromCloud({ 
        phone, 
        selectedFirms 
      })).unwrap();
      
      // Wait a bit for the animation to complete
      setTimeout(() => {
        onRestoreComplete();
        onClose();
        dispatch(clearRestoreState());
      }, 2000);
      
    } catch (error) {
      console.error("Restoration failed:", error);
    }
  };

  const handleSkip = () => {
    onClose();
    dispatch(clearRestoreState());
  };

  if (isRestoring) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg">
          <div className="text-center py-6">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Cloud className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Restoring Your Data
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              We're restoring your business data from the cloud. This may take a few moments.
            </p>

            <div className="space-y-4">
              {restorationSteps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 relative">
                      {step.status === "pending" && (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-50" />
                      )}
                      {step.status === "loading" && (
                        <div className="relative">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          </div>
                          <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-ping opacity-30" />
                        </div>
                      )}
                      {step.status === "completed" && (
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {step.status === "error" && (
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          step.status === "completed" && "text-green-700",
                          step.status === "loading" && "text-blue-700",
                          step.status === "error" && "text-red-700",
                          step.status === "pending" && "text-gray-500"
                        )}>
                          {step.label}
                        </span>
                        {step.status === "loading" && (
                          <span className="text-xs font-medium text-blue-600 animate-pulse flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        step.status === "completed" && "text-green-600",
                        step.status === "loading" && "text-blue-600",
                        step.status === "error" && "text-red-600",
                        step.status === "pending" && "text-gray-400"
                      )}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < restorationSteps.length - 1 && (
                    <div className="absolute left-3 top-8 w-0.5 h-4 bg-gray-200">
                      {step.status === "completed" && (
                        <div className="w-full h-full bg-gradient-to-b from-blue-500 to-green-500 rounded-full" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Restore Your Data
          </DialogTitle>
          <DialogDescription>
            We found your business data in the cloud. Select which companies you'd like to restore to this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectAll}
                onCheckedChange={checked => setSelectAll(checked === true)}
              />
              <span className="font-medium text-blue-900">
                Select All Companies ({cloudFirms.length})
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Download className="w-3 h-3 mr-1" />
              Restore All
            </Badge>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {cloudFirms.map((firm) => (
              <div key={firm.firm_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedFirms.includes(firm.firm_id)}
                    onCheckedChange={() => handleFirmToggle(firm.firm_id)}
                  />
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{firm.firm_name}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {firm.role || 'Member'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
            <Button 
              onClick={handleRestore}
              disabled={selectedFirms.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Restore Selected ({selectedFirms.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestoreDataModal;