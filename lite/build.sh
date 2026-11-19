#!/bin/sh
# Baut die serverlose Web-App-Version nach lite/dist/:
#   dist/kinder  – Lerniversum (Kinder-App mit eingebautem Coach-Login)
#   dist/coach   – eigenständiges Coach-Dashboard (optional)
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/kinder dist/coach
for d in kinder coach; do mkdir -p dist/$d/js dist/$d/css dist/$d/img; cp ../public/js/*.js dist/$d/js/; cp ../public/css/*.css dist/$d/css/; cp ../public/img/icon.svg dist/$d/img/; done
cp kinder.html dist/kinder/lerniversum.html
cp coach.html dist/coach/lerniversum-coach.html
echo "fertig: lite/dist"
