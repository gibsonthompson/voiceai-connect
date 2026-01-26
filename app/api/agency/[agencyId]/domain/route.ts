import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

export async function POST(request, { params }) {
  try {
    const { agencyId } = params
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Normalize domain
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .trim()

    console.log(`🌐 Adding domain "${normalizedDomain}" for agency ${agencyId}`)

    // Validate domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/
    if (!domainRegex.test(normalizedDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Check if domain is already used by another agency
    const { data: existing } = await supabase
      .from('agencies')
      .select('id, name')
      .eq('marketing_domain', normalizedDomain)
      .neq('id', agencyId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ 
        error: 'Domain is already in use by another agency' 
      }, { status: 400 })
    }

    // Add domain to Vercel
    let vercelAdded = false
    if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
      try {
        const vercelUrl = VERCEL_TEAM_ID
          ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
          : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`

        const vercelResponse = await fetch(vercelUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: normalizedDomain })
        })

        const vercelData = await vercelResponse.json()
        console.log('Vercel response:', JSON.stringify(vercelData, null, 2))

        if (vercelResponse.ok || vercelData.error?.code === 'domain_already_in_use') {
          vercelAdded = true
        }
      } catch (err) {
        console.error('Vercel API error:', err)
      }
    }

    // Update database
    const { data: agency, error: dbError } = await supabase
      .from('agencies')
      .update({
        marketing_domain: normalizedDomain,
        domain_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save domain' }, { status: 500 })
    }

    // Fetch DNS records from Vercel
    const dnsRecords = await getDnsRecords(normalizedDomain)

    return NextResponse.json({
      success: true,
      domain: normalizedDomain,
      vercel_added: vercelAdded,
      dns_records: dnsRecords,
      dns_config: {
        a_record: dnsRecords[0]?.value || '76.76.21.21',
        cname_record: dnsRecords[1]?.value || 'cname.vercel-dns.com'
      }
    })

  } catch (error) {
    console.error('Add domain error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { agencyId } = params

    // Get current domain
    const { data: agency } = await supabase
      .from('agencies')
      .select('marketing_domain')
      .eq('id', agencyId)
      .single()

    if (!agency?.marketing_domain) {
      return NextResponse.json({ error: 'No domain to remove' }, { status: 404 })
    }

    const domain = agency.marketing_domain
    console.log(`🗑️ Removing domain "${domain}" for agency ${agencyId}`)

    // Remove from Vercel
    if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
      try {
        const vercelUrl = VERCEL_TEAM_ID
          ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?teamId=${VERCEL_TEAM_ID}`
          : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`

        await fetch(vercelUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
        })
        console.log('✅ Domain removed from Vercel')
      } catch (err) {
        console.error('Vercel delete error:', err)
      }
    }

    // Update database
    const { error: dbError } = await supabase
      .from('agencies')
      .update({
        marketing_domain: null,
        domain_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId)

    if (dbError) {
      return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 })
    }

    return NextResponse.json({ success: true, removed_domain: domain })

  } catch (error) {
    console.error('Remove domain error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function getDnsRecords(domain) {
  const records = [
    { type: 'A', name: '@', value: '76.76.21.21' },
    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' }
  ]

  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return records
  }

  try {
    const url = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.verification && Array.isArray(data.verification)) {
        for (const record of data.verification) {
          if (record.type === 'A' && record.value && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(record.value)) {
            records[0].value = record.value
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching DNS records:', error)
  }

  return records
}