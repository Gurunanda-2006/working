import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// Add the domains that we want to handle
const SHORTENER_DOMAINS = [
  'amz.in',
  'myn.co',
  'flp.co',
  'yt.co',
  'ig.co',
  'fb.co',
]

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = url.hostname.replace('www.', '')
  
  // Check if the hostname is one of our shortener domains
  if (SHORTENER_DOMAINS.includes(hostname)) {
    const shortCode = url.pathname.slice(1)
    
    if (shortCode) {
      try {
        // Get the original URL from Supabase
        const { data, error } = await supabase
          .from('shortened_urls')
          .select('original_url')
          .eq('short_code', shortCode)
          .eq('domain', hostname)
          .single()

        if (error || !data) {
          return NextResponse.redirect(new URL('/', request.url))
        }

        // Update click count
        await supabase
          .from('shortened_urls')
          .update({ clicks: data.clicks + 1 })
          .eq('short_code', shortCode)
          .eq('domain', hostname)

        // Redirect to original URL
        return NextResponse.redirect(new URL(data.original_url))
      } catch (error) {
        console.error('Redirect error:', error)
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
} 