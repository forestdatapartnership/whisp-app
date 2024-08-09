// components/Navbar.tsx
import Link from 'next/link';
import Image from 'next/image';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-gray-800 text-white p-4 mb-4">
            <div className="w-full flex justify-between">
                <div className="flex md:mx-12 justify-center items-center h-full">
                    <Link href="/" className="text-lg hover:text-gray-300 flex items-center">
                        <Image
                            src="whisp_logo.svg"
                            alt="Picture of the author"
                            width={35}
                            height={35}
                        />
                        <strong className="font-bold ml-2">WHISP</strong>
                    </Link>
                </div>

                <div className="flex mx-12 justify-end items-center ">
                    <Link target="_blank" href="https://openforis.org/solutions/whisp" className="hover:text-gray-300 mx-4">
                        About
                    </Link>
                    <Link href="/documentation" className="hover:text-gray-300 mx-4">
                        Documentation
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
