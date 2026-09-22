export const demoIdentity = {
  name: "Cindy's knowledge identity",
  thesis: "You learn by building, connecting systems thinking with evidence-backed AI practice.",
  concepts: [
    { id:"retrieval-augmented-generation", name:"Retrieval-augmented generation", state:"known", confidence:.91, evidence:[{ input_id:"in-001", excerpt:"RAG is not only vector search. Retrieval quality depends on chunking, embeddings, query intent, and citations." }] },
    { id:"product-prototyping", name:"Product prototyping", state:"learning", confidence:.82, evidence:[{ input_id:"in-003", excerpt:"Test one product question with real interaction before designing production architecture." }] },
    { id:"knowledge-modeling", name:"Knowledge modeling", state:"learning", confidence:.79, evidence:[{ input_id:"in-002", excerpt:"Expose what the user knows, how it changed, and where every conclusion came from." }] },
    { id:"semantic-retrieval", name:"Semantic retrieval", state:"learning", confidence:.76, evidence:[{ input_id:"in-001", excerpt:"Retrieval quality depends on chunking, embeddings, and query intent." }] },
    { id:"user-research", name:"User research", state:"aware", confidence:.68, evidence:[{ input_id:"in-002", excerpt:"The graph is useful only when it supports reflection or action." }] },
    { id:"knowledge-graphs", name:"Knowledge graphs", state:"aware", confidence:.64, evidence:[{ input_id:"in-002", excerpt:"The graph is useful only when it supports reflection or action." }] },
  ],
  relations: [
    { source:"retrieval-augmented-generation", target:"semantic-retrieval", related:true, evidence_input_ids:["in-001"] },
    { source:"knowledge-modeling", target:"knowledge-graphs", related:true, evidence_input_ids:["in-002"] },
    { source:"product-prototyping", target:"user-research", related:true, evidence_input_ids:["in-003"] },
    { source:"retrieval-augmented-generation", target:"knowledge-modeling", related:true, evidence_input_ids:["in-001","in-002"] },
  ],
  recent_inputs: [
    { id:"in-003", source_type:"project", content:"Today I prototyped an AI workflow. I prefer testing one product question with real interaction before designing production architecture.", destination:"Building", created_at:new Date(Date.now()-18e6).toISOString(), status:"organized", concept_ids:["product-prototyping","user-research"] },
    { id:"in-002", source_type:"thought", content:"A useful knowledge product should expose what the user knows, how that changed, and where every conclusion came from.", destination:"Product thinking", created_at:new Date(Date.now()-2592e5).toISOString(), status:"organized", concept_ids:["knowledge-modeling","knowledge-graphs"] },
    { id:"in-001", source_type:"note", content:"RAG is not only vector search. Retrieval quality depends on chunking, embeddings, query intent, and source evidence.", destination:"AI systems", created_at:new Date(Date.now()-5184e5).toISOString(), status:"organized", concept_ids:["retrieval-augmented-generation","semantic-retrieval"] },
  ],
  notes: [
    { id:"note-1", title:"Building", summary:"Prototype one product question with real interaction before designing production architecture.", concept_ids:["product-prototyping","user-research"], evidence_input_ids:["in-003"], updated_at:new Date(Date.now()-18e6).toISOString() },
    { id:"note-2", title:"AI systems", summary:"RAG quality depends on retrieval design and evidence traceability, not just vector search.", concept_ids:["retrieval-augmented-generation","semantic-retrieval"], evidence_input_ids:["in-001"], updated_at:new Date(Date.now()-5184e5).toISOString() },
  ],
  learning_events: [
    { id:"event-1", occurred_at:new Date(Date.now()-18e6).toISOString(), title:"Connected prototyping with user research", detail:"Your latest project turned an abstract product idea into a testable interaction.", concept_ids:["product-prototyping","user-research"], evidence_input_ids:["in-003"] },
    { id:"event-2", occurred_at:new Date(Date.now()-2592e5).toISOString(), title:"Made evidence a product principle", detail:"Knowledge modeling and traceability became part of the same mental model.", concept_ids:["knowledge-modeling","knowledge-graphs"], evidence_input_ids:["in-002"] },
  ],
  recap: { period:"week", headline:"You moved from collecting AI ideas to modeling how they connect.", narrative:"Your recent inputs repeatedly connect retrieval, evidence, and rapid prototyping. A practical point of view is emerging: an AI system is useful when its reasoning can be inspected and tested.", highlights:["Strengthened RAG and semantic retrieval.","Connected prototyping with user research.","Made evidence traceability an explicit quality criterion."], evidence_input_ids:["in-001","in-002","in-003"] },
  recommendation: { concept:"Knowledge state evaluation", reason:"You think clearly about extraction and evidence, but still need a reliable way to distinguish a concept that is mentioned from one that is genuinely known.", bridge_from:["Knowledge modeling","User research","Retrieval-augmented generation"], first_step:"Design three observable signals that distinguish aware, learning, and known without asking the user to self-score." },
};

const keywordMap = { rag:"Retrieval-augmented generation", retrieval:"Semantic retrieval", graph:"Knowledge graphs", prototype:"Product prototyping", user:"User research", knowledge:"Knowledge modeling" };
export function addDemoInput(identity, payload) {
  const id=`in-${Date.now().toString(36)}`; const lower=payload.content.toLowerCase(); const names=Object.entries(keywordMap).filter(([key])=>lower.includes(key)).map(([,name])=>name);
  if(!names.length) names.push(payload.content.split(/\s+/).slice(0,3).join(" "));
  const concepts=[...identity.concepts]; const ids=[];
  for(const name of [...new Set(names)].slice(0,4)){ const conceptId=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); ids.push(conceptId); const index=concepts.findIndex((item)=>item.id===conceptId); const evidence={input_id:id,excerpt:payload.content.slice(0,140)}; if(index>=0){const previous=concepts[index]; const nextEvidence=[...previous.evidence,evidence]; concepts[index]={...previous,state:nextEvidence.length>=3?"known":"learning",evidence:nextEvidence};}else{concepts.push({id:conceptId,name,state:"aware",confidence:.62,evidence:[evidence]});}}
  const input={id,source_type:payload.source_type,content:payload.content,destination:payload.destination||null,created_at:new Date().toISOString(),status:"organized",concept_ids:ids};
  return {...identity,concepts,recent_inputs:[input,...identity.recent_inputs],notes:[{id:`note-${id}`,title:payload.destination||names[0],summary:payload.content.slice(0,180),concept_ids:ids,evidence_input_ids:[id],updated_at:input.created_at},...identity.notes],learning_events:[{id:`event-${id}`,occurred_at:input.created_at,title:`Connected ${ids.length} ideas`,detail:`Your input strengthened ${names.join(", ")}.`,concept_ids:ids,evidence_input_ids:[id]},...identity.learning_events]};
}
