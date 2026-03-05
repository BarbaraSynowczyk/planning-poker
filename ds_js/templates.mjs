export function indexPage(){
    return `
<!DOCTYPE html>
<html>

<body>

<h1>Planning Poker</h1>

<form method="POST" action="/join">

<input name="userName" placeholder="nickname" required>

<button>Join</button>

</form>

</body>

</html>
`
}



export function gamePage(userName, game){

    const players = game.players.map(p => `<li>${p}</li>`).join("")

    return `
<!DOCTYPE html>
<html>

<head>

<script type="module"
src="https://cdn.jsdelivr.net/npm/@starfederation/datastar/dist/datastar.js">
</script>
<script>

// debug Datastar patch
document.addEventListener("datastar:patch", e => {
    console.log("PATCH RECEIVED", e)
})

// debug kliknięć
document.addEventListener("click", e => {
    console.log("CLICK", e.target)
})

console.log("PAGE LOADED")

</script>

</head>

<body>

<h1>Welcome ${userName}</h1>

<main data-init="@get('/game/updates')">

<div id="game-state" data-merge="outerHTML">

<ul>
${players}
</ul>

<p>
Counter: ${game.counter}
</p>

</div>

<button data-on-click="@post('/game/plus')">+1</button>
<button data-on-click="@post('/game/minus')">-1</button>

</main>

<script>

// debug Datastar patch
document.addEventListener("datastar:patch", e => {
    console.log("PATCH RECEIVED", e)
})

// debug kliknięć
document.addEventListener("click", e => {
    console.log("CLICK", e.target)
})

console.log("PAGE LOADED")

// DEBUG SSE CONNECTION
// const es = new EventSource("/game/updates")
//
// es.onopen = () => console.log("SSE OPEN")
//
// es.onerror = e => console.log("SSE ERROR", e)
//
// es.onmessage = e => console.log("SSE MESSAGE", e.data)

</script>

</body>

</html>
`
}