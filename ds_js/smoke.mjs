import http from "http"

function check(path){

    return new Promise(resolve => {

        const req = http.get(`http://localhost:8080${path}`, res => {

            console.log(path, res.statusCode)

            resolve()

        })

        req.on("error", err => {
            console.log(path, "ERROR:", err.message)
            resolve()
        })

    })

}

async function run(){

    await check("/")
    await check("/game")

    console.log("Smoke test finished")

}

run()