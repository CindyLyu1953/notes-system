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
  recap: (period) => request(`/recap?period=${encodeURIComponent(period)}`),
  captureWebSource: (url) => request("/web-sources", { method: "POST", body: JSON.stringify({ url }) }),
  uploadArtifact: async (file) => {
    const body = new FormData();
    body.append("file", file);
    return parseResponse(await fetch(`${root}/artifacts`, { method: "POST", body }));
  },
  getArtifact: (artifactId) => request(`/artifacts/${artifactId}`),
  retryArtifact: (artifactId) => request(`/artifacts/${artifactId}/retry`, { method: "POST" }),
  updateInput: (inputId, payload) => request(`/inputs/${inputId}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateNote: (noteId, payload) => request(`/notes/${noteId}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateConcept: (conceptId, payload) => request(`/concepts/${conceptId}`, { method: "PUT", body: JSON.stringify(payload) }),
  mergeConcepts: (sourceId, targetId) => request("/concepts/merge", { method: "POST", body: JSON.stringify({ source_id: sourceId, target_id: targetId }) }),
  undo: () => request("/undo", { method: "POST" }),
  exportBackup: () => request("/backup"),
  restoreBackup: (backup) => request("/restore", { method: "POST", body: JSON.stringify(backup) }),
};
