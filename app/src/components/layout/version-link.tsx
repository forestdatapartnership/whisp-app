'use client'

import { Link } from '@/components/ui/link'
import { useConfig } from '@/lib/config/config-context'

export function VersionLink() {
  const { config } = useConfig()
  const version = config?.app.version
  const pythonVersion = config?.app.openforisWhispVersion

  if (!config || !version || !pythonVersion) return null

  return (
    <span className="text-text-dim">
      <span >App</span>
      {' '}
      <Link href={`https://github.com/forestdatapartnership/whisp-app/releases/tag/v${version}`} target="_blank">
        v{version}
      </Link>
      {' · '}
      <span>openforis-whisp</span>
      {' '}
      <Link href={`https://pypi.org/project/openforis-whisp/${pythonVersion}`} target="_blank">
        v{pythonVersion}
      </Link>
    </span>
  )
} 