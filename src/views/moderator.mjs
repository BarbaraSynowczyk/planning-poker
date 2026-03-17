export function moderatorPage(userName, avatar, filters = [], tasks = []) {

    const tasksWithFeature = tasks.filter(
        t => t.feature && t.feature !== "No Feature"
    );

    const features = {};

    tasksWithFeature.forEach(task => {
        const feature = task.feature;

        if (!features[feature]) {
            features[feature] = [];
        }

        features[feature].push(task);
    });

    const analyze = tasksWithFeature.filter((t) =>
        t.labels && t.labels.length > 0
    );

    const estimate = tasksWithFeature.filter((t) =>
        !t.storyPoints && (!t.labels || t.labels.length === 0)
    );

    const estimated = tasksWithFeature.filter((t) =>
        t.storyPoints
    );

    function formatDate(dateString) {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("pl-PL");
    }

    function timeAgo(dateString) {
        if (!dateString) return "-";

        const now = new Date();
        const date = new Date(dateString);
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return "just now";
        if (diff < 3600) return Math.floor(diff / 60) + " min ago";
        if (diff < 86400) return Math.floor(diff / 3600) + " h ago";

        return Math.floor(diff / 86400) + " days ago";
    }

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
<div class="select-bar rounded-3 my-4">
        <div
          class="d-flex align-items-center justify-content-between"
        >
        <div class="select-left">
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
               <div class="jql-snippet">

  <span class="jql-label me-4 fs-5">JQL</span>

  <code id="jqlCode" class="jql-code me-2 fs-6">
  </code>

  <button class="jql-view-btn fs-6" onclick="openJql()">
    view
  </button>

</div>
        </div>
        <div class="select-right">
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
                  <div class="kanban-header analyze text-light fw-semibold fs-5">
  To Analyze <span class="count">${analyze.length}</span>
</div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="kanban-header estimate text-light fw-semibold fs-5">
  To Estimate <span class="count">${estimate.length}</span>
</div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="kanban-header estimated text-light fw-semibold fs-5">
  Estimated <span class="count">${estimated.length}</span>
</div>
                </div>
              </div>

              <!-- FEATURE -->

${Object.entries(features).length === 0 ? "" : Object.entries(features)
      .map(([featureName, featureTasks]) => {

          const analyze = featureTasks.filter((t) =>
              t.labels && t.labels.length > 0
          );

          const estimate = featureTasks.filter((t) =>
              !t.storyPoints && (!t.labels || t.labels.length === 0)
          );

          const estimated = featureTasks.filter((t) =>
              t.storyPoints
          );

          return `

<div class="feature-box my-2">

<div class="text-secondary fw-semibold fs-5 mb-3">
${featureTasks[0]?.featureKey ?? ""} ${featureName}
</div>

<div class="row g-3">

<!-- ANALYZE -->

<div class="col-12 col-md-4 kanban-column analyze-column">

${analyze
  .map(
    (task) => `
<div 
  class="task-card"
  data-key="${task.key}"
  data-name="${task.name}"
  data-points="${task.storyPoints ?? "-"}"
  data-labels="${task.labels?.join(", ") ?? ""}"
  data-description="${task.description ?? ""}"
  data-created="${task.created ?? ""}"
data-updated="${task.updated ?? ""}"
>

<div class="fs-5 text-light fw-semibold">
${task.key}
</div>

<div class="my-3 text-light">
${task.name}
</div>

<div class="task-footer">
<span class="bg-warning tag fw-semibold">
${task.labels?.map(label => `
<span class="bg-warning tag fw-semibold">
${label}
</span>
`).join("") ?? ""}
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
<div 
  class="task-card"
  data-key="${task.key}"
  data-name="${task.name}"
  data-points="${task.storyPoints ?? "-"}"
  data-labels="${task.labels?.join(", ") ?? ""}"
  data-description="${task.description ?? ""}"
  data-created="${task.created ?? ""}"
data-updated="${task.updated ?? ""}"
>
<div class="task-top">
<span class="fs-5 text-light fw-semibold">
${task.key}
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
<div 
  class="task-card"
  data-key="${task.key}"
  data-name="${task.name}"
  data-points="${task.storyPoints ?? "-"}"
  data-labels="${task.labels?.join(", ") ?? ""}"
  data-description="${task.description ?? ""}"
  data-created="${task.created ?? ""}"
    data-updated="${task.updated ?? ""}"
>

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
         
      </div>
    </div>
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
        <div class="jql-overlay" id="jqlOverlay">

  <div class="jql-modal">
    <div class="jql-modal-header">
      <h3>Filter JQL</h3>
    </div>

    <div class="jql-code-box">

<pre id="jqlModalCode">
</pre>

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

  const jqlCode = document.getElementById("jqlCode");
  let currentJql = "";
  
options.forEach((option) => {
  option.onclick = () => {

    const jql = option.dataset.jql;
    currentJql = jql;

    selected.textContent = option.textContent;

    jqlCode.innerHTML = highlightJql(jql);
    document.querySelector(".jql-snippet").classList.add("active");

    dropdown.classList.remove("open");
  };
});


function highlightJql(jql){

  const keywords = [
    "AND","OR","NOT","IN","ORDER","BY","DESC","ASC","IS","EMPTY"
  ];

  let html = jql;

  // keywords
  keywords.forEach(k=>{
    const r = new RegExp('\\b'+k+'\\b','g');
    html = html.replace(r, '<span class="jql-key">'+k+'</span>');
  });

  // project names (np KAN)
html = html.replace(
  /\\b[A-Z]{2,10}\\b/g,
  '<span class="jql-project">$&</span>'
);

  return html;
}
      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      });
//   const closeBtn = document.getElementById("closePreview");
//   const kanban = document.getElementById("kanbanColumn");
//  
//
//
//  
// const cards = document.querySelectorAll(".task-card");
// const preview = document.getElementById("ticketPreview");


// document.addEventListener("DOMContentLoaded", () => {
//
//   const cards = document.querySelectorAll(".task-card");
//   const preview = document.getElementById("ticketPreview");
//   const closeBtn = document.getElementById("closePreview");
//   const kanban = document.getElementById("kanbanColumn");
//
//   cards.forEach((card) => {
//     card.addEventListener("click", () => {
//
//       console.log("CLICK działa");
//
//       const key = card.dataset.key;
//       const name = card.dataset.name;
//       const labels = card.dataset.labels;
//       const points = card.dataset.points;
//       const created = card.dataset.created;
//       const updated = card.dataset.updated;
//
//       document.querySelector(".ticket-right").innerHTML =
//         "<div class='my-2'>Created: " + timeAgo(created) + "</div>" +
//         "<div class='my-2'>Updated: " + timeAgo(updated) + "</div>" +
//         "<div class='my-2'>Date: " + formatDate(created) + "</div>";
//
//       document.querySelector(".ticket-id").textContent = key;
//       document.querySelector(".ticket-name").textContent = name;
//
//       let status = "To Estimate";
//
//       if (labels && labels.length > 0) {
//         status = "To Analyze";
//       } else if (points && points !== "-") {
//         status = "Estimated";
//       }
//
//       document.querySelector(".ticket-status").textContent = status;
//
//       document.querySelector(".ticket-meta .ticket-left div:nth-child(1)")
//         .innerHTML = "<b class='text-secondary fs-6'>Story Points</b><br>" + (points || "-");
//
//       const descriptionContainer = document.querySelector(".ticket-description");
//       descriptionContainer.innerHTML = card.dataset.description || "No description";
//
//       preview.style.display = "block";
//
//       kanban.classList.remove("col-xl-12");
//       kanban.classList.add("col-xl-9");
//
//       cards.forEach((c) => c.classList.remove("active"));
//       card.classList.add("active");
//     });
//   });
//
//   closeBtn.addEventListener("click", () => {
//     preview.style.display = "none";
//
//     kanban.classList.remove("col-xl-9");
//     kanban.classList.add("col-xl-12");
//
//     cards.forEach((c) => c.classList.remove("active"));
//   });
//
// });


cards.forEach((card) => {
  card.addEventListener("click", () => {

    const key = card.dataset.key;
    const name = card.dataset.name;
    const labels = card.dataset.labels;
    const points = card.dataset.points;

    document.querySelector(".ticket-id").textContent = key;
    document.querySelector(".ticket-name").textContent = name;

    let status = "To Estimate";

    if (labels && labels.length > 0) {
      status = "To Analyze";
    } else if (points && points !== "-") {
      status = "Estimated";
    }

    document.querySelector(".ticket-status").textContent = status;

    document.querySelector(".ticket-meta .ticket-left div:nth-child(1)")
      .innerHTML = "<b class='text-secondary fs-6'>Story Points</b><br>" + (points || "-");

    const descriptionContainer = document.querySelector(".ticket-description");
    descriptionContainer.innerHTML = card.dataset.description || "No description";

    // 🔥 TO MUSI BYĆ
    preview.style.display = "block";

    kanban.classList.remove("col-xl-12");
    kanban.classList.add("col-xl-9");

    cards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
  });
});

// 👉 CLOSE BUTTON (POZA foreach!)
closeBtn.addEventListener("click", () => {
  preview.style.display = "none";

  kanban.classList.remove("col-xl-9");
  kanban.classList.add("col-xl-12");

  cards.forEach((c) => c.classList.remove("active"));
});
// 👉 CLICK NA KARTĘ
// cards.forEach((card) => {
//   card.addEventListener("click", () => {
//      
//       console.log("clicked");
//  
//
//     const key = card.dataset.key;
//     const name = card.dataset.name;
//     const labels = card.dataset.labels;
//     const points = card.dataset.points;
//     const created = card.dataset.created;
//     const updated = card.dataset.updated;
//    
// document.querySelector(".ticket-right").innerHTML =
//   "<div class='my-2'>Created: " + timeAgo(created) + "</div>" +
//   "<div class='my-2'>Updated: " + timeAgo(updated) + "</div>" +
//   "<div class='my-2'>Date: " + formatDate(created) + "</div>";
//        
//
//     document.querySelector(".ticket-id").textContent = key;
//     document.querySelector(".ticket-name").textContent = name;
//
//     let status = "To Estimate";
//
//     if (labels && labels.length > 0) {
//       status = "To Analyze";
//     } else if (points && points !== "-") {
//       status = "Estimated";
//     }
//
//     document.querySelector(".ticket-status").textContent = status;
//
//     document.querySelector(".ticket-meta .ticket-left div:nth-child(1)")
//       .innerHTML = "<b class='text-secondary fs-6'>Story Points</b><br>" + (points || "-");
//
//     const descriptionContainer = document.querySelector(".ticket-description");
//     descriptionContainer.innerHTML = card.dataset.description || "No description";
//
//     // 🔥 TO MUSI BYĆ
//     preview.style.display = "block";
//
//     kanban.classList.remove("col-xl-12");
//     kanban.classList.add("col-xl-9");
//
//     cards.forEach((c) => c.classList.remove("active"));
//     card.classList.add("active");
//   });
// });
//
// // 👉 CLOSE BUTTON (POZA foreach!)
// closeBtn.addEventListener("click", () => {
//   preview.style.display = "none";
//
//   kanban.classList.remove("col-xl-9");
//   kanban.classList.add("col-xl-12");
//
//   cards.forEach((c) => c.classList.remove("active"));
// });
//    

  
     
     const overlay = document.getElementById("jqlOverlay");
     

function openJql(){

  const modal = document.getElementById("jqlModalCode");

  if(!currentJql) return;

  modal.innerHTML = highlightJql(currentJql);

  overlay.style.display="flex";
}

function closeJql(){
  overlay.style.display="none";
}

overlay.addEventListener("click",(e)=>{
  if(e.target===overlay){
    closeJql();
  }
});

      /*##############################################################################################*/
    </script>
    <script src="https://unpkg.com/@atlaskit/renderer/dist/renderer.umd.js"></script>
  </body>
</html>
`;
}






