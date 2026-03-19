export const login = async (req, res) => {
  const { email, password, domain } = req.body;

  const auth = Buffer.from(`${email}:${password}`).toString("base64");

  try {
    const response = await fetch(`https://${domain}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.render("main", {
          title: "Join Planning Poker",
          css: "/css/mainPage.css",
          error: "Invalid email or API token",
        });
      }

      if (response.status === 404) {
        return res.render("main", {
          title: "Join Planning Poker",
          css: "/css/mainPage.css",
          error: "Domain not found",
        });
      }

      return res.render("main", {
        title: "Join Planning Poker",
        css: "/css/mainPage.css",
        error: "Cannot connect to Jira",
      });
    }

    res.redirect("/game");
  } catch {
    return res.render("main", {
      title: "Join Planning Poker",
      description:
        "Collaborative planning poker tool for agile teams using Jira.",
      css: "/css/mainPage.css",
      error: "Server error",
    });
  }
};
