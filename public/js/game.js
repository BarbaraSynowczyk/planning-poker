setInterval(() => {
    const el = document.getElementById("timer");
    if (!el) return;

    const endRaw = el.getAttribute("data-end");

    if (!endRaw) return;

    if (!endRaw || endRaw === "null") return;


    const end = Number(endRaw);
    if (isNaN(end)) return;

    let remaining = end - Date.now();

    if (remaining <= 0) {
        remaining = 0;
    }

    const seconds = Math.floor(remaining / 1000);

    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    document.getElementById("timer-text").innerText = `${mins}:${secs}`;

    const percent = 100 - Math.max((remaining / 60000) * 100, 0);
    document.getElementById("timer-progress").style.width = percent + "%";

}, 1000);

function clearSelectedCard() {
    document.querySelectorAll("#cards .poker-card.selected")
        .forEach(card => card.classList.remove("selected"));
}

window.startTimer = function () {
    const sessionId = document.getElementById("game-root").dataset.sessionId;

    fetch(`/session/${sessionId}/start`, {
        method: "POST"
    }).then(response => {
        if (!response.ok) return;

        clearSelectedCard();
    });
};

window.stopTimer = function () {

    fetch(window.location.pathname + "/stop", {
        method: "POST"
    });
};

window.reveal = function () {

    fetch(window.location.pathname + "/reveal", {
        method: "POST"
    });
};

document.addEventListener("click", (e) => {
    const card = e.target.closest(".poker-card");
    if (!card) return;

    const timer = document.getElementById("timer");
    const endRaw = timer?.getAttribute("data-end");
    const end = Number(endRaw);

    if (!endRaw || endRaw === "null" || !Number.isFinite(end)) {
        return;
    }

    if (Date.now() >= end) {
        return;
    }

    const sessionId = document.getElementById("game-root").dataset.sessionId;
    const value = card.innerText.trim();

    fetch(`/session/${sessionId}/vote?value=${encodeURIComponent(value)}`, {
        method: "POST"
    }).then(response => {
        if (!response.ok) return;

        document.querySelectorAll(".poker-card.selected")
            .forEach(selectedCard => selectedCard.classList.remove("selected"));

        card.classList.add("selected");
    });
});


document.addEventListener("DOMContentLoaded", () => {
    setInterval(() => {
        animateChart();
    }, 500);
});

function animateChart() {
    const bars = document.querySelectorAll(".bar");
    if (!bars.length) return;

    const maxHeight = 180;

    const max = Math.max(
        ...[...bars].map(b => Number(b.dataset.count))
    ) || 1;

    bars.forEach(bar => {
        const count = Number(bar.dataset.count);

        const height = (count / max) * maxHeight;

        bar.style.height = height + "px";
    });
}
document.addEventListener("click", (e) => {
    if (e.target.id === "save-btn") {

        const input = document.getElementById("estimate-input");
        const value = input?.value;

        if (!value) {
            alert("Enter value");
            return;
        }

        fetch(window.location.pathname + "/save-estimate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ value }),
        })
            .then(() => {
                alert("Saved to Jira");
            })
            .catch(() => {
                alert("Error");
            });
    }
});


function updateCardAvailability() {
    const timer = document.getElementById("timer");
    const cards = document.getElementById("cards");

    if (!timer || !cards) return;

    const endRaw = timer.getAttribute("data-end");
    const end = Number(endRaw);

    const votingActive =
        endRaw &&
        endRaw !== "null" &&
        Number.isFinite(end) &&
        Date.now() < end;

    cards.classList.toggle("voting-disabled", !votingActive);
}


document.addEventListener("DOMContentLoaded", () => {
    updateCardAvailability();

    const gameRoot = document.getElementById("game-root");
    let lastTimerEnd = document.getElementById("timer")?.getAttribute("data-end");

    if (gameRoot) {
        const observer = new MutationObserver(() => {
            updateCardAvailability();

            const timer = document.getElementById("timer");
            const currentTimerEnd = timer?.getAttribute("data-end");

            if (
                currentTimerEnd &&
                currentTimerEnd !== "null" &&
                currentTimerEnd !== lastTimerEnd
            ) {
                clearSelectedCard();
            }

            lastTimerEnd = currentTimerEnd;
        });

        observer.observe(gameRoot, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-end"]
        });
    }

    setInterval(updateCardAvailability, 250);
});