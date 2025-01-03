'use client'

import React, { useState } from 'react';
import Image from 'next/image';

export default function InputLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to toggle sidebar visibility
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-full mx-5 flex flex-col md:flex-row">
      <div className="flex-1 overflow-y-auto p-2 md:mx-8">
        {children}
      </div>
    </div>
  );
}
