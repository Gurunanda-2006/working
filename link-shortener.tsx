"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { supabase } from '@/lib/supabase'

const LinkShortener = () => {
  const [longUrl, setLongUrl] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateShortDomain = (domain: string): string => {
    // Common domain shortening patterns
    const domainMappings: { [key: string]: string } = {
      'amazon.in': 'amz.in',
      'amazon.com': 'amz.com',
      'amazon.co.uk': 'amz.uk',
      'amazon.de': 'amz.de',
      'amazon.co.jp': 'amz.jp',
      'amazon': 'amz.in',  // Default for Amazon
      'myntra.com': 'myn.co',
      'flipkart.com': 'flp.co',
      'youtube.com': 'yt.co',
      'instagram.com': 'ig.co',
      'facebook.com': 'fb.co',
    }

    // Remove www. and get the domain name
    const cleanDomain = domain.toLowerCase().replace('www.', '')
    
    // Try exact domain match first
    if (domainMappings[cleanDomain]) {
      return domainMappings[cleanDomain]
    }
    
    // Try matching the base domain
    const baseDomain = cleanDomain.split('.')[0]
    if (domainMappings[baseDomain]) {
      return domainMappings[baseDomain]
    }
    
    // Fallback to first 3 letters
    return `${baseDomain.slice(0, 3)}.co`
  }

  const generateShortCode = (): string => {
    // Generate a shorter code (4 characters) using alphanumeric characters
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('')
  }

  const shortenUrl = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
        throw new Error('Please enter a valid URL starting with http:// or https://')
      }

      const urlObj = new URL(longUrl)
      const domain = urlObj.hostname
      const shortDomain = generateShortDomain(domain)
      const shortCode = generateShortCode()
      
      // Create short URL with https:// prefix for display
      const generatedShortUrl = `https://${shortDomain}/${shortCode}`

      // Insert new URL directly without checking for existing
      const { error: insertError } = await supabase
        .from('shortened_urls')
        .insert([
          {
            original_url: longUrl,
            short_url: generatedShortUrl,
            short_code: shortCode,
            domain: shortDomain
          }
        ])

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error('Failed to save shortened URL')
      }

      setShortUrl(generatedShortUrl)
    } catch (error) {
      console.error('Error details:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setShortUrl('')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4">
      <div className="bg-gray-800 bg-opacity-40 backdrop-blur-[2px] rounded-xl p-8 shadow-2xl border border-gray-600">
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        <Input
          type="url"
          placeholder="Enter long URL"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          className="mb-6 text-lg py-6"
        />
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button onClick={shortenUrl} disabled={!longUrl || isLoading} className="w-full mb-6 text-xl py-7">
            {isLoading ? "Shortening..." : "Shorten"}
          </Button>
        </motion.div>
        {shortUrl && (
          <div className="flex items-center space-x-4">
            <Input value={shortUrl} readOnly className="flex-grow text-lg py-6" />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button onClick={copyToClipboard} className="text-lg py-6 px-8">
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkShortener

