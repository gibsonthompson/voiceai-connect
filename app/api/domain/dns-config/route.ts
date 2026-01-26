import { NextResponse } from 'next/server'

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  const records = [
    { type: 'A', name: '@', value: '76.76.21.21' },
    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' }
  ]

  // If a domain is provided and we have Vercel credentials, fetch project-specific values
  if (domain && VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
    try {
      const url = VERCEL_TEAM_ID
        ? `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}?teamId=${VERCEL_TEAM_ID}`
        : `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`DNS config for ${domain}:`, JSON.stringify(data, null, 2))
        
        if (data.verification && Array.isArray(data.verification)) {
          for (const record of data.verification) {
            if (record.type === 'A' && record.value && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(record.value)) {
              records[0].value = record.value
              console.log(`Found project-specific A record: ${record.value}`)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching DNS config:', error)
    }
  }

  return NextResponse.json({
    a_record: records[0].value,
    cname_record: records[1].value,
    source: records[0].value === '76.76.21.21' ? 'fallback' : 'vercel-api'
  })
}