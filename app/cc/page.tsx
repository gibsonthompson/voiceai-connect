import { redirect } from 'next/navigation';

// /cc -> the call-center dashboard home. (Access control for non-call-center
// users is handled by the /cc layout shell.)
export default function CallCenterIndex() {
  redirect('/cc/dashboard');
}
