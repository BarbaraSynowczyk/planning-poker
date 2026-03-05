import http from "http"
import {Game} from "./game.mjs"
import {indexPage, gamePage} from "./templates.mjs"

const game = new Game()

function debug(...args){
    console.log(new Date().toISOString(), ...args)
}

const server = http.createServer((req,res)=>{

    debug("REQUEST", req.method, req.url)

    const url = new URL(req.url,"http://localhost")


// INDEX
    if(req.method === "GET" && url.pathname === "/"){

        res.writeHead(200,{"Content-Type":"text/html"})
        res.end(indexPage())
        return
    }


// JOIN
    if(req.method === "POST" && url.pathname === "/join"){

        let body = ""

        req.on("data",chunk => body += chunk)

        req.on("end",()=>{

            const params = new URLSearchParams(body)
            const name = params.get("userName")

            debug("JOIN", name)

            game.addPlayer(name)

            res.writeHead(303,{Location:`/game?userName=${name}`})
            res.end()

            game.broadcast()
        })

        return
    }


// GAME PAGE
    if(req.method === "GET" && url.pathname === "/game"){

        const name = url.searchParams.get("userName")

        debug("GAME PAGE", name)

        if(name){
            game.addPlayer(name)
        }

        res.writeHead(200,{"Content-Type":"text/html"})
        res.end(gamePage(name,game))

        return
    }


// PLUS
    if(req.method === "POST" && url.pathname === "/game/plus"){

        debug("PLUS ENDPOINT HIT")

        game.plus()

        res.writeHead(200)
        res.end()

        return
    }


// MINUS
    if(req.method === "POST" && url.pathname === "/game/minus"){

        debug("MINUS ENDPOINT HIT")

        game.minus()

        res.writeHead(200)
        res.end()

        return
    }


// SSE
    if(req.method === "GET" && url.pathname === "/game/updates"){

        debug("SSE CONNECT")

        res.writeHead(200,{
            "Content-Type":"text/event-stream",
            "Cache-Control":"no-cache",
            "Connection":"keep-alive"
        })

        game.addClient(res)

        const html = game.renderGameState()

        const payload = html
            .split("\n")
            .map(line => `data: ${line}`)
            .join("\n")


        res.write(
            `event: patch
${payload}

`
        )

        req.on("close",()=>{
            debug("SSE CLOSED")
            game.removeClient(res)
        })

        return
    }

    res.writeHead(404)
    res.end("Not found")

})

server.listen(8080,()=>{
    debug("SERVER STARTED http://localhost:8080")
})