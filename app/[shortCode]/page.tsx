import { redirect } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default async function RedirectPage({
  params,
}: {
  params: { shortCode: string }
}) {
  const { data, error } = await supabase
    .from('shortened_urls')
    .select('original_url')
    .eq('short_code', params.shortCode)
    .single()

  if (error || !data) {
    redirect('/')  // Redirect to home if URL not found
  }

  // Update click count
  await supabase
    .from('shortened_urls')
    .update({ clicks: data.clicks + 1 })
    .eq('short_code', params.shortCode)

  redirect(data.original_url)
} 