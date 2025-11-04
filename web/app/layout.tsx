import "./globals.css";
import ThemeColorScript from "./components/theme/ThemeColorScript";

export const metadata = {
  title: "Docker Board",
  description: "Dashboard de servicios y APIs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeColorScript />
        <meta name="theme-color" content="#0f172a" />
      </head>
      {/* aquí NO hay nav */}
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
