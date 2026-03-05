import http from "http"

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("SERVER DZIALA")
})

server.listen(8080, () => {
    console.log("Server running http://localhost:8080")
})