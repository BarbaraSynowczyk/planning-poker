import express from "express"
import {mainPage} from "./views/components/templates.mjs";
import {gamePage} from "./views/components/templates.mjs";
import { Game } from "./views/pages/game.mjs"

const game = new Game()
const main = express()

main.use(express.static("public"))
main.use(express.urlencoded({ extended: true }))

main.get("/", (req, res)=>{

    res.send(mainPage())
})

main.post("/login", async (req, res) => {

    const { email, token, domain } = req.body

    const auth = Buffer
        .from(`${email}:${token}`)
        .toString("base64")

    try {
        const response = await fetch(
            `https://${domain}/rest/api/3/myself`,
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    Accept: "application/json",
                    // "User-Agent": "planning-poker-app"
                }
            }
        )

        if (!response.ok) {

            if(response.status === 401){
                return res.send(mainPage("Invalid email or API token"))
            }

            if(response.status === 404){
                return res.send(mainPage("Domain not found"))
            }

            return res.send(mainPage("Cannot connect to Jira. Check your domain"))
        }

        const data = await response.json()

        const userName = data.displayName
        const avatar = data.avatarUrls["24x24"]

        game.addPlayer(userName)

        res.redirect(`/game?userName=${encodeURIComponent(userName)}&avatar=${encodeURIComponent(avatar)}`)


    } catch (error) {
        console.error(error)
        return res.send(mainPage("Cannot connect to Jira. Check your domain."))
    }


})

main.get("/game", (req, res) => {

    const userName = req.query.userName
    const avatar = req.query.avatar

    res.send(gamePage(userName, avatar, game))
})

main.listen(8080, () => {
    console.log("Server działa na http://localhost:8080")
})

main.get("/game/updates", (req, res) => {

    res.writeHead(200,{
        "Content-Type":"text/event-stream",
        "Cache-Control":"no-cache",
        "Connection":"keep-alive"
    })


    res.flushHeaders?.()
    game.addClient(res)


    const html = game.renderGameState()

    const payload = html
        .split("\n")
        .map(line => `data: ${line}`)
        .join("\n")

    res.write(`event: patch
${payload}

`)

    const interval = setInterval(()=>{
        res.write(": heartbeat\n\n")
    },20000)

    req.on("close",()=>{
        clearInterval(interval)
        game.removeClient(res)
    })


})

main.post("/game/vote", (req,res)=>{

    const player = req.body.player
    const value = req.body.value

    game.vote(player, value)

    res.sendStatus(204)
})