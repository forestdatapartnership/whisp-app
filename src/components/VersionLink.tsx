'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAppVersion } from '@/lib/utils'

export default function VersionLink() {
  const version = getAppVersion()
  const milestonesUrl = 'https://github.com/forestdatapartnership/whisp-app/milestones'
  const releasesUrl = 'https://github.com/forestdatapartnership/whisp-app/releases'
  const specificReleaseUrl = `https://github.com/forestdatapartnership/whisp-app/releases/tag/v${version}`
  const [versionHref, setVersionHref] = useState<string>(milestonesUrl)

  useEffect(() => {
    if (!version) return

    const storageKey = `whisp-release-v${version}`
    try {
      const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(storageKey) : null
      if (cached && /^https?:\/\//.test(cached)) {
        setVersionHref(cached)
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
          setVersionHref(specificReleaseUrl)
          try { window.sessionStorage.setItem(storageKey, specificReleaseUrl) } catch {}
        } else {
          setVersionHref(milestonesUrl)
          try { window.sessionStorage.setItem(storageKey, milestonesUrl) } catch {}
        }
      })
      .catch(() => {
        try { window.sessionStorage.setItem(storageKey, milestonesUrl) } catch {}
      })
    return () => {
      cancelled = true
    }
  }, [version, specificReleaseUrl])

  return (
    <>
      <Link href={versionHref} target="_blank" className="text-blue-500">
        v{version}
      </Link>
      {' · '}
      <Link href={releasesUrl} target="_blank" className="text-blue-500">
        Release History
      </Link>
    </>
  )
} 