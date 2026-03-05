export class Game {

    constructor(){
        this.players = []
        this.counter = 0
        this.clients = []
    }

    debug(...args){
        console.log(new Date().toISOString(), ...args)
    }

    addPlayer(name){
        if(name && !this.players.includes(name)){
            this.players.push(name)
            this.debug("PLAYER ADDED:", name)
        }
    }

    plus(){
        this.counter++
        this.debug("PLUS counter=", this.counter)
        this.broadcast()
    }

    minus(){
        this.counter--
        this.debug("MINUS counter=", this.counter)
        this.broadcast()
    }

    addClient(res){
        this.clients.push(res)
        this.debug("SSE CLIENT CONNECTED total=", this.clients.length)
    }

    removeClient(res){
        this.clients = this.clients.filter(c => c !== res)
        this.debug("SSE CLIENT DISCONNECTED total=", this.clients.length)
    }

    broadcast(){

        const html = this.renderGameState()

        this.debug("HTML PATCH:", html)
        this.debug("BROADCAST counter=", this.counter, "clients=", this.clients.length)


        const payload = html
            .split("\n")
            .map(line => `data: ${line}`)
            .join("\n")

        const message =
            `event: patch
${payload}

`

        for(const client of this.clients){
            this.debug("SEND UPDATE")
            client.write(message)
        }
    }

    renderGameState(){

        const players = this.players.map(p => `<li>${p}</li>`).join("")

        return `<div id="game-state" data-merge="outerHTML">

        <ul>
        ${players}
        </ul>
        
        <p>
        Counter: ${this.counter}
        </p>
        
        </div>`
    }

}