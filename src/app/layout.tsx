import type { Metadata } from "next";
import Script from "next/script";
import { AuthRecoveryRedirect } from "@/components/auth/AuthRecoveryRedirect";
import "./globals.css";

export const metadata: Metadata = {
  title: "Energetic Exotics Portal",
  description: "Driver and admin portal for Energetic Exotics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthRecoveryRedirect />
        {children}
        <Script id="marker-io" strategy="afterInteractive">
          {`
            window.markerConfig = {
              project: "6a20413903d28bc4520d2e1d",
              source: "snippet"
            };

            !function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);
          `}
        </Script>
      </body>
    </html>
  );
}
