// components/Navbar.tsx
"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const Navbar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <nav className="bg-gray-800 text-white p-4 mb-4">
            <div className="w-full flex justify-between">
                <div className="flex md:mx-12 justify-center items-center h-full">
                    <Link href="/" className="text-lg hover:text-gray-300 flex items-center">
                        <Image
                            src="/whisp_logo.svg"
                            alt="Picture of the author"
                            width={35}
                            height={35}
                        />
                        <strong className="font-bold ml-2">WHISP</strong>
                    </Link>
                </div>

                <div className="flex mx-12 justify-end items-center">
                    <Link target="_blank" href="https://openforis.org/solutions/whisp" className="hover:text-gray-300 mx-4">
                        About
                    </Link>

                    <Link href="/login" className="hover:text-gray-300 mx-4">
                        Login
                    </Link>

                    <div className="relative mx-4">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="hover:text-gray-300"
                        >
                            Documentation
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-gray-700 shadow-lg rounded-lg">
                                <Link 
                                    href="/documentation/layers" 
                                    className="block px-4 py-2 hover:bg-gray-600 rounded-t-lg"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    Layers
                                </Link>
                                <Link 
                                    href="/documentation/api-guide" 
                                    className="block px-4 py-2 hover:bg-gray-600 rounded-b-lg"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    API Guide
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
