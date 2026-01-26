'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Clock, Zap } from 'lucide-react';

interface TrialBannerProps {
  subscriptionStatus: string;
  trialEndsAt: string | null;
  planType: string | null;
}

export default function TrialBanner({ subscriptionStatus, trialEndsAt, planType }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (trialEndsAt) {
      const endDate = new Date(trialEndsAt);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays > 0 ? diffDays : 0);
    }
  }, [trialEndsAt]);

  // Hide if active subscription
  if (subscriptionStatus === 'active' && planType !== 'trial') {
    return null;
  }

  // Don't dismiss if urgent (2 days or less)
  const isUrgent = daysRemaining !== null && daysRemaining <= 2;
  if (isDismissed && !isUrgent) {
    return null;
  }

  // Only show for trial status
  if (subscriptionStatus !== 'trial' || daysRemaining === null) {
    return null;
  }

  const isExpiringSoon = daysRemaining <= 3;

  return (
    <div 
      className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
        isUrgent 
          ? 'bg-gradient-to-r from-red-600 to-red-500' 
          : isExpiringSoon 
            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
            : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800'
      }`}
    >
      <div className={`flex items-center gap-2 ${isExpiringSoon && !isUrgent ? 'text-gray-900' : 'text-white'}`}>
        {isUrgent ? (
          <Zap className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Clock className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">
          {daysRemaining === 0 
            ? 'Trial expires today!' 
            : daysRemaining === 1 
              ? '1 day left in trial'
              : `${daysRemaining} days left in trial`
          }
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Link 
          href="/client/upgrade"
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md ${
            isUrgent 
              ? 'bg-white text-red-600' 
              : isExpiringSoon 
                ? 'bg-gray-900 text-white'
                : 'bg-amber-400 text-gray-900'
          }`}
        >
          Upgrade Now
        </Link>
        
        {!isUrgent && (
          <button 
            onClick={() => setIsDismissed(true)}
            className={`p-1 transition ${isExpiringSoon && !isUrgent ? 'text-gray-900/60 hover:text-gray-900' : 'text-white/60 hover:text-white'}`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}