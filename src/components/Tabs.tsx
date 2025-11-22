import { FileInput } from "./FileInput";
import { ManualInput } from "./ManualInput";
import { useStore } from "@/store";
import { parseGeoIdFile } from "@/lib/utils/fileParser";

interface TabsProps {
    activeTab: number;
    setActiveTab: (index: number) => void;
    asyncThreshold: number;
    maxGeometryLimit: number;
}

export const Tabs: React.FC<TabsProps> = ({ 
    activeTab, 
    setActiveTab,
    asyncThreshold,
    maxGeometryLimit
}) => {

    const handleFileChange = async (file: File) => {
        useStore.setState({ error: "" })
        if (file) {
            const result = await parseGeoIdFile(file);
            
            if (result && 'error' in result) {
                useStore.setState({ error: result.error, selectedFile: "" });
            } else {
                const count = result.length;
                
                if (count > maxGeometryLimit) {
                    useStore.setState({ 
                        error: `Too many Geo IDs. Maximum allowed is ${maxGeometryLimit} features.`, 
                        selectedFile: "" 
                    });
                } else {
                    useStore.setState({ geometry: result, geoIds: result, selectedFile: file.name });
                }
            }
        }
    };
    const accept = {
        'text/plain': ['.txt']
    }
    const tabs =[
        { title: 'File', content: <FileInput innerMessage="Only .txt files are accepted." alertMessage="Submit a .txt file with up to 100 geoids separated by a comma or new line." handleFileChange={handleFileChange} accept={accept}/> },
        { title: 'Manual', content: <ManualInput /> }
    ]
    
    return ( 
        <div>
            <div className="flex justify-center space-x-1 p-2 rounded-t-lg ">
                {tabs.map((tab, index) => (
                    <button
                        onClick={() => setActiveTab(index)}
                        key={index}
                        className={`py-1 px-6 rounded-t-lg transition-colors duration-200 
                                    ${activeTab === index ? 'bg-gray-900 text-white border-b-2 border-blue-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-800'}`}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>
            <div className="p-2 rounded-b-lg">
                {tabs[activeTab].content}
            </div>
        </div>
    );
};


