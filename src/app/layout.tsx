import type { Metadata } from "next";
import {
  Alegreya_Sans,
  Cinzel,
  EB_Garamond,
  JetBrains_Mono,
  Noto_Serif_JP,
} from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const alegreyaSans = Alegreya_Sans({
  variable: "--font-alegreya-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["600"],
  preload: false,
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
  const fonts = [cinzel, garamond, alegreyaSans, notoSerifJp, jetbrainsMono]
    .map((f) => f.variable)
    .join(" ");

  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
