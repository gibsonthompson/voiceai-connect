import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SAMPLE_SITES, getSampleSite } from '@/lib/sample-sites';

// ============================================================================
// SAMPLE BUSINESS SITE (one per industry).
//
// Server-rendered on purpose: the VoiceAI Connect scraper (Jina Reader) reads
// the rendered HTML/markdown, so all content (services, hours, staff, service
// area, contact) is in plain semantic markup here, not injected client-side.
// Paste https://<host>/sample-site/<slug> into a client's website field to test
// scraping, or open it directly in a demo/video.
// ============================================================================

export const dynamicParams = false;

export function generateStaticParams() {
  return SAMPLE_SITES.map((s) => ({ industry: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const { industry } = await params;
  const site = getSampleSite(industry);
  if (!site) return { title: 'Sample Site' };
  return {
    title: `${site.name} | ${site.industry} in ${site.address.split(',').slice(-2, -1)[0]?.trim() || 'your area'}`,
    description: `${site.name} - ${site.tagline} Call ${site.phone}.`,
  };
}

function hoursLabel(h: { open?: string; close?: string; closed?: boolean }): string {
  return h.closed ? 'Closed' : `${h.open} - ${h.close}`;
}

export default async function SampleSitePage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const site = getSampleSite(industry);
  if (!site) notFound();

  const accent = site.accent;
  const city = site.address.split(',')[1]?.trim() || '';

  return (
    <main style={{ color: '#1f2937', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {site.name.charAt(0)}
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>{site.name}</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 14 }}>
            <a href="#services" style={{ color: '#4b5563', textDecoration: 'none' }}>Services</a>
            <a href="#team" style={{ color: '#4b5563', textDecoration: 'none' }}>Team</a>
            <a href="#hours" style={{ color: '#4b5563', textDecoration: 'none' }}>Hours</a>
            <a href="#contact" style={{ color: '#4b5563', textDecoration: 'none' }}>Contact</a>
            <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} style={{ background: accent, color: '#fff', padding: '9px 16px', borderRadius: 999, fontWeight: 600, textDecoration: 'none' }}>Call {site.phone}</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${accent}14, #ffffff 70%)`, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 20px 56px' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12, fontWeight: 700, color: accent, margin: 0 }}>
            {site.industry} in {city}
          </p>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: '14px 0 0', fontWeight: 800, maxWidth: 760 }}>{site.tagline}</h1>
          <p style={{ fontSize: 18, color: '#4b5563', margin: '18px 0 0', maxWidth: 640 }}>
            {site.name} has proudly served {city} and the surrounding area since {site.established}.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} style={{ background: accent, color: '#fff', padding: '14px 26px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Call {site.phone}</a>
            <a href="#services" style={{ border: `2px solid ${accent}`, color: accent, padding: '12px 26px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>View Services</a>
          </div>
          {site.emergencyLine && (
            <p style={{ marginTop: 22, fontSize: 14, color: '#b91c1c', fontWeight: 600 }}>{site.emergencyLine}</p>
          )}
        </div>
      </section>

      {/* About */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>About {site.name}</h2>
        {site.about.map((p, i) => (
          <p key={i} style={{ fontSize: 17, color: '#374151', lineHeight: 1.7, marginTop: 16, maxWidth: 820 }}>{p}</p>
        ))}
      </section>

      {/* Services */}
      <section id="services" style={{ background: '#f9fafb', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Our Services</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Upfront pricing. No surprises.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18, marginTop: 28 }}>
            {site.services.map((s) => (
              <div key={s.name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{s.name}</h3>
                  <span style={{ color: accent, fontWeight: 700, whiteSpace: 'nowrap' }}>{s.price}</span>
                </div>
                <p style={{ color: '#4b5563', marginTop: 10, lineHeight: 1.6 }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Meet the Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginTop: 28 }}>
          {site.team.map((m) => (
            <div key={m.name} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: 999, background: `${accent}1f`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
                {m.name.charAt(0)}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '14px 0 2px' }}>{m.name}</h3>
              <p style={{ color: accent, fontWeight: 600, fontSize: 14, margin: 0 }}>{m.role}</p>
              <p style={{ color: '#4b5563', marginTop: 10, lineHeight: 1.6, fontSize: 15 }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hours + Service area */}
      <section id="hours" style={{ background: '#f9fafb', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Hours</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <tbody>
                {site.hours.map((h) => (
                  <tr key={h.day} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th scope="row" style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>{h.day}</th>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: h.closed ? '#9ca3af' : '#111827' }}>{hoursLabel(h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Service Area</h2>
            <p style={{ color: '#6b7280', marginTop: 8 }}>We proudly serve:</p>
            <ul style={{ marginTop: 16, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {site.serviceAreas.map((a) => (
                <li key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: accent, display: 'inline-block' }} /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>What Customers Say</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 28 }}>
          {site.testimonials.map((t, i) => (
            <blockquote key={i} style={{ margin: 0, border: '1px solid #e5e7eb', borderRadius: 14, padding: 24, background: '#fff' }}>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: '#1f2937', margin: 0 }}>&ldquo;{t.quote}&rdquo;</p>
              <footer style={{ marginTop: 14, color: '#6b7280', fontWeight: 600 }}>{t.name}, {t.location}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#f9fafb', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 20px' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Frequently Asked Questions</h2>
          <div style={{ marginTop: 24 }}>
            {site.faqs.map((f, i) => (
              <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{f.q}</h3>
                <p style={{ color: '#4b5563', marginTop: 10, lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / footer */}
      <footer id="contact" style={{ background: '#0f172a', color: '#e2e8f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 20px' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: '#fff' }}>Contact {site.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28, marginTop: 28 }}>
            <div>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>Phone</h3>
              <p style={{ marginTop: 8, fontSize: 18 }}><a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} style={{ color: '#fff', textDecoration: 'none' }}>{site.phone}</a></p>
            </div>
            <div>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>Email</h3>
              <p style={{ marginTop: 8, fontSize: 18 }}><a href={`mailto:${site.email}`} style={{ color: '#fff', textDecoration: 'none' }}>{site.email}</a></p>
            </div>
            <div>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: 0 }}>Address</h3>
              <p style={{ marginTop: 8, fontSize: 16, lineHeight: 1.5 }}>{site.address}</p>
            </div>
          </div>
          <p style={{ marginTop: 40, color: '#64748b', fontSize: 13 }}>
            &copy; {new Date().getFullYear()} {site.name}. Established {site.established}. This is a sample website used for demonstration.
          </p>
        </div>
      </footer>
    </main>
  );
}