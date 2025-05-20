'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, AlertOctagon, Clock } from 'lucide-react';

/**
 * Modal that appears when a subscription expires
 * Uses shadcn/ui Dialog component
 */
const SubscriptionExpiredModal = () => {
  const router = useRouter();
  const userInfo = useAppSelector((state) => state.userinfo);
  const [open, setOpen] = useState(false);
  const [hasShownBefore, setHasShownBefore] = useState(false);

  // Check if subscription is expired
  useEffect(() => {
    // Don't show modal if we've shown it already in this session
    if (hasShownBefore) return;
    
    // Check if user has subscription and it's expired
    if (userInfo?.subscription && userInfo.isExpired) {
      // Set a small delay to prevent showing immediately on page load
      const timer = setTimeout(() => {
        setOpen(true);
        setHasShownBefore(true);
        
        // Store in session storage that we've shown this modal
        try {
          sessionStorage.setItem('expiredModalShown', 'true');
        } catch (error) {
          console.error('Error storing modal state:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userInfo?.subscription, userInfo?.isExpired, hasShownBefore]);

  // Check session storage on mount
  useEffect(() => {
    try {
      const shown = sessionStorage.getItem('expiredModalShown');
      if (shown === 'true') {
        setHasShownBefore(true);
      }
    } catch (error) {
      console.error('Error reading session storage:', error);
    }
  }, []);

  // Format the expiration date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle navigation to pricing page
  const handleViewPlans = () => {
    setOpen(false);
    router.push('/pricing');
  };

  // Skip showing if no subscription or not expired
  if (!userInfo?.subscription || !userInfo.isExpired) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-red-100 p-3 rounded-full mb-4">
            <AlertOctagon className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Your Subscription Has Expired
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Your {userInfo.subscription.plan_name} subscription expired on 
            <span className="font-medium text-foreground"> {formatDate(userInfo.subscription.end_date)}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-muted/50 rounded-lg my-3">
          <h4 className="font-medium text-sm mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            Features no longer available:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Premium content access
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Advanced features
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Priority support
            </li>
          </ul>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 sm:gap-3 mt-2">
          <Button 
            variant="secondary" 
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Later
          </Button>
          <Button 
            onClick={handleViewPlans}
            className="w-full sm:w-auto"
          >
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionExpiredModal;