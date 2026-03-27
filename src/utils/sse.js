import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { formatDate, timeAgo } from "../utils/dataHelpers.js";

handlebars.registerHelper("formatDate", formatDate);
handlebars.registerHelper("timeAgo", timeAgo);

handlebars.registerHelper("formatTime", (ms) => {
    if (!ms || ms < 0) return "00:00";

    const seconds = Math.floor(ms / 1000);
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${mins}:${secs}`;
});


function registerPartials(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            registerPartials(fullPath);
        } else if (file.endsWith(".hbs")) {
            const name = path.basename(file, ".hbs");
            const template = fs.readFileSync(fullPath, "utf-8");

            handlebars.registerPartial(name, template);
        }
    });
}

registerPartials(path.resolve("src/views/partials"));

const playersTemplate = handlebars.compile(
    fs.readFileSync(path.resolve("src/views/partials/game/playersTable.hbs"), "utf-8")
);

const taskTemplate = handlebars.compile(
    fs.readFileSync(path.resolve("src/views/partials/game/userTicketPreview.hbs"), "utf-8")
);

const timerTemplate = handlebars.compile(
    fs.readFileSync(path.resolve("src/views/partials/timer.hbs"), "utf-8")
);

export function broadcast(session) {
    if (!session.clients) return;

    const html = render(session);

    session.clients.forEach(client => {
        client.patchElements(html);
    });
}

export function render(session) {

    console.log("RENDER TIMER:", session.timerEnd);
    console.log("📡 RENDER VOTES:", session.votes);

    const playersWithVotes = session.players.map(p => ({
        ...p,
        vote: session.votes[p.accountId] || null
    }));

    const playersHtml = playersTemplate({
        players: playersWithVotes,
        revealed: session.revealed
    });

    console.log("REVEALED:", session.revealed);
    console.log("PLAYERS:", playersWithVotes);


    const taskHtml = session.activeTask
        ? taskTemplate({ task: session.activeTask })
        : `<div id="task-container" data-merge="outerHTML">
             <div class="text-secondary">No task selected</div>
           </div>`;

    const timerHtml = timerTemplate({
        timerEnd: session.timerEnd,
        remaining: session.remaining,
        isModerator: true
    });

    return `
        ${timerHtml}
        ${playersHtml}
        ${taskHtml}
    `;
}