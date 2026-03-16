export function mainPage(error = "") {
  return `<!DOCTYPE html>
    <html>
    <head>
    <title>Planning Poker - Log in</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FAC248' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='7.5' cy='15.5' r='5.5'/%3E%3Cpath d='M21 2l-9.6 9.6'/%3E%3Cpath d='M15 6l3 3'/%3E%3Cpath d='M18 3l3 3'/%3E%3C/svg%3E">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
      <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.8/bundles/datastar.js"></script>
      <link href="/css/mainPage.css" rel="stylesheet"/>
   </head>
    <body>
    <div class="container vh-100 d-flex flex-column justify-content-center align-items-center">
      <div class="mx-2 my-3">
         <img src="/images/logo.png" id="logo" alt="logo_with_title">
      </div>
      <div class="w-75 d-flex flex-column justify-content-center align-items-center mx-2 my-2 form-wrapper">
         <form method="POST" action="/login">
             <div class="token-input w-50 d-flex align-items-center gap-2 px-3 py-2 my-2">
                   <span class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#56C5FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    </span>
                   <input
                      type="text"
                      name="domain"
                      class="form-control border-0 bg-transparent text-white"
                      placeholder="Enter domain (e.g. company.atlassian.net)"
                      id="domain"
                      required>
            </div>
            <div class="token-input w-50 d-flex align-items-center gap-2 px-3 py-2 my-2">
               <span class="input-icon text-secondary">@</span>
               <input
                    type="email"
                    name="email"
                    class="form-control text-white bg-transparent border-0"
                    placeholder="Enter your email"
                    id="email"
                    required>
            </div>
            <div class="token-input w-50 d-flex align-items-center gap-2 px-3 py-2 my-2 ">
               <span class="input-icon">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAC248" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5"></circle>
                <path d="M21 2l-9.6 9.6"></path>
                <path d="M15 6l3 3"></path>
                <path d="M18 3l3 3"></path>
                </svg>
                </span>
               <input 
                   type="password"
                   name="token"
                   class="form-control border-0 bg-transparent text-white"
                   placeholder="Enter your Atlassian token"
                   id="token"
                   required>
            </div>
            <button type="submit" id="btn" class="btn my-4 text-nowrap text-light fs-5 w-50 d-flex justify-content-center align-items-center gap-2 p-2">
            <span><img src="/images/jira_logo.png" id="logo_jira"/></span>Login with Jira</button>
            <p class="text-secondary my-2 text-nowrap text-center">
                Sign in using your Atlassian token to log in
            </p>

<div class="login-error-container">
    ${
      error
        ? `
    <div class="login-error" id="loginError">
        <div class="error-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M3 21h18L12 3 3 21z"
                stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>

        <div class="error-text">${error}</div>
    </div>
    `
        : ""
    }
</div>
         </form>
      </div>
    </div>
    </body>
</html>`;
}

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

export function moderatorPage(userName, avatar, filters = [], tasks = []) {
  const projects = {};

  tasks.forEach((task) => {
    if (!projects[task.project]) {
      projects[task.project] = [];
    }
    projects[task.project].push(task);
  });

  const analyzeTasks = tasks.filter((t) => t.status === "Do zrobienia");
  const estimateTasks = tasks.filter((t) => t.status === "W trakcie");
  const estimatedTasks = tasks.filter((t) => t.status === "Gotowe");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Planning Poker - moderator</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <link href="css/moderatorPage.css" rel="stylesheet" />
    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🛡️%3C/text%3E%3C/svg%3E"
    />
  </head>
    <body>
    <div class="container-fluid">
    <!-- HEADER -->
    <div class="px-5">
    <div
    class="d-flex align-items-center justify-content-between mt-5 mb-4 flex-nowrap"
    >
    <div class="col-auto d-flex align-items-center gap-4">
    <img src="images/logo_without_title.png" id="logo_without_title" />
    <h4 class="text-white">Planning Poker Session</h4>
    <div
    class="user-role rounded-3 py-1 px-2 d-flex align-items-center fs-6"
    >
    <p class="text-secondary mb-0 fw-semibold">moderator mode</p>
    </div>
    </div>
          <div class="col-auto ms-auto d-flex align-items-center gap-2">
            <img id="userImage" src="${avatar}" alt="avatar" />
            <h5 class="text-secondary m-0">${userName}</h5>
          </div>
        </div>
      </div>
      <hr class="text-secondary" />
      <!-- FILTER BAR -->
      <div class="container-fluid select-bar rounded-3 my-4">
        <div
          class="d-flex justify-content-between align-items-center flex-nowrap gap-3"
        >
          <div class="jira-dropdown">
            <button class="jira-dropdown-btn">
              <span class="selected fs-5">Select Filter</span>
              <span class="arrow"></span>
            </button>
            <div class="jira-dropdown-menu">
              ${filters
                .map(
                  (f) => `
              <div class="jira-option" data-jql="${f.jql}">${f.name}</div>
              `,
                )
                .join("")}
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="text-secondary fs-5 fw-semibold"> SESSION LINK: </span>
            <input
              id="session-link"
              type="text"
              class="form-control text-light fs-5 session-input w-auto"
              value="https://planning-poker/jira_project"
              readonly
            />
            <button
              class="btn copy-btn btn-sm fs-6 px-3 py-2 rounded-3"
              onclick="copyLink()"
            >
              <span class="icon">📋</span>
              Copy Link
            </button>
          </div>
        </div>
      </div>
      <!-- MAIN CONTENT -->
      <div class="container-fluid main-layout">
        <div class="row g-4">
          <!-- KANBAN -->
          <div id="kanbanColumn" class="col-12 col-xl-12">
            <div class="kanban-container">
              <!-- HEADERS -->

              <div class="row kanban-head mb-3">
                <div class="col-12 col-md-4">
                  <div
                    class="kanban-header analyze text-light fw-semibold fs-5"
                  >
                    To Analyze <span class="count">${analyzeTasks.length}</span>
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div
                    class="kanban-header estimate text-light fw-semibold fs-5"
                  >
                    To Estimate <span class="count">${estimateTasks.length}</span>
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div
                    class="kanban-header estimated text-light fw-semibold fs-5"
                  >
                    Estimated <span class="count">${estimatedTasks.length}</span>
                  </div>
                </div>
              </div>

              <!-- FEATURE -->

${Object.entries(projects)
  .map(([projectName, projectTasks]) => {
    const analyze = projectTasks.filter((t) => t.status === "Do zrobienia");
    const estimate = projectTasks.filter((t) => t.status === "W trakcie");
    const estimated = projectTasks.filter((t) => t.status === "Gotowe");

    return `

<div class="feature-box">

<div class="text-secondary fw-semibold fs-5 mb-3">
${projectName}
</div>

<div class="row g-3">

<!-- ANALYZE -->

<div class="col-12 col-md-4 kanban-column analyze-column">

${analyze
  .map(
    (task) => `
<div class="task-card">

<div class="fs-5 text-light fw-semibold">
${task.key}
</div>

<div class="my-3 text-light">
${task.name}
</div>

<div class="task-footer">
<span class="bg-warning tag fw-semibold">
needs analysis
</span>

<span class="points">
${task.storyPoints ?? "-"}
</span>
</div>

</div>
`,
  )
  .join("")}

</div>


<!-- ESTIMATE -->

<div class="col-12 col-md-4 kanban-column estimate-column">

${estimate
  .map(
    (task) => `
<div class="task-card active">

<div class="task-top">
<span class="fs-5 text-light fw-semibold">
${task.key}
</span>

<span class="tag info">
Active ticket
</span>
</div>

<div class="my-3 text-light">
${task.name}
</div>

<div class="task-footer">
<span class="points">
${task.storyPoints ?? "-"}
</span>
</div>

</div>
`,
  )
  .join("")}

</div>


<!-- ESTIMATED -->

<div class="col-12 col-md-4 kanban-column estimated-column">

${estimated
  .map(
    (task) => `
<div class="task-card">

<div class="fs-5 text-light fw-semibold">
${task.key}
</div>

<div class="my-3 text-light">
${task.name}
</div>

<div class="task-footer">
<span class="points">
${task.storyPoints ?? "-"}
</span>
</div>

</div>
`,
  )
  .join("")}

</div>

</div>
</div>

`;
  })
  .join("")}
          <!-- TICKET PREVIEW -->
          <div id="ticketPreview" class="col-12 col-xl-3 ticket-preview">
            <div>
              <button class="close-preview" id="closePreview">✕</button>
              <h4 class="preview-title">Active ticket preview</h4>
              <div class="ticket-header">
                <div class="ticket-id fs-4 fw-semibold">PLJ-134</div>
                <div class="ticket-name fs-6 text-light">
                  Optimize search performance
                </div>
                <span class="ticket-status fw-semibold fs-6">
                  To Estimate
                </span>
              </div>
              <div class="ticket-meta">
                <div class="ticket-left">
                  <div>
                    <b class="text-secondary fs-6">Story Points</b>
                  </div>
                  <div class="description-label">
                    <b class="text-secondary fs-6">Description</b>
                  </div>
                </div>
                <div class="ticket-right text-light">
                  <div class="my-2">Created: yesterday</div>
                  <div class="my-2">Updated: 1 hours ago</div>
                  <div class="my-2">Date: 03.01.2025</div>
                </div>
              </div>
              <div class="ticket-description text-secondary">
                <ul>
                  <li>Investigate slow search response times</li>
                  <li>Optimize database queries</li>
                  <li>Implement caching strategy</li>
                </ul>
              </div>
              <div class="ticket-comment">
                <img src="avatar.png" class="avatar" />
                <div class="comment-bubble text-light">
                  <span class="comment-author"> Anna K. </span>
                  Let’s change the description.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>
      /*####################################### AI GENEREATED #######################################*/
      function copyLink() {
        const input = document.querySelector(".session-input");
        navigator.clipboard.writeText(input.value);
      }

      const dropdown = document.querySelector(".jira-dropdown");
      const btn = dropdown.querySelector(".jira-dropdown-btn");
      const options = dropdown.querySelectorAll(".jira-option");
      const selected = dropdown.querySelector(".selected");

      btn.onclick = () => {
        dropdown.classList.toggle("open");
      };

      options.forEach((option) => {
        option.onclick = () => {
          selected.textContent = option.textContent;
          dropdown.classList.remove("open");
        };
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      });

      const cards = document.querySelectorAll(".task-card");
      const preview = document.getElementById("ticketPreview");
      const closeBtn = document.getElementById("closePreview");

      cards.forEach((card) => {
        card.addEventListener("click", () => {
          // pokaż preview
          preview.classList.add("active");

          // usuń active z innych kart
          cards.forEach((c) => c.classList.remove("active"));

          // zaznacz klikniętą
          card.classList.add("active");
        });
      });

      closeBtn.addEventListener("click", () => {
        preview.classList.remove("active");

        cards.forEach((c) => c.classList.remove("active"));
      });

      document.addEventListener("DOMContentLoaded", () => {
        const cards = document.querySelectorAll(".task-card");
        const preview = document.getElementById("ticketPreview");
        const closeBtn = document.getElementById("closePreview");
        const kanban = document.getElementById("kanbanColumn");

        cards.forEach((card) => {
          card.addEventListener("click", () => {
            preview.style.display = "block";

            kanban.classList.remove("col-xl-12");
            kanban.classList.add("col-xl-9");

            cards.forEach((c) => c.classList.remove("active"));
            card.classList.add("active");
          });
        });

        closeBtn.addEventListener("click", () => {
          preview.style.display = "none";

          kanban.classList.remove("col-xl-9");
          kanban.classList.add("col-xl-12");

          cards.forEach((c) => c.classList.remove("active"));
        });
      });

      /*##############################################################################################*/
    </script>
  </body>
</html>
`;
}
