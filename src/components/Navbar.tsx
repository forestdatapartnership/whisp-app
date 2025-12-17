"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

const Navbar: React.FC = () => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, isAuthenticated, logout } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        if (isProfileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    const handleLogout = async () => {
        await logout();
        setIsProfileDropdownOpen(false);
    };

    return (
        <nav className="bg-gray-800 text-white p-4 mb-4 relative z-30">
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

                    <Link href="/documentation/api-guide" className="hover:text-gray-300 mx-4">
                        Documentation
                    </Link>

                    {/* Login/Profile - Third Item */}
                    {isAuthenticated && user ? (
                        <div className="relative mx-4" ref={dropdownRef}>
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
                                        href="/settings" 
                                        className="block px-4 py-2 hover:bg-gray-600 rounded-t-lg"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    >
                                        Account
                                    </Link>
                                    <Link 
                                        href="/dashboard" 
                                        className="block px-4 py-2 hover:bg-gray-600 rounded-t-lg"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link 
                                        href="/dashboard/jobs" 
                                        className="block px-4 py-2 hover:bg-gray-600"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                    >
                                        Job stats
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
