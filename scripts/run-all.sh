# node scripts/extract-html-articles.js

echo "(1 of 6) indexing articles"
# echo $(dirname $0)
# ${BASH_SOURCE[0]}
node "./reindex-articles.js"

# echo "(2 of 6) creating sitemap"
# node create-sitemap.js
#
# echo "(3 of 6) generating main assets"
# npx ./react-scripts build
#
# echo "(4 of 6) creating headers"
# node create-headers.js
#
# echo "(5 of 6) creating redirects"
# node create-redirects.js
#
# echo "(6 of 6) removing service worker files"
# rm -rf ../build/service-worker.js ../build/manifest.json ../build/asset-manifest.json

# echo "prerendering pages"
# node scripts/prerender-pages.js

# echo "saving articles.tgz"
# node scripts/archive-html-articles.js

# echo "copying prerendered .html files to build/"
# cp -R .prerender-cache/* build/
