'use client'

import Link from 'next/link';

import { useStore } from '@/store';

const Sidebar: React.FC = () => {

    const resetStore = useStore((state) => state.reset);

    return (
        <div className="flex flex-col space-y-4 h-full  bg-gray-800 text-white p-4">
            <Link href="/submit-geo-ids" onClick={() => resetStore()} className="hover:text-gray-300 cursor-pointer" passHref>
                Submit Geo IDs
            </Link>
            <Link href="/submit-geometry" onClick={() => resetStore()} passHref className="hover:text-gray-300 cursor-pointer">
                Submit Geometry
            </Link>
        </div>
    );
};

export default Sidebar;
