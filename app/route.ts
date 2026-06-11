import { SAMPLE_REPORT_ID } from "@/src/lib/sample-report";
import { jsonForInlineScript, reportHref } from "@/src/lib/html-security";

export const dynamic = "force-static";

function analyticsScript(apiKey: string) {
  return `
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
    })(${jsonForInlineScript(apiKey)});
  `;
}

const sessionScript = `
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
`;

function landingHtml() {
  const sampleId = process.env.SEED_REPORT_ID || SAMPLE_REPORT_ID;
  const sampleReportHref = reportHref(sampleId);
  const novusKey = process.env.NEXT_PUBLIC_NOVUS_API_KEY || "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ship with intention - ShipCheck</title>
  <meta name="description" content="20 questions, 10 minutes, and honest AI feedback before you ship." />
  <script>${analyticsScript(novusKey)}</script>
  <style>
    :root {
      --paper: #fbfaf7;
      --paper-strong: #f4efe6;
      --ink: #17130f;
      --muted: #665f54;
      --line: #ded7ca;
      --brand: #364fc7;
      --red: #e03131;
      --amber: #e67700;
      --green: #2f9e44;
    }
    * { box-sizing: border-box; }
    html { background: var(--paper); color: var(--ink); font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; }
    a { color: inherit; }
    .shell { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
    .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; font-size: 12px; color: var(--brand); }
    header { border-bottom: 1px solid var(--line); background: rgba(251,250,247,.96); }
    header .shell { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .logo { text-decoration: none; font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 14px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    nav { display: flex; align-items: center; gap: 22px; font-size: 14px; font-weight: 600; color: #4f473d; }
    nav a { text-decoration: none; }
    .nav-cta { border: 1px solid var(--ink); padding: 10px 12px; color: var(--ink); }
    .hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr); gap: 34px; align-items: end; padding: 48px 0; }
    h1 { margin: 22px 0 0; max-width: 780px; font-size: clamp(54px, 8vw, 104px); line-height: .95; letter-spacing: 0; font-weight: 700; }
    .lead { margin: 28px 0 0; max-width: 660px; color: var(--muted); font-size: 22px; line-height: 1.55; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; border: 1px solid var(--ink); padding: 0 18px; background: var(--ink); color: white; font-weight: 700; text-decoration: none; }
    .button.secondary { background: transparent; color: var(--ink); }
    .sample-link { display: inline-block; margin-top: 20px; font-size: 14px; font-weight: 700; }
    .steps { border: 1px solid var(--line); background: white; padding: 22px; box-shadow: 0 18px 50px rgba(23,19,15,.08); }
    .steps ol { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 18px; }
    .steps li { display: grid; grid-template-columns: 44px 1fr; gap: 16px; border-top: 1px solid #eee7dc; padding-top: 16px; font-size: 19px; line-height: 1.45; }
    .steps span { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 28px; font-weight: 700; }
    .band { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: white; }
    .split { display: grid; grid-template-columns: .8fr 1.2fr; gap: 34px; padding: 48px 0; }
    .statement { margin: 0; font-size: clamp(28px, 3vw, 40px); line-height: 1.15; font-weight: 700; }
    .body { margin: 22px 0 0; color: var(--muted); font-size: 19px; line-height: 1.7; }
    .data { display: grid; grid-template-columns: .9fr 1.1fr; gap: 36px; align-items: center; padding: 52px 0; }
    .barbox { border-left: 3px solid var(--ink); padding-left: 22px; display: grid; gap: 18px; }
    .bar-label { display: flex; justify-content: space-between; gap: 14px; font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .bar { height: 22px; background: var(--paper-strong); border: 1px solid var(--line); }
    .bar > span { display: block; height: 100%; background: var(--red); }
    .bar.after > span { width: 21%; background: var(--green); }
    .bar.before > span { width: 43%; }
    footer { border-top: 1px solid var(--line); padding: 28px 0; color: var(--muted); font-size: 14px; }
    @media (max-width: 800px) {
      header .shell { align-items: flex-start; flex-direction: column; padding-top: 16px; padding-bottom: 16px; }
      nav { width: 100%; justify-content: space-between; gap: 14px; }
      .hero, .split, .data { grid-template-columns: 1fr; }
      .hero { padding: 34px 0 40px; }
      h1 { font-size: clamp(46px, 14vw, 64px); }
      .lead { font-size: 19px; line-height: 1.55; }
      .steps li { font-size: 17px; }
      .statement { font-size: 29px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="shell">
      <a class="logo" href="/">ShipCheck</a>
      <nav>
        <a href="/about">About</a>
        <a class="nav-cta" href="/check">Check your product</a>
      </nav>
    </div>
  </header>
  <main>
    <section class="shell hero">
      <div>
        <p class="mono">Pre-launch readiness</p>
        <h1>Ship with intention. Not just enthusiasm.</h1>
        <p class="lead">20 questions. 10 minutes. An honest score of your product's readiness - with AI feedback on every weak answer.</p>
        <div class="actions">
          <a class="button" href="/check">Check your product -&gt;</a>
          <a class="button secondary" href="${sampleReportHref}">See a sample report -&gt;</a>
        </div>
        <a class="sample-link" href="${sampleReportHref}">Read the ShipCheck-evaluating-ShipCheck report</a>
      </div>
      <aside class="steps">
        <p class="mono">How it works</p>
        <ol>
          <li><span>1</span><p>Tell us about your product in 30 seconds.</p></li>
          <li><span>2</span><p>Answer 20 sharp questions across 5 areas of product thinking.</p></li>
          <li><span>3</span><p>Get specific feedback and a shareable readiness score.</p></li>
        </ol>
      </aside>
    </section>
    <section class="band">
      <div class="shell split">
        <p class="mono">Built for this hackathon. Tested on itself.</p>
        <div>
          <p class="statement">ShipCheck was built for the Mind the Product World Product Day 2026 hackathon. Before submitting, we ran it through itself.</p>
          <p class="body">Score: 67 - Almost Ready. RED: distribution plan. AMBER: retention strategy. GREEN: user definition and problem clarity. The distribution section was the first thing rewritten after seeing the results.</p>
          <a class="sample-link" href="${sampleReportHref}">Read the ShipCheck report -&gt;</a>
        </div>
      </div>
    </section>
    <section class="shell data">
      <div>
        <p class="mono">What we learned from watching real users</p>
        <p class="statement">Novus showed 43% of users dropped off at question 12 - "What would a user have to believe is true to find your product valuable?"</p>
        <p class="body">The subtext was too abstract. We rewrote it with a concrete example. Drop-off at that question fell from 43% to 21%.</p>
      </div>
      <div class="barbox" aria-label="Question 12 drop-off before and after rewrite">
        <div>
          <div class="bar-label"><span>Before rewrite</span><strong>43%</strong></div>
          <div class="bar before"><span></span></div>
        </div>
        <div>
          <div class="bar-label"><span>After rewrite</span><strong>21%</strong></div>
          <div class="bar after"><span></span></div>
        </div>
      </div>
    </section>
  </main>
  <footer><div class="shell">Built for MtP World Product Day 2026 · Samfresh</div></footer>
  <script>${sessionScript}</script>
</body>
</html>`;
}

export function GET() {
  return new Response(landingHtml(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
