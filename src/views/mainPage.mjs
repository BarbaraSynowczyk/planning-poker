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
                      value="basiasynowczyk.atlassian.net"
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
