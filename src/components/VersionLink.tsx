'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAppVersion } from '@/lib/utils/configUtils'
import { useConfig } from '@/lib/contexts/ConfigContext'

export default function VersionLink() {
  const version = getAppVersion()
  const { config } = useConfig()
  const pythonVersion = config.WHISP_PYTHON_VERSION || '...'
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
      <span className="text-gray-400">App version</span>
      {' '}
      <Link href={versionHref} target="_blank" className="text-blue-500">
        v{version}
      </Link>
      {' · '}
      <span className="text-gray-400">Powered by Analysis Engine</span>
      {' '}
      <Link href={`https://pypi.org/project/openforis-whisp/${pythonVersion}`} target="_blank" className="text-blue-500">
        v{pythonVersion}
      </Link>
    </>
  )
} 