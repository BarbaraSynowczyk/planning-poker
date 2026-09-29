// TODO: migrate this block to Datastar



document.addEventListener("DOMContentLoaded", () => {

    const dropdown = document.querySelector(".jira-dropdown");

    const btn = dropdown?.querySelector(".jira-dropdown-btn");
    const selected = dropdown?.querySelector(".selected");
    const closeBtn = document.getElementById("closePreview");
    const preview = document.getElementById("ticketPreview");
    const kanban = document.getElementById("kanbanColumn");

    const copyBtn = document.getElementById("copySessionBtn");
    const sessionInput = document.getElementById("session-link");

//    const root = document.getElementById("game-root");
//    const sessionId = root ? root.dataset.sessionId : null;


    const startBtn = document.getElementById("startSessionBtn");
    const input = document.getElementById("session-link");



//    if (startBtn && input) {
//        startBtn.addEventListener("click", async () => {
//            const res = await fetch("/create-session", {
//                method: "POST",
//                headers: {
//                    "Content-Type": "application/json",
//                },
//                body: JSON.stringify({
//                    jql: currentJql,
//                }),
//            });
//
//            const data = await res.json();
//
//            input.value = window.location.origin + data.link;
//        });
//    }

    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(sessionInput.value);

                copyBtn.textContent = "✅ Copied!";

                setTimeout(() => {
                    copyBtn.innerHTML = `<span class="icon">📋</span> Copy Link`;
                }, 1500);

            } catch (err) {
                console.error("Copy failed", err);
            }
        });
    }

    let currentSessionId = null;

//    async function generateSessionLink(task) {
//        if (!currentSessionId) {
//            const res = await fetch("/create-session", {
//                method: "POST",
//            });
//
//            const data = await res.json();
//
//            const link = data.link;
//            currentSessionId = link.split("/").pop();
//
//            const fullLink = window.location.origin + link;
//
//            document.getElementById("session-link").value = fullLink;
//
//            document
//                .querySelector(".session-link-container")
//                .classList.add("active");
//        }
//
//        await fetch(`/session/${currentSessionId}/active-task`, {
//            method: "POST",
//            headers: {
//                "Content-Type": "application/json",
//            },
//            body: new URLSearchParams({
//                    taskKey: task.key,
//            }),
//        });
//    }

    function showTaskPreview(task) {
        document.querySelector(".ticket-id").textContent = task.key;
        document.querySelector(".ticket-name").textContent = task.name;
        document.querySelector(".ticket-status").textContent = task.status;

        document.querySelector(".created").textContent =
            "Created: " + timeAgo(task.created);

        document.querySelector(".updated").textContent =
            "Updated: " + timeAgo(task.updated);

        document.querySelector(".story-points").innerHTML =
            "<b>Story Points</b> " + (task.storyPoints || "-");

        document.querySelector(".ticket-description").innerHTML =
            task.description || "No description";

        const commentsContainer = document.querySelector(".ticket-comments");
        commentsContainer.innerHTML = "";

        if (!task.comments || task.comments.length === 0) {
            commentsContainer.innerHTML = `<div class="text-secondary">No comments</div>`;
        } else {
            task.comments.forEach(c => {
                commentsContainer.innerHTML += `
                <div class="d-flex gap-2 my-3">
                    <img src="${c.avatar}" class="avatar" />
                    <div class="comment-bubble text-light">
                        <div class="d-flex justify-content-between">
                            <span class="comment-author">${c.author}</span>
                            <span class="text-secondary small">${c.created}</span>
                        </div>
                        <div class="mt-1">${c.text}</div>
                    </div>
                </div>
            `;
            });
        }

        document.querySelector(".date").textContent =
            "Date: " + (task.dueDate ? formatDate(task.dueDate) : "No due date");
    }

    document.addEventListener("click", async (e) => {
        const card = e.target.closest(".task-card");
        if (!card) return;

        const task = JSON.parse(
            decodeURIComponent(card.dataset.task || "{}")
        );


//        if (sessionId) {
//            await fetch(`/session/${sessionId}/active-task`, {
//                method: "POST",
//                headers: {
//                    "Content-Type": "application/json",
//                },
//                body: JSON.stringify({ task }),
//            });
//        }

        showTaskPreview(task);

        preview.style.display = "block";

        kanban.classList.remove("col-xl-12");
        kanban.classList.add("col-xl-9");

        document.querySelectorAll(".task-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            preview.style.display = "none";

            kanban.classList.remove("col-xl-9");
            kanban.classList.add("col-xl-12");

            document.querySelectorAll(".task-card").forEach(c => c.classList.remove("active"));
        });
    }

    if (btn && dropdown) {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("open");
        });
    }


    document.addEventListener("click", (e) => {
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    });
});

function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pl-PL");
}

function timeAgo(dateString) {
    if (!dateString) return "-";

    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + " min ago";
    if (diff < 86400) return Math.floor(diff / 3600) + " h ago";

    return Math.floor(diff / 86400) + " days ago";
}