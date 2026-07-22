'use client'

import { useState } from 'react'
import Link from 'next/link'
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

type Tab = 'geometry' | 'geoids' | 'open'

export function DataSubmission() {
  const [activeTab, setActiveTab] = useState<Tab>('geometry')
  const [error, setError] = useState('')
  const [geometryFile, setGeometryFile] = useState<File | null>(null)

  const { config } = useConfig()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasApiKey, isLoading: apiKeyLoading } = useApiKey()

  const maxFileSize = config?.submission.maxRequestBodySizeKb ? config.submission.maxRequestBodySizeKb * 1024 : undefined
  const needsApiKey = isAuthenticated && !hasApiKey

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab)
    setError('')
    if (tab !== 'geometry') setGeometryFile(null)
  }

  if (authLoading || (isAuthenticated && apiKeyLoading)) {
    return <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="geometry" className="flex-1">Submit Geometry</TabsTrigger>
          <TabsTrigger value="geoids" className="flex-1">Submit Geo IDs</TabsTrigger>
          <TabsTrigger value="open" className="flex-1">Open GeoJSON Results</TabsTrigger>
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
          <Key className="mx-auto mb-4 size-12 text-amber-400" strokeWidth={1.5} />
          <h2 className="mb-2 text-lg font-semibold text-text-primary">API Key Required</h2>
          <p className="mb-6 text-sm text-text-muted">
            You need to create an API key to submit analysis requests. Go to your account to create one.
          </p>
          <Button nativeButton={false} render={<Link href="/account" />}>
            Go to Account
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
