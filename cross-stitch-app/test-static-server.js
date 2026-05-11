const http = require('http')
const fs = require('fs')
const path = require('path')

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.zip': 'application/zip',
}

const ROOT = '/sandbox/.openclaw/workspace/cross-stitch-app/dist'

const server = http.createServer((req, res) => {
  // Strip query params and resolve path relative to ROOT
  const urlPath = req.url.split('?')[0]
  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath)
  
  // Safety: ensure we're serving from ROOT
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(ROOT)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  
  const ext = path.extname(resolved)
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('Not Found: ' + req.url)
      return
    }
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  })
})

server.listen(5556, () => console.log('Serving dist/ on :5557'))
