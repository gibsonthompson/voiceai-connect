// app/client/apple-icon.tsx
import { renderAgencyIcon } from '@/lib/agency-icon';

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return renderAgencyIcon(180);
}