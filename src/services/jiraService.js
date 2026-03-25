export async function isModerator(projectKey, accountId, domain, auth) {
    const r = await fetch(`https://${domain}/rest/api/3/project/${projectKey}`, {
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
        },
    });

    const data = await r.json();
    return data.lead?.accountId === accountId;
}

export async function getFilters(domain, auth) {
    try {
        const response = await fetch(
            `https://${domain}/rest/api/3/filter/search`,
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    Accept: "application/json",
                },
            }
        );

        const data = await response.json();

        const filters = data.values || [];

        const filtersWithJql = await Promise.all(
            filters.map(async (f) => {
                try {
                    const res = await fetch(
                        `https://${domain}/rest/api/3/filter/${f.id}`,
                        {
                            headers: {
                                Authorization: `Basic ${auth}`,
                                Accept: "application/json",
                            },
                        }
                    );

                    const fullFilter = await res.json();

                    return {
                        id: f.id,
                        name: f.name,
                        jql: fullFilter.jql || "ALL",
                    };
                } catch {
                    return {
                        id: f.id,
                        name: f.name,
                        jql: "ALL",
                    };
                }
            })
        );

        return filtersWithJql;

    } catch (err) {
        console.error("getFilters error:", err);
        return [];
    }
}

export async function getIssues(domain, auth, projectKey) {
    const jql = encodeURIComponent(`project = ${projectKey}`);

    const response = await fetch(
        `https://${domain}/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,assignee,reporter,labels,description,created,updated,duedate,comment,customfield_10016,parent&expand=renderedFields`,
        {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
        }
    );



    const data = await response.json();

    return (data.issues || []).map((i) => ({
        key: i.key,
        name: i.fields?.summary || "No title",
        dueDate: i.fields?.duedate || null,
        status: i.fields?.status?.name || "No status",
        storyPoints: i.fields?.customfield_10016 || null,
        assignee: i.fields?.assignee?.displayName || "Unassigned",
        reporter: i.fields?.reporter?.displayName || "Unknown",
        labels: i.fields?.labels || [],
        description: i.renderedFields?.description || "",
        created: i.fields?.created || "",
        updated: i.fields?.updated || "",
        feature: i.fields?.parent?.fields?.summary || "No Feature",
        featureKey: i.fields?.parent?.key || null,
        comments:
            i.renderedFields?.comment?.comments?.map((c) => ({
                author: c.author?.displayName || "Unknown",
                avatar: Object.values(c.author?.avatarUrls || {})[0],
                text: c.body || "",
                created: c.created || "",
            })) || [],
    }));
}

export function groupByFeature(tasks) {
    const features = {};

    tasks.forEach((task) => {
        const featureName = task.feature || "No Feature";

        if (!features[featureName]) {
            features[featureName] = [];
        }

        features[featureName].push(task);
    });

    return features;
}

export function splitFeaturesByEstimationStatus(features) {
    const kanbanFeatures  = Object.entries(features).map(([name, tasks]) => {
        const analyze = tasks.filter(t => t.labels?.length > 0);

        const estimate = tasks.filter(
            t => !t.storyPoints && (!t.labels || t.labels.length === 0)
        );

        const estimated = tasks.filter(t => t.storyPoints);

        return {
            featureName: name,
            featureKey: tasks[0]?.featureKey,
            analyze,
            estimate,
            estimated,
        };
    });

    return kanbanFeatures .sort((a, b) => {
        if (a.featureName === "No Feature") return 1;
        if (b.featureName === "No Feature") return -1;
        return 0;
    });
}

export function calculateTotals(featuresArray) {
    return {
        totalAnalyze: featuresArray.reduce(
            (sum, f) => sum + f.analyze.length,
            0
        ),
        totalEstimate: featuresArray.reduce(
            (sum, f) => sum + f.estimate.length,
            0
        ),
        totalEstimated: featuresArray.reduce(
            (sum, f) => sum + f.estimated.length,
            0
        ),
    };
}

// ####################### GEN BY AI ########################

export async function getIssuesWithJql(domain, auth, jql, projectKey) {
    const finalJql =
        jql === "ALL"
            ? `project = ${projectKey} ORDER BY created DESC`
            : jql;

    const encoded = encodeURIComponent(finalJql);

    const response = await fetch(
        `https://${domain}/rest/api/3/search/jql?jql=${encoded}&maxResults=100&fields=summary,status,assignee,reporter,labels,description,created,updated,duedate,comment,customfield_10016,parent&expand=renderedFields`,
        {
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
        }
    );

    const data = await response.json();

    return (data.issues || []).map((i) => ({
        key: i.key,
        name: i.fields?.summary || "No title",
        dueDate: i.fields?.duedate || null,
        status: i.fields?.status?.name || "No status",
        storyPoints: i.fields?.customfield_10016 || null,
        assignee: i.fields?.assignee?.displayName || "Unassigned",
        reporter: i.fields?.reporter?.displayName || "Unknown",
        labels: i.fields?.labels || [],
        description: i.renderedFields?.description || "",
        created: i.fields?.created || "",
        updated: i.fields?.updated || "",
        feature: i.fields?.parent?.fields?.summary || "No Feature",
        featureKey: i.fields?.parent?.key || null,
        comments:
            i.renderedFields?.comment?.comments?.map((c) => ({
                author: c.author?.displayName || "Unknown",
                avatar: Object.values(c.author?.avatarUrls || {})[0],
                text: c.body || "",
                created: c.created || "",
            })) || [],
    }));
}
//##########################################################