import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Manrope } from "next/font/google";
import { locales } from "@/i18n/locales";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfigProvider } from "@/lib/config/config-context";
import { ContextsInitializer } from "@/lib/providers/contexts-initializer";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ApiKeyProvider } from "@/lib/auth/api-key-context";
import { Toaster } from "@/components/ui/sonner";

import "../globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-loaded",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();

  return (
    <html
      lang={locale}
      className={`h-full antialiased ${manrope.variable} `}
      suppressHydrationWarning
    >
      <head>
        {/* Plain inline script on purpose: next/script beforeInteractive queues inline code for the runtime bootstrap, which runs after first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("whisp-theme");document.documentElement.classList.toggle("dark",t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))}catch{document.documentElement.classList.add("dark")}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text-primary transition-colors">
        <NextIntlClientProvider>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
