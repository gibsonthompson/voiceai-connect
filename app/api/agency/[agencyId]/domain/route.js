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
    const { agencyId } = await params
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

    // Add domain to Vercel (both apex and www)
    let vercelAdded = false
    if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
      // Add apex domain
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
        console.log('Vercel apex response:', JSON.stringify(vercelData, null, 2))

        if (vercelResponse.ok || vercelData.error?.code === 'domain_already_in_use') {
          vercelAdded = true
        }
      } catch (err) {
        console.error('Vercel API error (apex):', err)
      }

      // Add www subdomain
      try {
        const vercelUrl = VERCEL_TEAM_ID
          ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}`
          : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`

        const wwwResponse = await fetch(vercelUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: `www.${normalizedDomain}` })
        })

        const wwwData = await wwwResponse.json()
        console.log('Vercel www response:', JSON.stringify(wwwData, null, 2))
      } catch (err) {
        console.error('Vercel API error (www):', err)
      }
    } else {
      console.log('⚠️ Vercel credentials not configured:', {
        hasToken: !!VERCEL_API_TOKEN,
        hasProjectId: !!VERCEL_PROJECT_ID
      })
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

    // Fetch project-specific DNS records from Vercel
    const dnsConfig = await fetchVercelDnsConfig(normalizedDomain)

    return NextResponse.json({
      success: true,
      domain: normalizedDomain,
      vercel_added: vercelAdded,
      dns_config: {
        a_record: dnsConfig.aRecord,
        cname_record: dnsConfig.cnameRecord,
        source: dnsConfig.source
      }
    })

  } catch (error) {
    console.error('Add domain error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { agencyId } = await params

    console.log(`🗑️ DELETE request for agency ${agencyId}`)

    // Get current domain
    const { data: agency, error: fetchError } = await supabase
      .from('agencies')
      .select('marketing_domain')
      .eq('id', agencyId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    if (!agency?.marketing_domain) {
      return NextResponse.json({ error: 'No domain to remove' }, { status: 404 })
    }

    const domain = agency.marketing_domain
    console.log(`🗑️ Removing domain "${domain}" for agency ${agencyId}`)

    // Remove from Vercel (both apex and www)
    if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
      // Remove apex
      try {
        const vercelUrl = VERCEL_TEAM_ID
          ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?teamId=${VERCEL_TEAM_ID}`
          : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`

        await fetch(vercelUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
        })
        console.log('✅ Apex domain removed from Vercel')
      } catch (err) {
        console.error('Vercel delete error (apex):', err)
      }

      // Remove www
      try {
        const wwwUrl = VERCEL_TEAM_ID
          ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/www.${domain}?teamId=${VERCEL_TEAM_ID}`
          : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/www.${domain}`

        await fetch(wwwUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
        })
        console.log('✅ WWW domain removed from Vercel')
      } catch (err) {
        console.error('Vercel delete error (www):', err)
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
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to remove domain' }, { status: 500 })
    }

    console.log(`✅ Domain removed: ${domain}`)
    return NextResponse.json({ success: true, removed_domain: domain })

  } catch (error) {
    console.error('Remove domain error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Fetch project-specific DNS values from Vercel
 * CRITICAL: Uses /v6/domains/{domain}/config endpoint
 * This returns recommendedIPv4 and recommendedCNAME with actual values
 */
async function fetchVercelDnsConfig(domain) {
  const DEFAULT_CONFIG = {
    aRecord: '76.76.21.21',
    cnameRecord: 'cname.vercel-dns.com',
    source: 'fallback'
  }

  if (!VERCEL_API_TOKEN) {
    console.log('⚠️ No Vercel token, using fallback DNS values')
    return DEFAULT_CONFIG
  }

  try {
    // CORRECT ENDPOINT: /v6/domains/{domain}/config
    // Returns: recommendedIPv4, recommendedCNAME
    const configUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v6/domains/${domain}/config?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v6/domains/${domain}/config`

    console.log(`🔍 Fetching DNS config from: ${configUrl}`)

    const response = await fetch(configUrl, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
    })

    const data = await response.json()
    console.log('📋 Vercel DNS config response:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.log(`⚠️ Config endpoint returned ${response.status}`)
      return DEFAULT_CONFIG
    }

    let aRecord = DEFAULT_CONFIG.aRecord
    let cnameRecord = DEFAULT_CONFIG.cnameRecord

    // Parse recommendedIPv4: [{ rank: 1, value: ["216.198.79.1"] }]
    if (data.recommendedIPv4 && Array.isArray(data.recommendedIPv4)) {
      const preferred = data.recommendedIPv4.find(r => r.rank === 1)
      if (preferred?.value?.[0]) {
        aRecord = preferred.value[0]
        console.log(`✅ Found project-specific A record: ${aRecord}`)
      }
    }

    // Parse recommendedCNAME: [{ rank: 1, value: "xxx.vercel-dns-xxx.com" }]
    if (data.recommendedCNAME && Array.isArray(data.recommendedCNAME)) {
      const preferred = data.recommendedCNAME.find(r => r.rank === 1)
      if (preferred?.value) {
        cnameRecord = preferred.value
        console.log(`✅ Found project-specific CNAME: ${cnameRecord}`)
      }
    }

    return {
      aRecord,
      cnameRecord,
      source: aRecord !== DEFAULT_CONFIG.aRecord ? 'vercel-api' : 'fallback',
      misconfigured: data.misconfigured
    }

  } catch (error) {
    console.error('❌ Failed to fetch Vercel DNS config:', error)
    return DEFAULT_CONFIG
  }
}