import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
        <div className="flex flex-col h-full">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
  )
}
