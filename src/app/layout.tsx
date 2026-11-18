import type { Metadata } from "next";
import { Alegreya_Sans, Cinzel, EB_Garamond, JetBrains_Mono } from "next/font/google";
import { plainViewScript } from "@/lib/plain-view";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700", "800"], // only bold (text) and extra-bold (wax seals) are used
});
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const alegreyaSans = Alegreya_Sans({
  variable: "--font-alegreya-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Matthew Pearce — Full Stack Engineer",
    template: "%s · Matthew Pearce",
  },
  description: "Full stack engineer building web and mobile products end to end.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [cinzel, garamond, alegreyaSans, jetbrainsMono].map((f) => f.variable).join(" ");

  return (
    // suppressHydrationWarning: the inline script may add data-view="plain" before React hydrates.
    <html lang="en" className={`${fonts} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: plainViewScript }} />
      </head>
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before hydration.
          This only silences mismatches on body's own attributes, not its children. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
