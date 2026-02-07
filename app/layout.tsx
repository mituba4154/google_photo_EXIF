import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Photos EXIF Restorer",
  description:
    "Google Photos Takeout からエクスポートされた画像の EXIF を JSON メタデータで復元",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
