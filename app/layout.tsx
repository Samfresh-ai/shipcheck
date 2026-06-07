import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SessionBootstrap } from "@/components/SessionBootstrap";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ShipCheck - Ship with intention",
    template: "%s - ShipCheck",
  },
  description: "A 20-question pre-launch readiness check with honest AI feedback and a shareable report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <head>
        {/* Novus.ai Analytics - Required for MtP Hackathon */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(apiKey){
                if(!apiKey){
                  window.pendo = window.pendo || {
                    _q: [],
                    initialize: function(){},
                    identify: function(){},
                    updateOptions: function(){},
                    pageLoad: function(){},
                    track: function(event, properties){ this._q.push(['track', event, properties]); }
                  };
                  return;
                }
                (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
                v=['initialize','identify','updateOptions','pageLoad','track'];
                for(w=0,x=v.length;w<x;++w)(function(m){
                o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
                y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
                z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
              })('${process.env.NEXT_PUBLIC_NOVUS_API_KEY || ""}');
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <SessionBootstrap />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
