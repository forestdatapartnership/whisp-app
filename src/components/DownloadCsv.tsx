import Image from "next/image";
import React from "react";

type DownloadCsvProps = {
    token: string;
};

const DownloadCsv: React.FC<DownloadCsvProps> = ({ token }) => {
    // Construct the URL for the API route
    const downloadUrl = `/api/download-csv/${token}`;
    return (
        <>
            <h1 className="text-2xl font-semibold text-center mb-2">Download CSV</h1>
            <div className="h-8 bg-yellow-50 shadow-md  my-4 mx-auto flex text-center justify-center items-center">
                <p className="text-gray-700  dark:text-gray-800 text-xs">Click the below icon to download the CSV for your corresponding plots.</p>
            </div>
            <div className="flex items-center justify-center space-y-2">
                <a href={downloadUrl} download>
                    <Image
                        src="/csv.svg"
                        alt="csv"
                        width={200}
                        height={200}
                        style={{ cursor: 'pointer' }} // Make the image appear clickable
                    />
                </a>
            </div>
        </>
    );
};

export default DownloadCsv;
