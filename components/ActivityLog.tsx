'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, RefreshCw, Mail, MessageSquare, Phone, 
  FileText, ArrowRightLeft, Calendar, Sparkles, Clock,
  ChevronDown
} from 'lucide-react';

interface Activity {
  id: string;
  action_type: string;
  action_data: Record<string, any>;
  created_at: string;
  performer?: {
    first_name: string;
    last_name: string;
  };
}

interface ActivityLogProps {
  agencyId: string;
  entityType: string;
  entityId: string;
}

const ACTION_ICONS: Record<string, any> = {
  created: Sparkles,
  status_change: ArrowRightLeft,
  note_added: FileText,
  note_updated: FileText,
  email_sent: Mail,
  sms_sent: MessageSquare,
  call_logged: Phone,
  follow_up_set: Calendar,
  updated: RefreshCw,
  converted: Sparkles,
};

const ACTION_COLORS: Record<string, string> = {
  created: 'text-emerald-400 bg-emerald-500/10',
  status_change: 'text-blue-400 bg-blue-500/10',
  note_added: 'text-amber-400 bg-amber-500/10',
  note_updated: 'text-amber-400 bg-amber-500/10',
  email_sent: 'text-purple-400 bg-purple-500/10',
  sms_sent: 'text-cyan-400 bg-cyan-500/10',
  call_logged: 'text-green-400 bg-green-500/10',
  follow_up_set: 'text-orange-400 bg-orange-500/10',
  updated: 'text-gray-400 bg-gray-500/10',
  converted: 'text-emerald-400 bg-emerald-500/10',
};

function getActionDescription(activity: Activity): string {
  const { action_type, action_data } = activity;
  
  switch (action_type) {
    case 'created':
      return `Lead created${action_data?.source ? ` from ${action_data.source.replace('_', ' ')}` : ''}`;
    
    case 'status_change':
      return `Status changed from ${formatStatus(action_data?.from)} to ${formatStatus(action_data?.to)}`;
    
    case 'note_added':
      return 'Note added';
    
    case 'note_updated':
      return 'Note updated';
    
    case 'email_sent':
      return `Email sent${action_data?.subject ? `: "${truncate(action_data.subject, 40)}"` : ''}`;
    
    case 'sms_sent':
      return 'SMS sent';
    
    case 'call_logged':
      return `Call logged${action_data?.duration ? ` (${action_data.duration} min)` : ''}${action_data?.outcome ? ` - ${action_data.outcome}` : ''}`;
    
    case 'follow_up_set':
      return `Follow-up scheduled for ${action_data?.date ? new Date(action_data.date).toLocaleDateString() : 'a future date'}`;
    
    case 'converted':
      return 'Converted to client';
    
    default:
      return action_type.replace(/_/g, ' ');
  }
}

function formatStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function groupActivitiesByDate(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
  });
  
  return groups;
}

export default function ActivityLog({ agencyId, entityType, entityId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [agencyId, entityType, entityId]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agencyId}/activity/${entityType}/${entityId}?limit=50`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedActivities = groupActivitiesByDate(activities);
  const displayActivities = showAll ? activities : activities.slice(0, 10);
  const displayGroups = groupActivitiesByDate(displayActivities);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-4 w-4 text-[#fafaf9]/50" />
          <h3 className="font-medium">Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#fafaf9]/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-[#fafaf9]/50" />
          <h3 className="font-medium">Activity</h3>
          <span className="text-xs text-[#fafaf9]/40">
            {activities.length} events
          </span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-[#fafaf9]/30 transition-transform ${expanded ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {expanded && (
        <div className="px-5 pb-5">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-[#fafaf9]/20 mx-auto mb-2" />
              <p className="text-sm text-[#fafaf9]/40">No activity yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {Object.entries(displayGroups).map(([date, dateActivities]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-[#fafaf9]/40 mb-3">{date}</p>
                    <div className="space-y-3">
                      {dateActivities.map((activity) => {
                        const Icon = ACTION_ICONS[activity.action_type] || RefreshCw;
                        const colorClass = ACTION_COLORS[activity.action_type] || 'text-gray-400 bg-gray-500/10';
                        
                        return (
                          <div key={activity.id} className="flex gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                {getActionDescription(activity)}
                              </p>
                              <p className="text-xs text-[#fafaf9]/40 mt-0.5">
                                {formatRelativeTime(activity.created_at)}
                                {activity.performer && (
                                  <span>
                                    {' '}by {activity.performer.first_name} {activity.performer.last_name}
                                  </span>
                                )}
                              </p>
                              {activity.action_type === 'note_added' && activity.action_data?.note && (
                                <p className="text-xs text-[#fafaf9]/50 mt-1 line-clamp-2 italic">
                                  "{truncate(activity.action_data.note, 100)}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {activities.length > 10 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showAll ? 'Show less' : `Show all ${activities.length} activities`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}