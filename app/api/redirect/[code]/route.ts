import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code

    // Get the original URL from Supabase
    const { data, error } = await supabase
      .from('shortened_urls')
      .select('original_url, clicks')
      .eq('short_code', shortCode)
      .single()

    if (error || !data) {
      console.error('URL lookup error:', error)
      return new NextResponse('Short URL not found', { status: 404 })
    }

    // Increment the clicks counter
    const { error: updateError } = await supabase
      .from('shortened_urls')
      .update({ clicks: (data.clicks || 0) + 1 })
      .eq('short_code', shortCode)

    if (updateError) {
      console.error('Click counter update error:', updateError)
    }

    // Make sure the URL starts with http:// or https://
    let redirectUrl = data.original_url
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = 'https://' + redirectUrl
    }

    // Redirect to the original URL
    return NextResponse.redirect(redirectUrl, { status: 301 })
  } catch (error) {
    console.error('Redirect error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 