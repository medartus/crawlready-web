/**
 * GET /c.js — Bot detection script for script-tag integration.
 *
 * Served as a JS file. Customer embeds:
 *   <script src="https://crawlready.app/c.js" data-key="cr_live_xxx" async></script>
 *
 * The script detects AI bot user-agents in the JS context and sends
 * a beacon to POST /api/v1/ingest with source='js'.
 *
 * Centrally managed — bot list updates propagate to all script-tag customers
 * within CDN TTL (~1 hour).
 *
 * See docs/architecture/analytics-infrastructure.md §Script-Tag Path
 */

import { AI_BOTS_REGEX_STRING } from '@crawlready/core';
import { NextResponse } from 'next/server';

const INGEST_URL = 'https://crawlready.app/api/v1/ingest';

function generateScript(): string {
  return `(function(){
  "use strict";
  var k=document.currentScript&&document.currentScript.getAttribute("data-key");
  if(!k)return;
  var ua=navigator.userAgent||"";
  var re=/${AI_BOTS_REGEX_STRING}/i;
  var m=re.exec(ua);
  if(!m)return;
  var b=m[0];
  try{
    var d=JSON.stringify({s:k,p:location.pathname,b:b,t:Date.now(),src:"js"});
    if(navigator.sendBeacon){
      navigator.sendBeacon("${INGEST_URL}",new Blob([d],{type:"application/json"}));
    }else{
      var x=new XMLHttpRequest();
      x.open("POST","${INGEST_URL}");
      x.setRequestHeader("Content-Type","application/json");
      x.send(d);
    }
  }catch(e){}
})();`;
}

// Cache the generated script — it rarely changes
let cachedScript: string | null = null;

export function GET() {
  if (!cachedScript) {
    cachedScript = generateScript();
  }

  return new NextResponse(cachedScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
