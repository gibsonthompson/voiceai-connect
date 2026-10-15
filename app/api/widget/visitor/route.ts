import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/* ===========================================================================
   POST /api/widget/visitor
   Records the name + email the public FAQ widget collects before a prospect
   starts chatting, as a single leading row in widget_chat_log, so the admin
   inbox conversation for that session shows who the visitor is instead of an
   anonymous chat with minimal context.

   Best-effort and defensive: it never throws into the request path (a failure
   here must never block the chat), and if the origin columns are not migrated
   yet it falls back to a bare 3-column insert, same as the chat logger.
   =========================================================================== */

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name, contact, reason } = await req.json();
    const sid = typeof sessionId === 'string' ? sessionId.trim() : '';
    const nm = typeof name === 'string' ? name.trim() : '';
    const ct = typeof contact === 'string' ? contact.trim() : '';

    if (!sid || (!nm && !ct)) {
      return NextResponse.json({ error: 'sessionId and name/contact required' }, { status: 400 });
    }

    const header = typeof reason === 'string' && reason.trim() ? reason.trim() : 'New website chat';
    const content = `${header}\nVisitor: ${nm || 'Not given'}\nEmail: ${ct || 'Not given'}`;
    const base = { session_id: sid.slice(0, 100), role: 'user', content: content.slice(0, 8000) };

    try {
      const supa = createAdminClient();
      const withOrigin = { ...base, user_type: 'prospect', agency_id: null, source: 'marketing' };
      const { error } = await supa.from('widget_chat_log').insert(withOrigin);
      if (error) {
        await supa.from('widget_chat_log').insert(base); // origin columns not migrated yet
      }
    } catch (e: any) {
      console.error('widget visitor log failed (non-blocking):', e?.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('widget visitor route error:', err);
    // Never surface an error to the widget: identity capture is best-effort.
    return NextResponse.json({ success: true });
  }
}
