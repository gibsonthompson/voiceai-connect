'use client';

// ============================================================================
// components/cc/navIcons.tsx
//
// The nav icon SETS, each from a genuinely different icon package (via
// react-icons), so an agency can pick a whole icon family whose design language
// matches their brand, not just a stroke weight. Plus a text-only mode that
// drops icons entirely.
//
// Each set maps the same nav routes to that family's equivalent icon, so the nav
// stays coherent whichever set is chosen. The set keys are shared with the
// backend (brand-fonts.js) and the vision model, which picks one from the logo.
//
// All names here were verified to exist in react-icons v5.
// ============================================================================

import type { IconType } from 'react-icons';
import { LuLayoutDashboard, LuPhone, LuClipboardList, LuInbox, LuMessageSquare, LuContactRound, LuBuilding2, LuHeadset, LuChartBar, LuSettings, LuClock, LuLogOut, LuTarget, LuSend, LuCreditCard, LuGlobe, LuCpu, LuPaintbrush, LuGift } from 'react-icons/lu';
import { PiHouse, PiPhone, PiClipboardText, PiTray, PiChatCircle, PiAddressBook, PiBuildings, PiHeadset, PiChartBar, PiGear, PiClock, PiSignOut, PiTarget, PiPaperPlaneTilt, PiCreditCard, PiGlobe, PiCpu, PiPaintBrush, PiGift } from 'react-icons/pi';
import { HiHome, HiPhone, HiClipboardDocumentList, HiInbox, HiChatBubbleLeftRight, HiIdentification, HiBuildingOffice2, HiUserGroup, HiChartBar, HiCog6Tooth, HiClock, HiArrowRightOnRectangle, HiViewfinderCircle, HiPaperAirplane, HiCreditCard, HiGlobeAlt, HiCpuChip, HiPaintBrush, HiGift } from 'react-icons/hi2';
import { TbLayoutDashboard, TbPhone, TbClipboardList, TbInbox, TbMessageCircle, TbAddressBook, TbBuilding, TbHeadset, TbChartBar, TbSettings, TbClock, TbLogout, TbTarget, TbSend, TbCreditCard, TbWorld, TbCpu, TbBrush, TbGift } from 'react-icons/tb';
import { FiGrid, FiPhone, FiClipboard, FiInbox, FiMessageSquare, FiUsers, FiBriefcase, FiHeadphones, FiBarChart2, FiSettings, FiClock, FiLogOut, FiTarget, FiSend, FiCreditCard, FiGlobe, FiCpu, FiPenTool, FiGift } from 'react-icons/fi';
import { FaHouse, FaPhone, FaClipboardList, FaInbox, FaCommentSms, FaAddressBook, FaBuilding, FaHeadset, FaChartColumn, FaGear, FaClock, FaRightFromBracket, FaBullseye, FaPaperPlane, FaCreditCard, FaGlobe, FaMicrochip, FaPaintbrush, FaGift } from 'react-icons/fa6';

export type NavRoute = 'dashboard' | 'live' | 'calls' | 'messages' | 'texts' | 'contacts' | 'businesses' | 'agents' | 'analytics' | 'settings' | 'availability' | 'signout' | 'leads' | 'outreach' | 'payments' | 'website' | 'ailab' | 'branding' | 'referrals';

// setKey -> (route -> icon component). Each row is a different icon package.
export const NAV_ICON: Record<string, Record<NavRoute, IconType>> = {
  lucide:      { dashboard: LuLayoutDashboard, live: LuPhone, calls: LuClipboardList, messages: LuInbox, texts: LuMessageSquare, contacts: LuContactRound, businesses: LuBuilding2, agents: LuHeadset, analytics: LuChartBar, settings: LuSettings, availability: LuClock, signout: LuLogOut, leads: LuTarget, outreach: LuSend, payments: LuCreditCard, website: LuGlobe, ailab: LuCpu, branding: LuPaintbrush, referrals: LuGift },
  phosphor:    { dashboard: PiHouse, live: PiPhone, calls: PiClipboardText, messages: PiTray, texts: PiChatCircle, contacts: PiAddressBook, businesses: PiBuildings, agents: PiHeadset, analytics: PiChartBar, settings: PiGear, availability: PiClock, signout: PiSignOut, leads: PiTarget, outreach: PiPaperPlaneTilt, payments: PiCreditCard, website: PiGlobe, ailab: PiCpu, branding: PiPaintBrush, referrals: PiGift },
  heroicons:   { dashboard: HiHome, live: HiPhone, calls: HiClipboardDocumentList, messages: HiInbox, texts: HiChatBubbleLeftRight, contacts: HiIdentification, businesses: HiBuildingOffice2, agents: HiUserGroup, analytics: HiChartBar, settings: HiCog6Tooth, availability: HiClock, signout: HiArrowRightOnRectangle, leads: HiViewfinderCircle, outreach: HiPaperAirplane, payments: HiCreditCard, website: HiGlobeAlt, ailab: HiCpuChip, branding: HiPaintBrush, referrals: HiGift },
  tabler:      { dashboard: TbLayoutDashboard, live: TbPhone, calls: TbClipboardList, messages: TbInbox, texts: TbMessageCircle, contacts: TbAddressBook, businesses: TbBuilding, agents: TbHeadset, analytics: TbChartBar, settings: TbSettings, availability: TbClock, signout: TbLogout, leads: TbTarget, outreach: TbSend, payments: TbCreditCard, website: TbWorld, ailab: TbCpu, branding: TbBrush, referrals: TbGift },
  feather:     { dashboard: FiGrid, live: FiPhone, calls: FiClipboard, messages: FiInbox, texts: FiMessageSquare, contacts: FiUsers, businesses: FiBriefcase, agents: FiHeadphones, analytics: FiBarChart2, settings: FiSettings, availability: FiClock, signout: FiLogOut, leads: FiTarget, outreach: FiSend, payments: FiCreditCard, website: FiGlobe, ailab: FiCpu, branding: FiPenTool, referrals: FiGift },
  fontawesome: { dashboard: FaHouse, live: FaPhone, calls: FaClipboardList, messages: FaInbox, texts: FaCommentSms, contacts: FaAddressBook, businesses: FaBuilding, agents: FaHeadset, analytics: FaChartColumn, settings: FaGear, availability: FaClock, signout: FaRightFromBracket, leads: FaBullseye, outreach: FaPaperPlane, payments: FaCreditCard, website: FaGlobe, ailab: FaMicrochip, branding: FaPaintbrush, referrals: FaGift },
};

// Ordered for the branding UI + validation. 'none' = text-only nav (no icons).
export const ICON_SETS: { key: string; label: string; note: string }[] = [
  { key: 'lucide', label: 'Lucide', note: 'Clean, geometric outline' },
  { key: 'phosphor', label: 'Phosphor', note: 'Soft, rounded, friendly' },
  { key: 'heroicons', label: 'Heroicons', note: 'Solid, filled, bold' },
  { key: 'tabler', label: 'Tabler', note: 'Even, technical outline' },
  { key: 'feather', label: 'Feather', note: 'Light, minimal' },
  { key: 'fontawesome', label: 'Classic', note: 'Solid, familiar' },
  { key: 'none', label: 'Text only', note: 'No icons' },
];
export const ICON_SET_KEYS = ICON_SETS.map((s) => s.key);
export const DEFAULT_ICON_SET = 'lucide';

// The icon component for a (set, route), falling back to the default set then
// null (so an unknown/legacy value still renders something sensible).
export function navIcon(setKey: string | null | undefined, route: NavRoute): IconType | null {
  const key = setKey && NAV_ICON[setKey] ? setKey : DEFAULT_ICON_SET;
  return NAV_ICON[key]?.[route] || NAV_ICON[DEFAULT_ICON_SET][route] || null;
}

// True when the brand uses no nav icons.
export function iconsHidden(setKey?: string | null): boolean {
  return setKey === 'none';
}

// Three representative icons for a set's preview tile.
export function previewIcons(setKey: string): IconType[] {
  const s = NAV_ICON[setKey];
  if (!s) return [];
  return [s.dashboard, s.messages, s.analytics];
}
