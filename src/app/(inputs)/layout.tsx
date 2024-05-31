'use client'

import React, { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import Image from 'next/image';

export default function InputLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to toggle sidebar visibility
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-full mx-5 flex flex-col md:flex-row">
      {/* Mobile Menu Icon */}
      <div className="md:hidden p-4">
        <button onClick={toggleSidebar}>
          <Image
            src="/bars-outline.svg"
            alt="bars-outline"
            width={15}
            height={15}
          />
        </button>
      </div>
      {/* Sidebar: hidden on mobile until toggled. Use `display: none;` for fully hiding it off-screen */}
      <div className={`transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!isSidebarOpen && 'hidden md:block'} px-5 bg-gray-800 md:translate-x-0 transition-transform duration-300 ease-in-out md:flex md:ml-10 md:w-1/6`}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-2 md:mx-5">
        {children}
      </div>
    </div>
  );
}
