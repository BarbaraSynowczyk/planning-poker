## Finding the Story Points Field ID in Jira

The Story Points field ID may vary between Jira instances. Before configuring the application to save Story Points, identify the correct field ID for your Jira instance.

### Procedure

1. Log in to your Jira Cloud instance.
2. Open the following URL in your browser, replacing `YOUR-DOMAIN` with your Jira Cloud domain:

   ```text
   https://YOUR-DOMAIN.atlassian.net/rest/api/3/field
   ```

3. Authenticate with your Jira account if prompted. You must have permission to access the Jira REST API.
4. Search the JSON response for the Story Points field, which may be named `Story Points` or `Story point estimate`.
5. Find the corresponding `id` property. It typically has a format such as `customfield_10016`.

   Example:

   ```json
   {
     "id": "customfield_10016",
     "name": "Story Points"
   }
   ```

6. Use the field ID returned by your Jira instance in the application's configuration or Jira API request.

> **Note:** The example ID is illustrative only. Do not assume that `customfield_10016` is the correct ID for every Jira instance. Always verify the field ID in your own instance.

## ⚙️ Running the Project Locally

Follow the steps below to run the application on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/BarbaraSynowczyk/planning-poker.git
cd planning-poker/src
```

### 2. Install dependencies

Install the required Node.js packages:

```bash
npm install
```

### 3. Start the application

Run the following command to start the server:

```bash
npm start
```

### 4. Open the application in your browser

Once the server is running, open:

```text
http://localhost:8080
```

## 🧹 Code Quality

This project uses **ESLint** to maintain code quality and enforce consistent coding standards.

Run the linter with:

```bash
npm run lint
```