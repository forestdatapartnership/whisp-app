import Sidebar from "@/components/Sidebar"

export default function InputLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <section className="flex flex-1 overflow-hidden">
            <div className="w-2/12 mx-3 my-2">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {children}
            </div>
        </section>
    )
}
