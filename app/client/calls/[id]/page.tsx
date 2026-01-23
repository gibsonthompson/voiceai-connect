'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, PhoneCall, Settings, LogOut, 
  TrendingUp, ArrowLeft, Play, Pause, Clock,
  User, MapPin, AlertCircle, MessageSquare, Loader2, Bot
} from 'lucide-react';

interface Call {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  caller_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  service_requested: string | null;
  urgency_level: string | null;
  ai_summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  call_status: string | null;
}

interface Client {
  id: string;
  business_name: string;
  vapi_phone_number: string | null;
  agency_id: string | null;
}

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  agencyName: string;
}

export default function CallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadCallDetail = async () => {
      if (!callId) {
        router.push('/client/calls');
        return;
      }

      const token = localStorage.getItem('auth_token');
      const clientStr = localStorage.getItem('client');

      if (!token || !clientStr) {
        router.push('/client/login');
        return;
      }

      try {
        const clientData = JSON.parse(clientStr);
        setClient(clientData);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://urchin-app-bqb4i.ondigitalocean.app';

        // Fetch client with agency data for branding
        const clientResponse = await fetch(`${backendUrl}/api/client/${clientData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!clientResponse.ok) {
          throw new Error('Failed to fetch client');
        }

        const fullClientData = await clientResponse.json();
        const agency = fullClientData.client?.agencies || fullClientData.agency;

        setBranding({
          primaryColor: agency?.primary_color || '#3b82f6',
          secondaryColor: agency?.secondary_color || '#1e40af',
          accentColor: agency?.accent_color || '#60a5fa',
          logoUrl: agency?.logo_url || null,
          agencyName: agency?.name || 'VoiceAI',
        });

        // Fetch call detail
        const callResponse = await fetch(`${backendUrl}/api/client/${clientData.id}/calls/${callId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!callResponse.ok) {
          // Call not found, redirect to calls list
          router.push('/client/calls');
          return;
        }

        const callData = await callResponse.json();
        setCall(callData.call);

        setLoading(false);
      } catch (error) {
        console.error('Error loading call detail:', error);
        router.push('/client/login');
      }
    };

    loadCallDetail();
  }, [router, callId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handlePlayPause = () => {
    if (!call?.recording_url) return;

    if (!audioElement) {
      const audio = new Audio(call.recording_url);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('client');
    router.push('/client/login');
  };

  const navItems = [
    { href: '/client/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/client/calls', label: 'Calls', icon: PhoneCall, active: true },
    { href: '/client/ai-agent', label: 'AI Agent', icon: Bot, active: false },
    { href: '/client/settings', label: 'Settings', icon: Settings, active: false },
  ];

  if (loading || !client || !branding || !call) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-[#0a0a0a]">
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.agencyName} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Phone className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{client.business_name}</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-white/10 text-[#f5f5f0]'
                  : 'text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0]'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-[#f5f5f0]/40">Powered by</p>
            <p className="text-sm font-medium text-[#f5f5f0]/70">{branding.agencyName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0] transition-colors border-t border-white/5 pt-4 w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {/* Back button */}
          <Link 
            href="/client/calls"
            className="inline-flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calls
          </Link>

          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium tracking-tight">
                Call with {call.customer_name || 'Unknown Caller'}
              </h1>
              <p className="mt-1 text-[#f5f5f0]/50">
                {new Date(call.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {call.duration_seconds && ` • ${formatDuration(call.duration_seconds)}`}
              </p>
            </div>
            
            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                call.urgency_level === 'high' || call.urgency_level === 'emergency'
                  ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                  : call.urgency_level === 'medium'
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                  : 'bg-white/10 text-[#f5f5f0]/60 border border-white/10'
              }`}
            >
              {call.urgency_level ? `${call.urgency_level.charAt(0).toUpperCase()}${call.urgency_level.slice(1)}` : 'Normal'} Priority
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary */}
              {call.ai_summary && (
                <div className="rounded-xl border border-white/10 bg-[#111] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
                      <MessageSquare className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h2 className="font-medium">AI Summary</h2>
                  </div>
                  <p className="text-[#f5f5f0]/70 leading-relaxed">
                    {call.ai_summary}
                  </p>
                </div>
              )}

              {/* Recording */}
              {call.recording_url && (
                <div className="rounded-xl border border-white/10 bg-[#111] p-6">
                  <h2 className="font-medium mb-4">Recording</h2>
                  <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                    <button 
                      onClick={handlePlayPause}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f0] text-[#0a0a0a] hover:bg-white transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-0 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-[#f5f5f0]/40">
                        <span>0:00</span>
                        <span>{call.duration_seconds ? formatDuration(call.duration_seconds) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {call.transcript && (
                <div className="rounded-xl border border-white/10 bg-[#111] p-6">
                  <h2 className="font-medium mb-4">Full Transcript</h2>
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-[#f5f5f0]/70 whitespace-pre-wrap leading-relaxed">
                      {call.transcript}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Details */}
              <div className="rounded-xl border border-white/10 bg-[#111] p-6">
                <h2 className="font-medium mb-4">Contact Details</h2>
                <div className="space-y-4">
                  {call.customer_name && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <User className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Name</p>
                        <p className="text-sm">{call.customer_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {(call.customer_phone || call.caller_phone) && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <Phone className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Phone</p>
                        <p className="text-sm">{call.customer_phone || call.caller_phone}</p>
                      </div>
                    </div>
                  )}

                  {call.customer_email && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <MessageSquare className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Email</p>
                        <p className="text-sm">{call.customer_email}</p>
                      </div>
                    </div>
                  )}
                  
                  {call.customer_address && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <MapPin className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Address</p>
                        <p className="text-sm">{call.customer_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Details */}
              <div className="rounded-xl border border-white/10 bg-[#111] p-6">
                <h2 className="font-medium mb-4">Call Details</h2>
                <div className="space-y-4">
                  {call.service_requested && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <Settings className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Service Requested</p>
                        <p className="text-sm">{call.service_requested}</p>
                      </div>
                    </div>
                  )}
                  
                  {call.urgency_level && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <AlertCircle className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Urgency</p>
                        <p className="text-sm capitalize">{call.urgency_level}</p>
                      </div>
                    </div>
                  )}
                  
                  {call.duration_seconds && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        <Clock className="h-4 w-4 text-[#f5f5f0]/50" />
                      </div>
                      <div>
                        <p className="text-xs text-[#f5f5f0]/40">Duration</p>
                        <p className="text-sm">{formatDuration(call.duration_seconds)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <a 
                  href={`tel:${call.customer_phone || call.caller_phone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-[#f5f5f0] px-4 py-3 text-sm font-medium text-[#0a0a0a] hover:bg-white transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call Back
                </a>
                <button className="flex items-center justify-center gap-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}