'use client'
import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import Alert from '@/components/Alert';
import { Tabs } from '@/components/Tabs';
import { Buttons } from '@/components/Buttons';
import Image from 'next/image';
import { useSafeRouterPush } from '@/lib/hooks/useSafeRouterPush';
import { createApiHeaders } from '@/lib/secureApiUtils';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { getAssetRegistryDefaultCatalog, getAssetRegistryDefaultCollection } from '@/lib/utils/configUtils';
import AnalysisOptions, { AnalysisOptionsValue, DEFAULT_ANALYSIS_OPTIONS } from '@/components/AnalysisOptions';
import { SystemCode } from '@/types/systemCodes';
import type { CatalogInfo, CollectionInfo } from '@/types/assetRegistry';
import { fetchCatalogs, fetchCollections } from '@/lib/assetRegistry/actions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Database, ChevronDown } from 'lucide-react';

interface SubmitGeoIdsProps {
    asyncThreshold: number;
    maxGeometryLimit: number;
}

const SubmitGeoIds: React.FC<SubmitGeoIdsProps> = ({ 
    asyncThreshold,
    maxGeometryLimit
}) => {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [isDisabled, setIsDisabled] = useState<boolean>(true);
    const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsValue>(DEFAULT_ANALYSIS_OPTIONS);
    const [catalogs, setCatalogs] = useState<CatalogInfo[]>([]);
    const [collections, setCollections] = useState<CollectionInfo[]>([]);
    const [catalog, setCatalog] = useState<string>('');
    const [collection, setCollection] = useState<string>('');
    const [registryLoading, setRegistryLoading] = useState<boolean>(false);
    const [catalogSectionOpen, setCatalogSectionOpen] = useState<boolean>(true);

    const { error, geoIds } = useStore();
    const { apiKey } = useApiKey();
    const { config } = useConfig();
    const safePush = useSafeRouterPush();
    const clearError = () => useStore.setState({ error: "" });

    useEffect(() => {
        const hasGeoIds = geoIds?.some(geoId => geoId.trim() !== '');
        setIsDisabled(!hasGeoIds);
    }, [geoIds]);

    useEffect(() => {
        setRegistryLoading(true);
        fetchCatalogs()
            .then(list => {
                setCatalogs(list);
                if (list.length > 0 && !catalog) {
                    const defaultCatalogId = getAssetRegistryDefaultCatalog(config);
                    const defaultCat = defaultCatalogId
                        ? list.find((c: CatalogInfo) => c.id === defaultCatalogId) ?? list[0]
                        : list[0];
                    setCatalog(defaultCat.id);
                }
            })
            .finally(() => setRegistryLoading(false));
    }, [config]);

    useEffect(() => {
        if (!catalog) return;
        setRegistryLoading(true);
        fetchCollections(catalog)
            .then(list => {
                setCollections(list);
                if (list.length > 0 && !collection) {
                    const defaultCollectionId = getAssetRegistryDefaultCollection(config);
                    const defaultColl = defaultCollectionId
                        ? list.find((c: CollectionInfo) => c.id === defaultCollectionId) ?? list[0]
                        : list[0];
                    setCollection(defaultColl.id);
                }
            })
            .finally(() => setRegistryLoading(false));
    }, [catalog, config]);

    const analyze = async () => {
        useStore.setState({ isLoading: true, error: '' });
        
        if (!apiKey) {
            useStore.setState({ error: "Failed to get API key for authentication", isLoading: false });
            return;
        }

        if (geoIds) {
            if (!geoIds.some(geoId => geoId.trim() !== '')) {
                useStore.setState({ error: 'Please enter at least one Geo ID or upload a file.', isLoading: false });
            } else {
                const cleanGeoIds = geoIds.filter(geoId => geoId.trim() !== '');
                const count = cleanGeoIds.length;
                
                if (count > maxGeometryLimit) {
                    useStore.setState({ 
                        error: `Too many Geo IDs. Maximum allowed is ${maxGeometryLimit} features.`, 
                        isLoading: false 
                    });
                    return;
                }
                
                const shouldUseAsync = count > asyncThreshold;
                useStore.setState({ featureCount: count });

                const updatedAnalysisOptions = {
                    ...analysisOptions,
                    async: shouldUseAsync
                };

                try {
                    const headers = createApiHeaders(apiKey);
                    const response = await fetch('/api/submit/geo-ids', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            geoIds: cleanGeoIds,
                            analysisOptions: updatedAnalysisOptions,
                            assetRegistryOptions: {
                                ...(catalog && { catalog }),
                                ...(collection && { collection }),
                            },
                        }),
                    });

                    const fetchedData = await response.json();

                    if (!fetchedData) {
                        throw new Error(`No response from the server`);
                    }

                    if (!response.ok && fetchedData['message']) {
                        throw new Error(`${fetchedData['message']}`);
                    }

                    if (!response.ok) {
                        throw new Error(`Server error with status ${response.status}`);
                    }

                    if (fetchedData) {
                        if (fetchedData.code === SystemCode.ANALYSIS_PROCESSING) {
                            const { token } = fetchedData.data;
                            useStore.setState({ token });
                            safePush(`/results/${token}`);
                        } else if (fetchedData.code === SystemCode.ANALYSIS_COMPLETED) {
                            const token = fetchedData.context?.token;
                            if (token) {
                                useStore.setState({ token, response: fetchedData });
                                safePush(`/results/${token}`);
                            }
                        }
                    }
                } catch (error: any) {
                    useStore.setState({ error: error.message });
                } finally {
                    useStore.setState({ isLoading: false });
                }
            }
        }
    };

    const clearInput = () => {
        useStore.setState({ geoIds: [''], error: "", selectedFile: "" });
        setIsDisabled(true);
    };

    const downloadSampleDocument = () => {
        const element = document.createElement('a');
        element.setAttribute('href', '/geoids.txt');
        element.setAttribute('download', 'geoids.txt');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const renderExampleButton = () => (
        <button
            onClick={downloadSampleDocument}
            className="flex mt-2 items-center justify-center w-28 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded focus:outline-none focus:shadow-outline"
            type="button"
        >
            <Image
                className='mr-2'
                src="/download-outline.svg"
                alt="download-outline"
                width={20}
                height={20}
            />
            Example
        </button>
    );

    return (
        <div className="relative">
            <div className="mx-2 mb-4">
                {error && <Alert type="error" message={error} onClose={clearError} />}
            </div>

            <Tabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                asyncThreshold={asyncThreshold}
                maxGeometryLimit={maxGeometryLimit}
            />

            <div className="mx-2 mt-4">
                <Collapsible open={catalogSectionOpen} onOpenChange={setCatalogSectionOpen}>
                    <div className="border border-gray-300 bg-gray-800 rounded">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Database className="h-4 w-4" />
                                    Catalog & Collection
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${catalogSectionOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 text-left block pl-2">Catalog</label>
                                        <Select value={catalog} onValueChange={(v) => { setCatalog(v); setCollection(''); setCollections([]); }}>
                                            <SelectTrigger className="bg-gray-900 border-gray-600">
                                                <SelectValue placeholder={registryLoading ? 'Loading...' : 'Select catalog'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catalogs.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.id}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 text-left block pl-2">Collection</label>
                                        <Select value={collection} onValueChange={setCollection}>
                                            <SelectTrigger className="bg-gray-900 border-gray-600">
                                                <SelectValue placeholder={registryLoading ? 'Loading...' : 'Select collection'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {collections.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.id}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            </div>

            <div className="mx-2 mt-4">
                <AnalysisOptions value={analysisOptions} onChange={setAnalysisOptions} />
            </div>
            
            <div className="flex items-center mx-2 justify-between mt-4">
                {renderExampleButton()}
            </div>
            

            <div className="flex items-center justify-between mt-4">
                <div></div>
                <Buttons clearInput={clearInput} analyze={analyze} isDisabled={isDisabled} />
            </div>
        </div>
    );
};

export default SubmitGeoIds;
