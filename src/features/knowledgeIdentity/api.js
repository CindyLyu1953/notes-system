const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const root = `${baseUrl}/api/v1/knowledge-identity`;

async function parseResponse(response) {
  if (!response.ok) {
    let detail = `Knowledge Identity API returned ${response.status}.`;
    try {
      const payload = await response.json();
      if (payload.detail) detail = payload.detail;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(detail);
  }
  return response.json();
}

async function request(path, init) {
  return parseResponse(await fetch(`${root}${path}`, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  }));
}

export const identityApi = {
  load: () => request(""),
  previewInput: (payload) => request("/inputs/preview", { method: "POST", body: JSON.stringify(payload) }),
  commitWorkflow: (runId, decisions = []) => request(`/workflow-runs/${runId}/commit`, { method: "POST", body: JSON.stringify({ decisions }) }),
  rejectWorkflow: (runId) => request(`/workflow-runs/${runId}/reject`, { method: "POST" }),
  chat: (message) => request("/chat", { method: "POST", body: JSON.stringify({ message }) }),
  uploadArtifact: async (file) => {
    const body = new FormData();
    body.append("file", file);
    return parseResponse(await fetch(`${root}/artifacts`, { method: "POST", body }));
  },
  getArtifact: (artifactId) => request(`/artifacts/${artifactId}`),
  retryArtifact: (artifactId) => request(`/artifacts/${artifactId}/retry`, { method: "POST" }),
};
