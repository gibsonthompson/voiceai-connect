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

    console.log(`✅ Verify domain request for agency ${agencyId}`)

    // Get agency's domain
    const { data: agency, error } = await supabase
      .from('agencies')
      .select('marketing_domain')
      .eq('id', agencyId)
      .single()

    if (error || !agency?.marketing_domain) {
      return NextResponse.json({ 
        verified: false,
        error: 'No custom domain configured'
      }, { status: 404 })
    }

    const domain = agency.marketing_domain
    console.log(`✅ Verifying domain "${domain}"`)

    // Get expected DNS values from Vercel
    const expectedDns = await fetchVercelDnsConfig(domain)
    console.log(`📋 Expected DNS: A=${expectedDns.aRecord}, CNAME=${expectedDns.cnameRecord}`)

    // Check Vercel domain status
    const vercelStatus = await checkVercelDomainStatus(domain)
    
    if (vercelStatus.verified) {
      await supabase
        .from('agencies')
        .update({ 
          domain_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', agencyId)

      return NextResponse.json({
        verified: true,
        domain,
        message: 'Domain verified and active!'
      })
    }

    // Check DNS propagation as backup
    const dnsCheck = await checkDnsPropagation(domain, expectedDns.aRecord)
    
    if (dnsCheck.propagated) {
      return NextResponse.json({
        verified: false,
        dnsConfigured: true,
        message: 'DNS configured! SSL certificate is being issued. Try again in 1-2 minutes.'
      })
    }

    return NextResponse.json({
      verified: false,
      dnsConfigured: false,
      expected_a_record: expectedDns.aRecord,
      expected_cname: expectedDns.cnameRecord,
      message: `DNS not yet propagated. Set A record to ${expectedDns.aRecord} and CNAME (www) to ${expectedDns.cnameRecord}. Allow up to 48 hours for propagation.`
    })

  } catch (error) {
    console.error('Verify domain error:', error)
    return NextResponse.json({ 
      verified: false,
      error: error.message 
    }, { status: 500 })
  }
}

async function checkVercelDomainStatus(domain) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return { verified: false, error: 'Vercel not configured' }
  }

  try {
    const url = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
    })

    const data = await response.json()
    console.log('Vercel domain status:', JSON.stringify(data, null, 2))

    if (data.verified === true) {
      return { verified: true }
    }

    return { verified: false, details: data.verification }

  } catch (error) {
    return { verified: false, error: error.message }
  }
}

async function checkDnsPropagation(domain, expectedARecord) {
  // List of valid Vercel IPs (including project-specific ones)
  const VERCEL_IPS = [
    '76.76.21.21',
    '76.76.21.22', 
    '76.76.21.61',
    '76.76.21.93',
    expectedARecord // Include the expected project-specific IP
  ]

  try {
    // Check A record via Google DNS
    const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`)
    const aData = await aResponse.json()
    
    if (aData.Answer) {
      const aRecord = aData.Answer.find(a => a.type === 1)
      if (aRecord && VERCEL_IPS.includes(aRecord.data)) {
        console.log(`✅ A record found: ${aRecord.data}`)
        return { propagated: true, ip: aRecord.data }
      }
    }

    // Check CNAME as fallback
    const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`)
    const cnameData = await cnameResponse.json()
    
    if (cnameData.Answer) {
      const cnameRecord = cnameData.Answer.find(a => a.type === 5)
      if (cnameRecord && cnameRecord.data.includes('vercel')) {
        console.log(`✅ CNAME found: ${cnameRecord.data}`)
        return { propagated: true, value: cnameRecord.data }
      }
    }

    console.log('⏳ DNS not yet propagated')
    return { propagated: false }

  } catch (error) {
    console.error('DNS check error:', error)
    return { propagated: false }
  }
}

/**
 * Fetch project-specific DNS values from Vercel
 * Uses /v6/domains/{domain}/config endpoint
 */
async function fetchVercelDnsConfig(domain) {
  const DEFAULT_CONFIG = {
    aRecord: '76.76.21.21',
    cnameRecord: 'cname.vercel-dns.com',
    source: 'fallback'
  }

  if (!VERCEL_API_TOKEN) {
    return DEFAULT_CONFIG
  }

  try {
    const configUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v6/domains/${domain}/config?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v6/domains/${domain}/config`

    const response = await fetch(configUrl, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
    })

    if (!response.ok) {
      return DEFAULT_CONFIG
    }

    const data = await response.json()

    let aRecord = DEFAULT_CONFIG.aRecord
    let cnameRecord = DEFAULT_CONFIG.cnameRecord

    // Parse recommendedIPv4: [{ rank: 1, value: ["216.198.79.1"] }]
    if (data.recommendedIPv4 && Array.isArray(data.recommendedIPv4)) {
      const preferred = data.recommendedIPv4.find(r => r.rank === 1)
      if (preferred?.value?.[0]) {
        aRecord = preferred.value[0]
      }
    }

    // Parse recommendedCNAME: [{ rank: 1, value: "xxx.vercel-dns-xxx.com" }]
    if (data.recommendedCNAME && Array.isArray(data.recommendedCNAME)) {
      const preferred = data.recommendedCNAME.find(r => r.rank === 1)
      if (preferred?.value) {
        cnameRecord = preferred.value
      }
    }

    return { aRecord, cnameRecord, source: 'vercel-api' }

  } catch (error) {
    console.error('Failed to fetch DNS config:', error)
    return DEFAULT_CONFIG
  }
}