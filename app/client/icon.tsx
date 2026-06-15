// app/client/icon.tsx
import { renderAgencyIcon } from '@/lib/agency-icon';

export const runtime = 'nodejs';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return renderAgencyIcon(192);
}