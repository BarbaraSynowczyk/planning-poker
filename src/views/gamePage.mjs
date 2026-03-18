export function gamePage(userName, avatar, gameState = "") {
    const cards = [1, 2, 3, 5, 8, 13, 21];

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Planning Poker Session</title>
         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
          <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.8/bundles/datastar.js"></script>
        <link href="css/gamePage.css" rel="stylesheet"/>
        <link rel="icon" type="image/png" href="/images/logo_without_title.png">
    </head>
    <body>
        <div class="container" data-init="@get('/game/updates')">
            <div>
                <div class="row align-items-center my-5 ">
                    <div class="col-auto d-flex align-items-center gap-4">
                    <img src=/images/logo_without_title.png" id="logo_without_title"/><h4 class="text-white">Planning Poker Session</h4></div>
                    <div 
                    id="user"
                    data-avatar="${avatar}"
                    data-user="${userName}" 
                    class="col-auto ms-auto d-flex align-items-center gap-2"><img id="userImage" src="${avatar}" alt="avatar_image"><h5 class="text-secondary m-0">${userName}</h5></div>
                </div>
                <div class="row">
                    <div class="col-7" >
                        <div id="game-state" data-merge="outerHTML" >${gameState}</div>
                        <div>
                            <hr class="text-secondary"/>
                            <p class="text-secondary text-center fs-5">Pick one card</p>
                            <div id="cards">
                                                    ${cards
        .map(
            (n) => `
                        <div class="poker-card" data-on:click="@post('/game/vote?player=${userName}&value=${n}')">
${n}
<span
class="dot"
>
</span>
</div>
                        `,
        )
        .join("")}
                        </div>
                        </div>
                    </div>
                    <div class="col-5">
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}