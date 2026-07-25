#!/usr/bin/env python3
"""
bump_version.py — The Turrelle Sisters Big Munny II

ONE COMMAND cache-bust for every file in the build. Rule 4 / Rule 12 automated,
so a version bump can never be partially applied again.

    python3 bump_version.py 1.0.7

It rewrites, in place:
  * service-worker.js  VERSION + CACHE_KEY + every PRECACHE entry
  * index.html         every ?v= string (scripts, assets, manifest, icons)
                       and the cache-bust comment version
  * js/*.js            every ?v= string + the file's header comment version
  * manifest.json      "version" + every icon src ?v=

Then it verifies that NO file anywhere still carries the previous version, and
syntax-checks every JS file if node is available.

Why players never need to clear their cache:
  - index.html is served NETWORK FIRST by the service worker, so a new build's
    shell always wins; the cached copy is only an offline fallback.
  - Every other file is requested at a NEW url (?v=<version>), so a cached copy
    can never be mistaken for the current one.
  - The new service worker calls skipWaiting + clients.claim, and index.html
    reloads the page once on controllerchange — the update lands by itself.
"""

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
JS_FILES = ['reel_strips', 'combo_positions', 'paytable', 'nowin_pool',
            'wabc', 'progressive', 'broadcast-init', 'game']


def current_version():
    sw = open(os.path.join(ROOT, 'service-worker.js')).read()
    m = re.search(r"var VERSION\s*=\s*'([\d.]+)'", sw)
    return m.group(1) if m else None


def bump(new_v):
    old_v = current_version()
    if not old_v:
        sys.exit('Could not read current VERSION from service-worker.js')
    if old_v == new_v:
        sys.exit('Version %s is already current — pick a higher version.' % new_v)
    print('Bumping %s -> %s' % (old_v, new_v))

    # ---- rebuild the precache list from what is actually on disk ----
    precache = ['./index.html?v=%s' % new_v, './manifest.json?v=%s' % new_v]
    precache += ['./js/%s.js?v=%s' % (f, new_v) for f in JS_FILES]
    for a in sorted(os.listdir(os.path.join(ROOT, 'assets'))):
        precache.append('./assets/' + a + '?v=' + new_v)

    sw_path = os.path.join(ROOT, 'service-worker.js')
    sw = open(sw_path).read()
    sw = re.sub(r"var VERSION\s*=\s*'[\d.]+';",
                "var VERSION   = '%s';" % new_v, sw)
    sw = re.sub(r'var PRECACHE\s*=\s*\[[\s\S]*?\];',
                'var PRECACHE  = %s;' % json.dumps(precache, indent=2), sw)
    sw = sw.replace('CACHE BUST POLICY (v%s)' % old_v,
                    'CACHE BUST POLICY (v%s)' % new_v)
    open(sw_path, 'w').write(sw)
    print('  service-worker.js  VERSION + CACHE_KEY + %d precache entries'
          % len(precache))

    # ---- index.html ----
    idx_path = os.path.join(ROOT, 'index.html')
    idx = open(idx_path).read()
    n = len(re.findall(r'\?v=[\d.]+', idx))
    idx = re.sub(r'\?v=[\d.]+', '?v=' + new_v, idx)
    idx = idx.replace('CACHE BUST (v%s)' % old_v, 'CACHE BUST (v%s)' % new_v)
    # visible build stamp on the splash — lets anyone confirm which build is live
    idx = re.sub(r'BUILD [\d.]+', 'BUILD ' + new_v, idx)
    open(idx_path, 'w').write(idx)
    print('  index.html         %d ?v= strings' % n)

    # ---- js files ----
    total = 0
    for f in JS_FILES:
        p = os.path.join(ROOT, 'js', f + '.js')
        s = open(p).read()
        total += len(re.findall(r'\?v=[\d.]+', s))
        s = re.sub(r'\?v=[\d.]+', '?v=' + new_v, s)
        s = re.sub(r'^(/\* ' + f + r'\.js) v[\d.]+', r'\1 v' + new_v, s,
                   count=1, flags=re.M)
        open(p, 'w').write(s)
    print('  js/*.js            %d ?v= strings + header versions' % total)

    # ---- manifest ----
    mp = os.path.join(ROOT, 'manifest.json')
    m = json.load(open(mp))
    m['version'] = new_v
    for ic in m.get('icons', []):
        ic['src'] = re.sub(r'\?v=[\d.]+', '', ic['src']) + '?v=' + new_v
    json.dump(m, open(mp, 'w'), indent=2)
    print('  manifest.json      version + icon srcs')

    # ---- verify nothing was missed ----
    stale = []
    for dirpath, _dirs, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith(('.html', '.js', '.json')):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                body = open(fp).read()
            except (UnicodeDecodeError, OSError):
                continue
            if '?v=' + old_v in body or "'tsbmii-v%s'" % old_v in body:
                stale.append(os.path.relpath(fp, ROOT))
    if stale:
        sys.exit('STALE VERSION STRINGS REMAIN in: %s' % ', '.join(stale))
    print('  verified           no %s references remain anywhere' % old_v)

    # ---- syntax check ----
    try:
        for f in JS_FILES + ['../service-worker']:
            p = (os.path.join(ROOT, 'js', f + '.js') if not f.startswith('..')
                 else os.path.join(ROOT, 'service-worker.js'))
            r = subprocess.run(['node', '--check', p],
                               capture_output=True, text=True)
            if r.returncode:
                sys.exit('SYNTAX ERROR in %s:\n%s' % (p, r.stderr[:400]))
        print('  syntax             all JS files OK')
    except FileNotFoundError:
        print('  syntax             skipped (node not installed)')

    print('\nDone. Commit and push — players receive %s automatically, '
          'no cache clearing.' % new_v)


if __name__ == '__main__':
    if len(sys.argv) != 2 or not re.match(r'^\d+\.\d+\.\d+$', sys.argv[1]):
        sys.exit('Usage: python3 bump_version.py 1.0.7')
    bump(sys.argv[1])
