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
                <main className="flex flex-1 flex-col items-center justify-center px-6 py-8">
                  {children}
                </main>
                <Footer />
              </ContextsInitializer>
            </TooltipProvider>
          </ThemeProvider>
          </ApiKeyProvider>
          </AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
