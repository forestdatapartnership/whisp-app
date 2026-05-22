import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { ConfigProvider } from "@/lib/config/config-context";
import { ContextsInitializer } from "@/lib/providers/contexts-initializer";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ApiKeyProvider } from "@/lib/auth/api-key-context";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Whisp",
  description: "Deforestation risk assessment powered by Google Earth Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("whisp-theme")==="light"){}else{document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text-primary transition-colors">
      <ConfigProvider>
          <AuthProvider>
            <ApiKeyProvider>
          <ThemeProvider>
            <TooltipProvider>
              <ContextsInitializer>
                <Navbar />
                <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-8 has-data-[full-bleed]:px-0 has-data-[full-bleed]:py-0">
                  {children}
                </main>
                <Footer />
              </ContextsInitializer>
            </TooltipProvider>
            <Toaster position="bottom-right" />
          </ThemeProvider>
          </ApiKeyProvider>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
