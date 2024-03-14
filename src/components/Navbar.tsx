// components/Navbar.tsx
import Link from 'next/link';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-gray-800 text-white p-4 mb-4">
            <div className="w-full flex justify-between">
                <div className="flex mx-12 justify-start">
                    <Link href="/" className="text-lg hover:text-gray-300">
                        <strong className="font-bold">W</strong>hat <strong className="font-bold">is</strong> in that <strong className="font-bold">p</strong>lot?  <strong className="font-bold">(WHISP)</strong>
                    </Link>
                </div>
                <div className="flex mx-12 justify-end">
                    <Link href="/documentation" className="hover:text-gray-300">
                        Documentation
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
