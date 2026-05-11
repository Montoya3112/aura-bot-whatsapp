#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Descarga el navegador internamente en la carpeta del proyecto
npx puppeteer browsers install chrome