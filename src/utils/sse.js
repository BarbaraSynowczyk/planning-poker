import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { formatDate, timeAgo } from "../utils/dataHelpers.js";

handlebars.registerHelper("formatDate", formatDate);
handlebars.registerHelper("timeAgo", timeAgo);
handlebars.registerHelper("eq", (a, b) => a === b);
handlebars.registerHelper("multiply", (a, b) => {
    if (!b) return 0;
    return (a / b) * 100;
});

handlebars.registerHelper("and", (a, b) => a && b);

handlebars.registerHelper("formatTime", (ms) => {
    if (!ms || ms < 0) return "00:00";

    const seconds = Math.floor(ms / 1000);
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${mins}:${secs}`;
});


handlebars.registerHelper("range", (from, to) => {
    const arr = [];
    for (let i = to; i >= from; i--) {
        arr.push(i);
    }
    return arr;
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

const resultsTemplate = handlebars.compile(
    fs.readFileSync(path.resolve("src/views/partials/game/results.hbs"), "utf-8")
);

export function broadcast(session) {
    if (!session.clients) return;

    const html = render(session);

    session.clients.forEach(client => {
        client.patchElements(html);
    });
}

export function render(session) {

    const playersWithVotes = session.players.map(p => ({
        ...p,
        vote: session.votes[p.accountId] || null
    }));

    const voteCounts = {};
    const votesArray = Object.values(session.votes)
        .map(v => Number(v))
        .filter(v => !isNaN(v));

    votesArray.forEach(v => {
        voteCounts[v] = (voteCounts[v] || 0) + 1;
    });


    const cards = session.cards || [];

    const chartData = cards.map(card => ({
        value: card,
        count: voteCounts[card] || 0
    }));

    const counts = chartData.map(c => c.count);
    const maxCount = counts.length ? Math.max(...counts) : 0;
    const safeMaxCount = maxCount === 0 ? -1 : maxCount;

    const votedCount = votesArray.length;
    const totalPlayers = session.players.length;
    const notVoted = session.players.filter(
        p => !session.votes[p.accountId]
    ).length;

    let median = "-";

    if (votesArray.length) {
        const sorted = [...votesArray].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        let avg;

        if (sorted.length % 2 !== 0) {
            avg = sorted[mid];
        } else {
            avg = (sorted[mid - 1] + sorted[mid]) / 2;
        }

        median = session.cards.reduce((closest, card) => {
            if (Math.abs(card - avg) === Math.abs(closest - avg)) {
                return card > closest ? card : closest;
            }
            return Math.abs(card - avg) < Math.abs(closest - avg)
                ? card
                : closest;
        });
    }

    const playersHtml = playersTemplate({
        players: playersWithVotes,
        revealed: session.revealed,
        chartData,
        maxCount,
        median,
        votedCount,
        totalPlayers,
        safeMaxCount,
        notVoted
    });

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

    const resultsHtml = session.revealed
        ? `
        <div id="results-container" data-merge="outerHTML">
            ${resultsTemplate({
            chartData,
            maxCount,
            median,
            votedCount,
            totalPlayers,
            revealed: session.revealed,      
            isModerator: true
        })}
        </div>
      `
        : `<div id="results-container" data-merge="outerHTML"></div>`;

    return `
        ${timerHtml}
        ${playersHtml}
        ${taskHtml}
        ${resultsHtml}
    `;
}