import React from 'react';
import Image from 'next/image';
import { useStore } from '@/store';


const ErrorAlert  = () => {

    const error = useStore().error;

    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline" style={{ paddingRight: "30px" }}>{error}</span>
            <span className="absolute top-0 bottom-0 right-0 flex items-center px-4 py-3">
                <Image
                    onClick={() => useStore.setState({ error: "" })}
                    src="/x-red.svg"
                    alt="Close"
                    className="fill-current"
                    width={15}
                    height={15}
                />
            </span>
        </div>
    );
};

export default ErrorAlert;
