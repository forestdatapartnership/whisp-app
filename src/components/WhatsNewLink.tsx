'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Props = { version: string }

export default function WhatsNewLink({ version }: Props) {
  const milestonesUrl = 'https://github.com/forestdatapartnership/whisp-app/milestones'
  const releaseUrl = `https://github.com/forestdatapartnership/whisp-app/releases/tag/v${version}`
  const [href, setHref] = useState<string>(milestonesUrl)

  useEffect(() => {
    if (!version) return

    const storageKey = `whisp-release-v${version}`
    try {
      const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(storageKey) : null
      if (cached && /^https?:\/\//.test(cached)) {
        setHref(cached)
        return
      }
    } catch {}

    // call api to check if release notes are available to avoid cors issues
    const apiUrl = `https://api.github.com/repos/forestdatapartnership/whisp-app/releases/tags/v${version}`
    let cancelled = false
    fetch(apiUrl)
      .then((res) => {
        if (cancelled) return
        if (res.ok) {
          setHref(releaseUrl)
          try { window.sessionStorage.setItem(storageKey, releaseUrl) } catch {}
        } else {
          setHref(milestonesUrl)
          try { window.sessionStorage.setItem(storageKey, milestonesUrl) } catch {}
        }
      })
      .catch(() => {
        try { window.sessionStorage.setItem(storageKey, milestonesUrl) } catch {}
      })
    return () => {
      cancelled = true
    }
  }, [version, releaseUrl])

  return (
    <Link href={href} target="_blank" className="text-blue-500">
      What's New?
    </Link>
  )
} 