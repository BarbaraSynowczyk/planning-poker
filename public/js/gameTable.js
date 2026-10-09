(() => {
    const tableSelector = ".table-container";
    let testPlayersCount = 0;

    const names = [
        "Alex Morgan", "Jordan Lee", "Taylor Smith", "Charlie Brown",
        "Sam Wilson", "Jamie Parker", "Robin Taylor", "Casey Jones",
        "Riley Cooper", "Avery Johnson", "Drew Miller", "Morgan Davis",
        "Cameron White", "Skyler Martin", "Quinn Anderson", "Reese Clark",
        "Finley Lewis", "Rowan Walker", "Emerson Hall", "Harper Young"
    ];


    function arrangePlayers(table) {
        const players = [...table.querySelectorAll(".player-seat")];
        const count = players.length;

        const isMobile = window.innerWidth <= 575.98;
        const isMediumGroup = count >= 6 && count < 12;
        const isLargeGroup = count >= 12;

        table.classList.toggle("medium-group", isMediumGroup);
        table.classList.toggle("large-group", isLargeGroup);

        if (count === 0) {
            table.style.height = "360px";
            return;
        }

        // Use the available viewport width for larger groups.
        table.style.width = "100%";
        table.style.maxWidth = "100%";
        table.style.boxSizing = "border-box";

        const tableWidth = table.clientWidth;
        const seatWidth = isMobile
            ? (isLargeGroup ? 58 : isMediumGroup ? 68 : 76)
            : (isLargeGroup ? 76 : isMediumGroup ? 88 : 100);

        const seatHeight = isMobile
            ? (isLargeGroup ? 78 : isMediumGroup ? 88 : 100)
            : (isLargeGroup ? 100 : isMediumGroup ? 110 : 125);

        const tableHeight = Math.max(
            520,
            300 + count * (isMobile ? 27 : 25)
        );

        table.style.height = `${tableHeight}px`;

        const radiusX = Math.max(
            seatWidth,
            tableWidth / 2 - seatWidth / 2 - 20
        );

        const radiusY = Math.max(
            150,
            tableHeight / 2 - seatHeight / 2 - 20
        );

        players.forEach((player, index) => {
            const angle = (2 * Math.PI * index / count) - Math.PI / 2;

            player.style.left = `${50 + (Math.cos(angle) * radiusX / tableWidth) * 100}%`;
            player.style.top = `${50 + (Math.sin(angle) * radiusY / tableHeight) * 100}%`;
        });
    }

    function arrangeAllTables() {
        document.querySelectorAll(tableSelector).forEach(table => {
            arrangePlayers(table);
        });
    }

    function addTestPanel() {
        const table = document.querySelector(tableSelector);

        if (!table || document.getElementById("table-test-panel")) {
            return;
        }

        const panel = document.createElement("div");
        panel.id = "table-test-panel";
        panel.innerHTML = `
            <span>Test participants:</span>
            <button type="button" data-count="0">Real</button>
            <button type="button" data-count="3">3</button>
            <button type="button" data-count="5">5</button>
            <button type="button" data-count="8">8</button>
            <button type="button" data-count="12">12</button>
            <button type="button" data-count="20">20</button>
        `;

        table.parentElement.insertBefore(panel, table);

        panel.addEventListener("click", event => {
            const button = event.target.closest("button[data-count]");
            if (!button) return;

            testPlayersCount = Number(button.dataset.count);
            renderTestPlayers();
        });
    }

    function renderTestPlayers() {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        table.querySelectorAll("[data-test-player]").forEach(player => {
            player.remove();
        });

        const container = table.querySelector(".table-players");
        if (!container) return;

        for (let i = 0; i < testPlayersCount; i++) {
            const seat = document.createElement("div");
            seat.className = "player-seat";
            seat.dataset.testPlayer = "true";

            const card = document.createElement("div");
            card.className = "player-card text-white";
            card.textContent = "?";

            const dot = document.createElement("span");
            dot.className = "dot";
            card.appendChild(dot);

            const name = document.createElement("div");
            name.className = "player-name text-white my-2";
            name.textContent = names[i % names.length];

            seat.append(card, name);
            container.appendChild(seat);
        }

        arrangeAllTables();
    }


    function observeGameState() {
        const table = document.getElementById("game-state");
        if (!table) return;

        const parent = table.parentElement;
        let arrangeFrame = null;

        function refreshTable() {
            if (arrangeFrame !== null) {
                cancelAnimationFrame(arrangeFrame);
            }

            arrangeFrame = requestAnimationFrame(() => {
                arrangeAllTables();
                arrangeFrame = null;
            });
        }

        const mutationObserver = new MutationObserver(() => {
            refreshTable();
        });

        mutationObserver.observe(parent, {
            childList: true,
            subtree: true
        });

        const resizeObserver = new ResizeObserver(() => {
            refreshTable();
        });

        resizeObserver.observe(table);

        refreshTable();
    }

    window.addEventListener("resize", arrangeAllTables);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", observeGameState);
    } else {
        observeGameState();
    }
})();