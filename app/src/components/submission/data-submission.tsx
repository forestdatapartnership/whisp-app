'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key } from 'lucide-react'
import { useConfig } from '@/lib/config/config-context'
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

type Tab = 'geometry' | 'geoids'

export function DataSubmission() {
  const [activeTab, setActiveTab] = useState<Tab>('geometry')
  const [error, setError] = useState('')

  const { config } = useConfig()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasApiKey, isLoading: apiKeyLoading } = useApiKey()

  const maxFileSize = config?.maxUploadFileSizeKb ? config.maxUploadFileSizeKb * 1024 : undefined

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab)
    setError('')
  }

  if (authLoading || (isAuthenticated && apiKeyLoading)) {
    return <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
  }

  if (isAuthenticated && !hasApiKey) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <Key className="mx-auto mb-4 size-12 text-amber-400" strokeWidth={1.5} />
        <h2 className="mb-2 text-lg font-semibold text-text-primary">API Key Required</h2>
        <p className="mb-6 text-sm text-text-muted">
          You need to create an API key to submit analysis requests. Go to your account to create one.
        </p>
        <Button nativeButton={false} render={<Link href="/account" />}>
          Go to Account
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="geometry" className="flex-1">Submit Geometry</TabsTrigger>
          <TabsTrigger value="geoids" className="flex-1">Submit Geo IDs</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {activeTab === 'geometry' ? (
        <SubmitGeometry
          maxFileSize={maxFileSize}
          geometryLimit={config?.geometryLimit}
          asyncThreshold={config?.asyncThreshold}
          onError={setError}
        />
      ) : (
        <SubmitGeoIds
          maxFileSize={maxFileSize}
          geometryLimit={config?.geometryLimit}
          asyncThreshold={config?.asyncThreshold}
          onError={setError}
        />
      )}
    </div>
  )
}
