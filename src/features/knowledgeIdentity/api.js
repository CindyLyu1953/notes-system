const baseUrl=(import.meta.env.VITE_API_BASE_URL||"").replace(/\/+$/,"");
async function request(path,init){const response=await fetch(`${baseUrl}/api/v1/knowledge-identity${path}`,{cache:"no-store",...init,headers:{"Content-Type":"application/json",...(init?.headers||{})}});if(!response.ok)throw new Error(`Knowledge Identity API returned ${response.status}.`);return response.json();}
export const identityApi={
  load:()=>request(""),
  previewInput:(payload)=>request("/inputs/preview",{method:"POST",body:JSON.stringify(payload)}),
  commitWorkflow:(runId,decisions=[])=>request(`/workflow-runs/${runId}/commit`,{method:"POST",body:JSON.stringify({decisions})}),
  rejectWorkflow:(runId)=>request(`/workflow-runs/${runId}/reject`,{method:"POST"}),
  chat:(message)=>request("/chat",{method:"POST",body:JSON.stringify({message})}),
};
