#!/usr/bin/env sh
# Renders the PWA icons from the SVG sources in public/icons/. Needs ImageMagick 7 (`magick`).
# The PNGs are committed, so CI doesn't need ImageMagick. Re-run after editing an SVG.
set -eu
cd "$(dirname "$0")/../public/icons"

render() { # <svg> <size> <out.png>
  magick -density 384 -background none "$1" -resize "$2x$2" -depth 8 -strip "$3"
}

render icon.svg 192 icon-192.png
render icon.svg 512 icon-512.png
render icon-maskable.svg 512 icon-maskable-512.png
# iOS rounds the corners itself and shows transparency as black, so use the full-bleed art.
render icon-maskable.svg 180 apple-touch-icon.png
