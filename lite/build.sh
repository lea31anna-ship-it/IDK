#!/bin/sh
# Baut die serverlosen Web-App-Versionen nach lite/dist/ (Kinder-App + Coach-Dashboard)
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/kinder dist/coach
cp kinder.html dist/kinder/sternenhuepfer.html
cp coach.html dist/coach/sternenhuepfer-coach.html
for d in kinder coach; do mkdir -p dist/$d/js dist/$d/css dist/$d/img; cp ../public/js/curriculum.js ../public/js/codec.js dist/$d/js/; cp ../public/img/icon.svg dist/$d/img/; done
cp ../public/js/app.js ../public/js/exercises.js dist/kinder/js/
cp ../public/css/app.css dist/kinder/css/
cp ../public/js/coach.js ../public/js/coach-lite.js dist/coach/js/
cp ../public/css/coach.css dist/coach/css/
echo "fertig: lite/dist"
