import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

const VERCEL_IPS = [
  '76.76.21.21',
  '76.76.21.22', 
  '76.76.21.61',
  '76.76.21.93',
  '216.198.79.1'
]

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
    const dnsCheck = await checkDnsPropagation(domain)
    
    if (dnsCheck.propagated) {
      return NextResponse.json({
        verified: false,
        dnsConfigured: true,
        message: 'DNS configured! SSL certificate is being issued. Try again in 1-2 minutes.'
      })
    }

    // Get updated DNS records
    const dnsRecords = await getDnsRecords(domain)

    return NextResponse.json({
      verified: false,
      dnsConfigured: false,
      dns_records: dnsRecords,
      message: `DNS not yet propagated. Set A record to ${dnsRecords[0]?.value || '76.76.21.21'} and wait a few minutes.`
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

    if (data.verified === true) {
      return { verified: true }
    }

    return { verified: false, details: data.verification }

  } catch (error) {
    return { verified: false, error: error.message }
  }
}

async function checkDnsPropagation(domain) {
  try {
    const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`)
    const aData = await aResponse.json()
    
    if (aData.Answer) {
      const aRecord = aData.Answer.find(a => a.type === 1)
      if (aRecord && VERCEL_IPS.includes(aRecord.data)) {
        return { propagated: true, ip: aRecord.data }
      }
    }

    const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`)
    const cnameData = await cnameResponse.json()
    
    if (cnameData.Answer) {
      const cnameRecord = cnameData.Answer.find(a => a.type === 5)
      if (cnameRecord && cnameRecord.data.includes('vercel')) {
        return { propagated: true, value: cnameRecord.data }
      }
    }

    return { propagated: false }

  } catch (error) {
    return { propagated: false }
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