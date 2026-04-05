import Image from 'next/image';

interface SampleDownloadButtonProps {
  href: string;
  filename: string;
}

export default function SampleDownloadButton({ href, filename }: SampleDownloadButtonProps) {
  const download = () => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={download}
      className="flex mt-2 items-center justify-center w-28 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded focus:outline-none focus:shadow-outline"
      type="button"
    >
      <Image
        className="mr-2"
        src="/download-outline.svg"
        alt="download-outline"
        width={20}
        height={20}
      />
      Example
    </button>
  );
}
