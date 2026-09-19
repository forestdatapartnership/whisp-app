'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Key } from 'lucide-react'
import { useConfig } from '@/lib/config/config-context'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-context'
import { useApiKey } from '@/lib/auth/api-key-context'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SubmitGeometry } from './submit-geometry'
import { SubmitGeoIds } from './submit-geo-ids'
import { OpenResults } from './open-results'
import { clearLocalResults } from '@/lib/results/local-results'

type Tab = 'geometry' | 'geoids' | 'open'

export function DataSubmission() {
  const t = useTranslations('Submission')
  const tCommon = useTranslations('Common')
  const [activeTab, setActiveTab] = useState<Tab>('geometry')
  const [error, setError] = useState('')
  const [geometryFile, setGeometryFile] = useState<File | null>(null)

  const { config } = useConfig()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasApiKey, isLoading: apiKeyLoading } = useApiKey()

  useEffect(() => {
    clearLocalResults()
  }, [])

  const maxFileSize = config?.submission.maxRequestBodySizeKb ? config.submission.maxRequestBodySizeKb * 1024 : undefined
  const needsApiKey = isAuthenticated && !hasApiKey

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab)
    setError('')
    if (tab !== 'geometry') setGeometryFile(null)
  }

  if (authLoading || (isAuthenticated && apiKeyLoading)) {
    return <p className="py-8 text-center text-sm text-text-muted">{tCommon('loading')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full gap-0.5 p-1">
          <TabsTrigger value="geometry" className="flex-1 px-1.5 sm:px-3">{t('tabGeometry')}</TabsTrigger>
          <TabsTrigger value="geoids" className="flex-1 px-1.5 sm:px-3">{t('tabGeoIds')}</TabsTrigger>
          <TabsTrigger value="open" className="flex-1 px-1.5 sm:px-3">{t('openResults')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {activeTab === 'open' ? (
        <OpenResults
          onError={setError}
          onSubmitGeometry={(file) => {
            setError('')
            setGeometryFile(file)
            setActiveTab('geometry')
          }}
        />
      ) : needsApiKey ? (
        <Card className="text-center">
          <Key className="mx-auto mb-4 size-12 text-risk-medium" strokeWidth={1.5} />
          <h2 className="mb-2 text-lg font-semibold text-text-primary">{t('apiKeyRequiredTitle')}</h2>
          <p className="mb-6 text-sm text-text-muted">{t('apiKeyRequiredBody')}</p>
          <Button nativeButton={false} render={<Link href="/account" />}>
            {t('goToAccount')}
          </Button>
        </Card>
      ) : activeTab === 'geometry' ? (
        <SubmitGeometry
          maxFileSize={maxFileSize}
          geometryLimit={config?.submission.geometryLimit}
          asyncThreshold={config?.submission.asyncThreshold}
          onError={setError}
          initialFile={geometryFile}
        />
      ) : (
        <SubmitGeoIds
          maxFileSize={maxFileSize}
          geometryLimit={config?.submission.geometryLimit}
          asyncThreshold={config?.submission.asyncThreshold}
          onError={setError}
        />
      )}
    </div>
  )
}
