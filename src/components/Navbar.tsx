"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import { hasCookie } from '@/lib/utils';

const Navbar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const router = useRouter();
    const { user, isAuthenticated, loading, logout } = useUserProfile();

    // Debug logging to verify our cookie detection is working correctly
    useEffect(() => {
        const hasAuthCookie = hasCookie('token') || hasCookie('refreshToken');
        console.log('Auth cookies detected:', hasAuthCookie);
        console.log('Authentication state:', { isAuthenticated, loading });
    }, [isAuthenticated, loading]);

    const handleLogout = async () => {
        await logout();
        setIsProfileDropdownOpen(false);
        router.push('/login');
    };

    return (
        <nav className="bg-gray-800 text-white p-4 mb-4">
            <div className="w-full flex justify-between">
                <div className="flex md:mx-12 justify-center items-center h-full">
                    <Link href="/" className="text-lg hover:text-gray-300 flex items-center">
                        <Image
                            src="/whisp_logo.svg"
                            alt="Whisp logo"
                            width={35}
                            height={35}
                        />
                        <strong className="font-bold ml-2">WHISP</strong>
                    </Link>
                </div>

                <div className="flex mx-12 justify-end items-center">
                    {/* About Link - First Item */}
                    <Link target="_blank" href="https://openforis.org/solutions/whisp" className="hover:text-gray-300 mx-4">
                        About
                    </Link>

                    {/* Documentation Dropdown - Second Item */}
                    <div className="relative mx-4">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="hover:text-gray-300"
                        >
                            Documentation
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-700 shadow-lg rounded-lg z-10">
                                <Link 
                                    href="/documentation/layers" 
                                    className="block px-4 py-2 hover:bg-gray-600 rounded-t-lg"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    Layers
                                </Link>
                                <Link 
                                    href="/documentation/api-guide" 
                                    className="block px-4 py-2 hover:bg-gray-600 rounded-b-lg"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    API Guide
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Login/Profile - Third Item */}
                    {isAuthenticated && user ? (
                        <div className="relative mx-4">
                            <button 
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="flex items-center hover:text-gray-300"
                            >
                                <span className="mr-1">{user.name}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isProfileDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-700 shadow-lg rounded-lg z-10">
                                    <Link 
                                        href="/dashboard" 
                                        className="block px-4 py-2 hover:bg-gray-600 rounded-t-lg"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-600 rounded-b-lg"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="hover:text-gray-300 mx-4">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
