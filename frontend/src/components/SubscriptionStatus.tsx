import React, { useEffect, useState } from 'react';
import { Clock, Star, AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import { Progress } from '@/components/ui/progress';

const SubscriptionStatus: React.FC = () => {
  const userInfo = useAppSelector((state) => state.userinfo);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [progress, setProgress] = useState(0);
  console.log(userInfo)
  useEffect(() => {
    if (userInfo?.subscription?.end_date) {
      const calculateTimeRemaining = () => {
        const now = new Date();
        const endDate = new Date(userInfo.subscription.end_date);
        const startDate = new Date(userInfo.subscription.start_date);
        
        // Total subscription duration in milliseconds
        const totalDuration = endDate.getTime() - startDate.getTime();
        
        // Time elapsed since start date
        const timeElapsed = now.getTime() - startDate.getTime();
        
        // Calculate progress percentage (capped between 0-100)
        const calculatedProgress = Math.min(Math.max((timeElapsed / totalDuration) * 100, 0), 100);
        setProgress(calculatedProgress);

        if (endDate > now) {
          const diffInMs = endDate.getTime() - now.getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
          
          setTimeRemaining({
            days: diffInDays,
            hours: diffInHours,
            minutes: diffInMinutes
          });
        } else {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
        }
      };

      // Calculate initially
      calculateTimeRemaining();
      
      // Update every minute
      const interval = setInterval(calculateTimeRemaining, 60000);
      
      return () => clearInterval(interval);
    }
  }, [userInfo?.subscription]);

  if (!userInfo?.subscription) {
    return (
      <div className="p-3 mt-1 border-t border-gray-700">
        <div className="bg-gray-800 rounded-md p-3 text-gray-400 text-xs">
          <div className="flex items-center justify-between">
            <span>No active subscription</span>
            <AlertTriangle size={14} className="text-yellow-400" />
          </div>
        </div>
      </div>
    );
  }

  // Determine status color
  const getStatusColor = () => {
    if (!timeRemaining) return 'text-gray-400';
    
    if (timeRemaining.days <= 0 && timeRemaining.hours <= 0) {
      return 'text-red-400';
    } else if (timeRemaining.days <= 3) {
      return 'text-yellow-400';
    } else {
      return 'text-green-400';
    }
  };

  const statusColor = getStatusColor();
  const progressColor = timeRemaining?.days <= 3 ? 
    (timeRemaining.days <= 0 ? 'bg-red-500' : 'bg-yellow-500') : 
    'bg-green-500';

  return (
    <div className="p-3 mt-1 border-t border-gray-700">
      <div className="bg-gray-800 rounded-md p-3 text-white">
        <div className="flex items-center mb-2">
          <Star size={14} className="text-yellow-400 mr-1.5" />
          <span className="text-xs font-medium">{userInfo.subscription.plan_name}</span>
        </div>
        
        {timeRemaining && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center">
                <Clock size={12} className={`${statusColor} mr-1`} />
                <span className="text-xs text-gray-300">Expires in:</span>
              </div>
              <span className={`text-xs font-medium ${statusColor}`}>
                {timeRemaining.days > 0 ? `${timeRemaining.days}d ` : ''}
                {timeRemaining.hours}h {timeRemaining.minutes}m
              </span>
            </div>
            
            <Progress 
              value={100 - progress} 
              className={`h-1.5 bg-gray-700 ${progressColor}`} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;