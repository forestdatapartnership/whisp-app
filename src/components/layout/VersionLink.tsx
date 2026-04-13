'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useConfig } from '@/lib/contexts/ConfigContext'

export default function VersionLink() {
  const { config } = useConfig()
  const version = config.appVersion
  const pythonVersion = config.whispPythonVersion
  const releaseUrl = `https://github.com/forestdatapartnership/whisp-app/releases/tag/v${version}`
  const milestonesUrl = 'https://github.com/forestdatapartnership/whisp-app/milestones'
  const [versionHref, setVersionHref] = useState(milestonesUrl)

  useEffect(() => {
    if (!version) return
    const cacheKey = `whisp-release-v${version}`
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) { setVersionHref(cached); return }
    } catch {}
    fetch(`https://api.github.com/repos/forestdatapartnership/whisp-app/releases/tags/v${version}`)
      .then((res) => {
        if (res.ok) {
          setVersionHref(releaseUrl)
          try { sessionStorage.setItem(cacheKey, releaseUrl) } catch {}
        } else {
          setVersionHref(milestonesUrl)
        }
      })
      .catch(() => setVersionHref(milestonesUrl))
  }, [version, releaseUrl])

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