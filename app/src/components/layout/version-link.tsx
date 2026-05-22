'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/components/ui/link'
import { useConfig } from '@/lib/config/config-context'

export function VersionLink() {
  const { config } = useConfig()
  const version = config?.appVersion
  const pythonVersion = config?.whispPythonVersion
  const releaseUrl = version ? `https://github.com/forestdatapartnership/whisp-app/releases/tag/v${version}` : ''
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

  if (!config || !version || !pythonVersion) return null

  return (
    <span className="text-text-dim">
      <span >App</span>
      {' '}
      <Link href={versionHref} target="_blank">
        v{version}
      </Link>
      {' · '}
      <span>whisp-py</span>
      {' '}
      <Link href={`https://pypi.org/project/openforis-whisp/${pythonVersion}`} target="_blank">
        v{pythonVersion}
      </Link>
    </span>
  )
} 