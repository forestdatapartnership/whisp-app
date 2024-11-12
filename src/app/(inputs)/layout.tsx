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
      <div className="flex-1 overflow-y-auto p-2 md:mx-5">
        {children}
      </div>
    </div>
  );
}
