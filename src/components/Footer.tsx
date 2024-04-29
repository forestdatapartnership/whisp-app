import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="bg-transparent text-white mt-4 pt-4 border-t border-gray-700">
            <div className="w-full flex justify-between items-center px-4 md:px-12">
                <div>
                    <Link href="https://github.com/your-username/your-repository" passHref>
                        <Image src="/github-logo.svg" alt="GitHub Logo" width={30} height={30} />
                          <span>View on GitHub </span>
                    </Link>
                </div>
                <div>
                    © {new Date().getFullYear()} WHISP. Licensed under the MIT License.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
