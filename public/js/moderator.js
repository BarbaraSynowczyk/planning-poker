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

    const startBtn = document.getElementById("startSessionBtn");
    const input = document.getElementById("session-link");

    document.querySelectorAll(".jira-option").forEach(option => {
        option.addEventListener("click", () => {
            const form = option.closest("form");
            const jql = form.querySelector('input[name="jql"]').value;

            document.getElementById("jqlCode").textContent = jql;
        });
    });
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

    document.addEventListener("click", (e) => {
        const card = e.target.closest(".task-card");
        if (!card) return;

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