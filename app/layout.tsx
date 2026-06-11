import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { jsonForInlineScript } from "@/src/lib/html-security";
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
                (function(p,e,n,d,o){var v,w;o=p[d]=p[d]||{};o._q=o._q||[];
                v=['initialize','identify','updateOptions','pageLoad','track'];
                for(w=0;w<v.length;++w)(function(m){
                o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
                if(!apiKey){return;}
                o.__shipcheckLoad=function(){var y,z;if(o.__shipcheckLoaded){return;}o.__shipcheckLoaded=true;
                y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
                z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);};
                o.__shipcheckSchedule=function(){if('requestIdleCallback' in p){p.requestIdleCallback(o.__shipcheckLoad,{timeout:8000});}else{p.setTimeout(o.__shipcheckLoad,6000);}};
                if(e.readyState==='complete'){p.setTimeout(o.__shipcheckSchedule,4000);}else{p.addEventListener('load',function(){p.setTimeout(o.__shipcheckSchedule,4000);},{once:true});}
                })(window,document,'script','pendo');
              })(${jsonForInlineScript(process.env.NEXT_PUBLIC_NOVUS_API_KEY || "")});
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var sessionKey='shipcheck_session_id';
                var visitorKey='shipcheck_analytics_id';
                var accountId='shipcheck-public';
                function fallbackId(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
                function visitorId(){
                  try{
                    var existing=window.localStorage.getItem(visitorKey);
                    if(existing){return existing;}
                    var id=window.crypto&&window.crypto.randomUUID?window.crypto.randomUUID():fallbackId('visitor');
                    window.localStorage.setItem(visitorKey,id);
                    return id;
                  }catch(_){return fallbackId('visitor');}
                }
                function initAnalytics(){
                  var id=visitorId();
                  var options={visitor:{id:id},account:{id:accountId}};
                  if(window.__shipcheckPendoInitialized){
                    window.pendo&&window.pendo.identify&&window.pendo.identify(options);
                    window.pendo&&window.pendo.updateOptions&&window.pendo.updateOptions(options);
                    return;
                  }
                  window.pendo&&window.pendo.initialize&&window.pendo.initialize(options);
                  window.__shipcheckPendoInitialized=true;
                }
                function setSession(id){
                  try{window.localStorage.setItem(sessionKey,id);}catch(_){}
                  initAnalytics();
                }
                try{
                  var stored=window.localStorage.getItem(sessionKey);
                  if(stored){initAnalytics();return;}
                  fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userAgent:window.navigator.userAgent})})
                    .then(function(response){return response.json();})
                    .then(function(data){setSession(data.sessionId||fallbackId('shipcheck'));})
                    .catch(function(){setSession(fallbackId('shipcheck'));});
                }catch(_){setSession(fallbackId('shipcheck'));}
              })();
            `,
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
