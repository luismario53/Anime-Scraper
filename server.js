const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Función para descargar una imagen desde una URL
const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const request = protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

// Manejador de solicitudes HTTP
const requestHandler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    // Responder a la solicitud preflight de CORS
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Length': 0
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/download-images') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const urls = JSON.parse(body).urls;
      const anime = JSON.parse(body).anime;
      if (!fs.existsSync('images/${anime}')) {
        fs.mkdirSync(`images/${anime}`);
      }

      const promises = urls.map((url, index) => {
        const filename = `image_${index + 1}${path.extname(new URL(url).pathname)}`;
        return downloadImage(url, path.join(`images/${anime}`, filename));
      });
      try {
        await Promise.all(promises);
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (error) {
        res.writeHead(500, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ status: 'error', message: error.message }));
      }
    });
  } else {
    res.writeHead(404, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain'
    });
    res.end('Not Found');
  }
};

// Crear y ejecutar el servidor HTTP
const server = http.createServer(requestHandler);
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});



// Función para crear y descargar un archivo .txt con las URLs

// function downloadTextFile(content, filename) {
//   const blob = new Blob([content], { type: 'text/plain' });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.style.display = 'none';
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
// }

// const urls = getImageUrls();
// const content = urls.join('\n');
// downloadTextFile(content, 'urls.txt');