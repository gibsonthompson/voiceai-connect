import { NextResponse } from 'next/server'

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  console.log(`📋 DNS config requested for domain: ${domain || '(none)'}`)

  const DEFAULT_CONFIG = {
    a_record: '216.198.79.1',
    cname_record: 'cname.vercel-dns.com',
    source: 'fallback'
  }

  // If no domain provided or no Vercel token, return defaults
  if (!domain || !VERCEL_API_TOKEN) {
    return NextResponse.json(DEFAULT_CONFIG)
  }

  try {
    // Use /v6/domains/{domain}/config endpoint
    // CRITICAL: pass projectIdOrName so Vercel returns per-project CNAME
    const params = new URLSearchParams()
    if (VERCEL_TEAM_ID) params.set('teamId', VERCEL_TEAM_ID)
    if (VERCEL_PROJECT_ID) params.set('projectIdOrName', VERCEL_PROJECT_ID)
    const configUrl = `https://api.vercel.com/v6/domains/${domain}/config?${params.toString()}`

    console.log(`🔍 Fetching from: ${configUrl}`)

    const response = await fetch(configUrl, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
    })

    if (!response.ok) {
      console.log(`⚠️ Vercel returned ${response.status}`)
      return NextResponse.json(DEFAULT_CONFIG)
    }

    const data = await response.json()
    console.log('📋 Vercel config response:', JSON.stringify(data, null, 2))

    let aRecord = DEFAULT_CONFIG.a_record
    let cnameRecord = DEFAULT_CONFIG.cname_record

    // Parse recommendedIPv4: [{ rank: 1, value: ["216.198.79.1"] }]
    if (data.recommendedIPv4 && Array.isArray(data.recommendedIPv4)) {
      const preferred = data.recommendedIPv4.find(r => r.rank === 1)
      if (preferred?.value?.[0]) {
        aRecord = preferred.value[0]
        console.log(`✅ Found A record: ${aRecord}`)
      }
    }

    // Parse recommendedCNAME: [{ rank: 1, value: "xxx.vercel-dns-xxx.com" }]
    if (data.recommendedCNAME && Array.isArray(data.recommendedCNAME)) {
      const preferred = data.recommendedCNAME.find(r => r.rank === 1)
      if (preferred?.value) {
        cnameRecord = preferred.value
        console.log(`✅ Found CNAME: ${cnameRecord}`)
      }
    }

    return NextResponse.json({
      a_record: aRecord,
      cname_record: cnameRecord,
      source: (aRecord !== DEFAULT_CONFIG.a_record || cnameRecord !== DEFAULT_CONFIG.cname_record) ? 'vercel-api' : 'fallback',
      misconfigured: data.misconfigured,
      configured_by: data.configuredBy || null
    })

  } catch (error) {
    console.error('❌ DNS config fetch error:', error)
    return NextResponse.json(DEFAULT_CONFIG)
  }
}