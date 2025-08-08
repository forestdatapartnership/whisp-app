import Image from 'next/image';
import Link from 'next/link';
import { getAppVersion } from '@/lib/utils';
import WhatsNewLink from './WhatsNewLink';

const Footer: React.FC = () => {
    const version = getAppVersion();
    return (
        <footer className="bg-transparent text-white mt-4 py-4 border-t border-gray-700 h-16 flex items-center">
            <div className="w-full flex justify-between items-center px-4 md:px-12">
                <div>
                    <Link href="https://github.com/forestdatapartnership/whisp-app" passHref target="_blank">
                        <Image src="/github-logo.svg" alt="GitHub Logo" width={30} height={30} />
                    </Link>
                </div>
                <div className="text-sm">
                    © {new Date().getFullYear()}
                    <Link href="https://openforis.org" target="_blank" className="text-blue-500"> Open Foris </Link>
                    | <Link href="https://github.com/forestdatapartnership/whisp-app/blob/HEAD/LICENSE" target="_blank" className="text-blue-500"> MIT License </Link>
                    | <Link href={`https://github.com/forestdatapartnership/whisp-app/releases`} target="_blank" className="text-blue-500">v{version}</Link> · <WhatsNewLink version={version} />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
