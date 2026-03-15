const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const host = process.argv[3] || "127.0.0.1";
const port = Number(process.argv[4] || "8081");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

function sendFile(filePath, response) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.statusCode = 404;
      response.end("Not Found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.setHeader(
      "Content-Type",
      mimeTypes[extension] || "application/octet-stream",
    );
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  let filePath = path.join(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.statusCode = 403;
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.access(filePath, fs.constants.F_OK, (accessError) => {
      if (accessError) {
        sendFile(path.join(root, "index.html"), response);
        return;
      }

      sendFile(filePath, response);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});
