/*!
 * finance-estate-iframe-auto-height.js
 * Makes the Finance Estate listing iframes grow to their own content height,
 * instead of sitting at a hard-coded height that leaves a gap under short lists.
 *
 * How it works: the embed host (api.finance-estate.art) does not post its height
 * to the parent, and a cross-origin iframe cannot be measured from the outside.
 * It DOES send `Access-Control-Allow-Origin: *`, so we fetch the embed HTML,
 * inject a tiny height reporter into it, and re-serve it to the same iframe via
 * `srcdoc` + `sandbox` (no allow-same-origin -> the vendor's script still runs in
 * its own opaque origin and can't touch this page, cookies or storage).
 *
 * If the fetch fails, nothing is touched and the existing fixed height stays.
 */
(function () {
  'use strict';

  var SELECTOR = 'iframe[src*="finance-estate.art/api/iframe/"]';
  var MSG_TYPE = 'fe-iframe-height';
  // No allow-same-origin on purpose. allow-popups* keeps the "Exposé öffnen"
  // target="_blank" links working.
  var SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
  var MIN_HEIGHT = 320; // px - keeps the section from collapsing if a list renders empty
  var BUFFER = 2;       // px - absorbs sub-pixel rounding so no inner scrollbar appears

  var frames = {};
  var seq = 0;
  var refreshTimer = null;

  /* --- the reporter that runs inside the iframe ------------------------- */
  function reporter(id) {
    return '<script>(function(){' +
      'var ID=' + JSON.stringify(id) + ',TYPE=' + JSON.stringify(MSG_TYPE) + ',last=-1;' +
      // Measure the <body> box, not documentElement.scrollHeight: the latter is
      // floored to the iframe's own height, so it could only ever ratchet upwards.
      'function measure(){var b=document.body;if(!b)return 0;' +
      'var cs=getComputedStyle(b),m=(parseFloat(cs.marginTop)||0)+(parseFloat(cs.marginBottom)||0);' +
      'return Math.ceil(b.getBoundingClientRect().height+m);}' +
      'function send(){var h=measure();if(!h||Math.abs(h-last)<2)return;last=h;' +
      'try{parent.postMessage({type:TYPE,id:ID,height:h},"*");}catch(e){}}' +
      'function watch(){if(!window.ResizeObserver)return;var ro=new ResizeObserver(send);' +
      'ro.observe(document.documentElement);if(document.body)ro.observe(document.body);}' +
      'document.addEventListener("DOMContentLoaded",function(){send();watch();});' +
      'window.addEventListener("load",send);window.addEventListener("resize",send);' +
      'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(send).catch(function(){});}' +
      '[0,100,300,600,1200,2500,5000].forEach(function(t){setTimeout(send,t);});' +
      '})();<\/script>';
  }

  function prepare(html, id, src) {
    var injected = '<base href="' + src.replace(/"/g, '&quot;') + '">' + reporter(id);
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, function (tag) { return tag + injected; });
    }
    return injected + html;
  }

  /* --- parent side ------------------------------------------------------ */
  function refreshScrollTriggers() {
    if (typeof window.ScrollTrigger === 'undefined') return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { window.ScrollTrigger.refresh(); }, 120);
  }

  function apply(iframe, height) {
    var h = Math.max(MIN_HEIGHT, Math.round(height) + BUFFER);
    if (iframe.dataset.feHeight === String(h)) return;
    iframe.dataset.feHeight = String(h);
    iframe.style.setProperty('height', h + 'px', 'important');
    iframe.style.setProperty('min-height', '0', 'important');
    refreshScrollTriggers();
  }

  function upgrade(iframe) {
    var src = iframe.getAttribute('src');
    if (!src || iframe.dataset.feAutoHeight) return;
    iframe.dataset.feAutoHeight = 'pending';

    var id = 'fe-' + (++seq);
    fetch(src, { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        frames[id] = iframe;
        iframe.dataset.feAutoHeight = 'on';
        iframe.setAttribute('sandbox', SANDBOX);
        iframe.setAttribute('scrolling', 'no');
        iframe.style.border = '0';
        // srcdoc wins over src; src stays as the no-JS / no-fetch fallback.
        iframe.srcdoc = prepare(html, id, src);
      })
      .catch(function (err) {
        iframe.dataset.feAutoHeight = 'failed';
        if (window.console) {
          console.warn('[fe-iframe] auto-height unavailable, keeping the fixed height:', err);
        }
      });
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== MSG_TYPE) return;
    var iframe = frames[data.id];
    if (!iframe || event.source !== iframe.contentWindow) return;
    apply(iframe, data.height);
  });

  function sweep() {
    var list = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < list.length; i++) upgrade(list[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sweep);
  } else {
    sweep();
  }
  // Catch embeds that Webflow (or a CMS list) drops in after first paint.
  setTimeout(sweep, 500);
  setTimeout(sweep, 1500);
})();
