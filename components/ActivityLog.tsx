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
  created: 'text-emerald-500 bg-emerald-500/10',
  status_change: 'text-blue-500 bg-blue-500/10',
  note_added: 'text-amber-500 bg-amber-500/10',
  note_updated: 'text-amber-500 bg-amber-500/10',
  email_sent: 'text-purple-500 bg-purple-500/10',
  sms_sent: 'text-cyan-500 bg-cyan-500/10',
  call_logged: 'text-green-500 bg-green-500/10',
  follow_up_set: 'text-orange-500 bg-orange-500/10',
  updated: 'text-gray-500 bg-gray-500/10',
  converted: 'text-emerald-500 bg-emerald-500/10',
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
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--lp-border)', backgroundColor: 'var(--lp-card)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-4 w-4" style={{ color: 'var(--lp-muted)' }} />
          <h3 className="font-medium" style={{ color: 'var(--lp-text)' }}>Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--lp-muted)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--lp-border)', backgroundColor: 'var(--lp-card)' }}>
      <div className="w-full flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--lp-border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4" style={{ color: 'var(--lp-muted)' }} />
          <h3 className="font-medium" style={{ color: 'var(--lp-text)' }}>Activity</h3>
          <span className="text-xs rounded-full px-2 py-0.5" style={{ color: 'var(--lp-muted)', backgroundColor: 'var(--lp-hover)' }}>
            {activities.length} {activities.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="p-5">
          {activities.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--lp-hover)' }}>
                <Clock className="h-5 w-5" style={{ color: 'var(--lp-muted)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--lp-text)' }}>No activity yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--lp-muted)' }}>Status changes, calls, notes and emails show up here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {Object.entries(displayGroups).map(([date, dateActivities]) => (
                  <div key={date}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--lp-muted)' }}>{date}</p>
                    <div className="relative">
                      <div className="absolute left-[15px] top-1 bottom-1 w-px" style={{ backgroundColor: 'var(--lp-border)' }} />
                      <div className="space-y-4">
                        {dateActivities.map((activity) => {
                          const Icon = ACTION_ICONS[activity.action_type] || RefreshCw;
                          const colorClass = ACTION_COLORS[activity.action_type] || 'text-gray-500 bg-gray-500/10';

                          return (
                            <div key={activity.id} className="flex gap-3 relative">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`} style={{ boxShadow: '0 0 0 3px var(--lp-card)' }}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm" style={{ color: 'var(--lp-text)' }}>
                                  {getActionDescription(activity)}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
                                  <span className="text-xs" style={{ color: 'var(--lp-muted)' }}>
                                    {new Date(activity.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                  <span className="text-xs" style={{ color: 'var(--lp-muted)' }}>&middot;</span>
                                  <span className="text-xs" style={{ color: 'var(--lp-muted)' }}>{formatRelativeTime(activity.created_at)}</span>
                                  {activity.performer && (
                                    <>
                                      <span className="text-xs" style={{ color: 'var(--lp-muted)' }}>&middot;</span>
                                      <span className="text-xs" style={{ color: 'var(--lp-muted)' }}>{activity.performer.first_name} {activity.performer.last_name}</span>
                                    </>
                                  )}
                                </div>
                                {(activity.action_type === 'note_added' || activity.action_type === 'note_updated') && activity.action_data?.note && (
                                  <div className="mt-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--lp-border-subtle)', backgroundColor: 'var(--lp-hover)' }}>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--lp-text)' }}>{truncate(activity.action_data.note, 160)}</p>
                                  </div>
                                )}
                                {activity.action_type === 'email_sent' && activity.action_data?.subject && (
                                  <p className="text-xs mt-1 truncate" style={{ color: 'var(--lp-muted)' }}>Subject: {activity.action_data.subject}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {activities.length > 10 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-5 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--lp-primary)' }}
                >
                  {showAll ? 'Show less' : `Show all ${activities.length} events`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}