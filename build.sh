#!/bin/bash
npm run build
mkdir -p server/public
cp -r dist/public/* server/public/
chmod +x dist/index.js