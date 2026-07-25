# Deploying The Turrelle Sisters Big Munny II

## The files in this zip go at the REPOSITORY ROOT

After extracting, your repo must look like this:

    <repo root>/
      index.html          <-- MUST be here, not inside a folder
      manifest.json
      service-worker.js
      bump_version.py
      DEPLOY.md
      assets/
      js/

**NOT** like this:

    <repo root>/
      turrelle_big_munny_2/
        index.html        <-- WRONG: game will live at /turrelle_big_munny_2/
                              and the old build keeps being served at the root URL

## Verify the deploy actually landed

1. On github.com, open your repo and confirm `index.html` is listed at the top
   level (not inside a folder). Click it and search for `BUILD` — it should show
   the version you just deployed.
2. Confirm `assets/splash_screen.jpg` and `assets/banner_art_work.jpg` exist.
3. Load the game. The splash shows `BUILD x.y.z` — that is the build actually
   running. If it does not match what you deployed, the files did not land at the
   root, or an old service worker is still serving a cached shell.
4. To bypass any old cached shell for a one-off check, load the URL with a random
   query string, e.g. `https://<your-pages-url>/index.html?x=12345`

## Updating later

    python3 bump_version.py 1.1.0

Then commit and push. Players receive the update automatically — no cache clearing.
