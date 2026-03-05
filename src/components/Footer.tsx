import Image from 'next/image';
import Link from 'next/link';
import VersionLink from './VersionLink';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

const Footer: React.FC = () => {
    return (
        <footer className="bg-transparent text-white mt-4 py-4 border-t border-gray-700 h-16 flex items-center">
            <div className="w-full flex justify-between items-center px-4 md:px-12">
                <div>
                    <Link href="https://github.com/forestdatapartnership/whisp-app" passHref target="_blank">
                        <Image src="/github-logo.svg" alt="GitHub Logo" width={30} height={30} />
                    </Link>
                </div>
                <div className="text-sm flex items-center gap-2">
                    © {new Date().getFullYear()}
                    <Link href="https://openforis.org" target="_blank" className="text-blue-500"> Open Foris </Link>
                    | <Link href="https://github.com/forestdatapartnership/whisp-app/blob/HEAD/LICENSE" target="_blank" className="text-blue-500"> MIT License </Link>
                    |
                    <DropdownMenu>
                        <DropdownMenuTrigger className="text-blue-500 hover:text-blue-400 flex items-center gap-1 outline-none">
                            Legal
                            <ChevronDown className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                                <Link href="/legal/privacy-policy" className="text-gray-300 hover:text-white">Privacy Policy</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/legal/terms-of-service" className="text-gray-300 hover:text-white">Terms of Service</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/legal/gee-data-separation" className="text-gray-300 hover:text-white">GEE Data Separation</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    | <Link href="/notifications" className="text-blue-500"> Notifications </Link>
                    | <VersionLink />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
