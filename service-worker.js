/* service-worker.js — The Turrelle Sisters Big Munny II
 * CACHE BUST POLICY (v1.1.14): players must NEVER have to clear their cache.
 *
 *   index.html / navigations  -> NETWORK FIRST (cache only as offline fallback).
 *                                This is what was broken before: the shell was
 *                                served cache-first, so a new build's HTML never
 *                                loaded no matter how many ?v= strings changed.
 *   ?v= versioned files       -> CACHE FIRST (the URL itself changes each build,
 *                                so a cached copy can never be stale).
 *   anything else             -> STALE-WHILE-REVALIDATE.
 *   supabase.co               -> never cached (live WABC / progressive / reports).
 *
 * On activation the new worker deletes every older cache, claims all open pages,
 * and the page reloads itself via the controllerchange listener in index.html.
 */
var VERSION   = '1.1.14';
var CACHE_KEY = 'tsbmii-v' + VERSION;
var PRECACHE  = [
  "./index.html?v=1.1.14",
  "./manifest.json?v=1.1.14",
  "./js/reel_strips.js?v=1.1.14",
  "./js/combo_positions.js?v=1.1.14",
  "./js/paytable.js?v=1.1.14",
  "./js/nowin_pool.js?v=1.1.14",
  "./js/wabc.js?v=1.1.14",
  "./js/progressive.js?v=1.1.14",
  "./js/broadcast-init.js?v=1.1.14",
  "./js/game.js?v=1.1.14",
  "./assets/apple-touch-icon.png?v=1.1.14",
  "./assets/banner_art_work.jpg?v=1.1.14",
  "./assets/bell_ring.mp3?v=1.1.14",
  "./assets/favicon-32.png?v=1.1.14",
  "./assets/icon-192.png?v=1.1.14",
  "./assets/icon-512.png?v=1.1.14",
  "./assets/jackpot_sisters.png?v=1.1.14",
  "./assets/progressive_pup.png?v=1.1.14",
  "./assets/red_spin_music.mp3?v=1.1.14",
  "./assets/reel_spin_loop.wav?v=1.1.14",
  "./assets/reel_start.wav?v=1.1.14",
  "./assets/reel_stop.wav?v=1.1.14",
  "./assets/splash_screen.jpg?v=1.1.14",
  "./assets/splash_welcome.wav?v=1.1.14",
  "./assets/sym_1bar.svg?v=1.1.14",
  "./assets/sym_2bar.svg?v=1.1.14",
  "./assets/sym_3bar.svg?v=1.1.14",
  "./assets/sym_blue_7.svg?v=1.1.14",
  "./assets/sym_cherry.svg?v=1.1.14",
  "./assets/sym_red_7.svg?v=1.1.14"
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_KEY)
      .then(function(c){ return c.addAll(PRECACHE); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE_KEY) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  if(req.url.indexOf('supabase.co') >= 0) return;   /* always live */

  var isNav = (req.mode === 'navigate') ||
              (req.headers.get('accept') || '').indexOf('text/html') >= 0;

  /* --- Navigations: NETWORK FIRST so a new build always wins --- */
  if(isNav){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_KEY).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match('./index.html?v=' + VERSION);
        });
      })
    );
    return;
  }

  /* --- Versioned assets: CACHE FIRST (URL changes every build) --- */
  if(req.url.indexOf('?v=') >= 0){
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(CACHE_KEY).then(function(c){ c.put(req, copy); });
          return res;
        });
      })
    );
    return;
  }

  /* --- Everything else: stale-while-revalidate --- */
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_KEY).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    })
  );
});
