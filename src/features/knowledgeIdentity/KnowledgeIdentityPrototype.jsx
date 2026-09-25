import { useCallback, useEffect, useRef, useState } from "react";
import { ImplementationPlan } from "../development/ImplementationPlan.jsx";
import { artifactContentUrl, identityApi } from "./api.js";
import { emptyIdentity } from "./emptyIdentity.js";

const stateLabel = { unknown: "Unknown", aware: "Aware", learning: "Learning", known: "Known" };

function Icon({ name, size = 20 }) {
  const paths = {
    spark: <><path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Z"/><path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z"/></>,
    graph: <><circle cx="6" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/><circle cx="5" cy="17" r="2"/><path d="m8 7 8-1m1 2-2 8M7 16l6 2M6 9l-1 6"/></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    evidence: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>,
    mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></>,
    paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Status({ state }) {
  return <span className={`state state--${state}`}><i />{stateLabel[state] || state}</span>;
}

function Evidence({ ids }) {
  return <span className="evidence"><Icon name="evidence" size={14}/>{ids.length} source{ids.length === 1 ? "" : "s"}</span>;
}

function EvidenceDetails({ items }) {
  if (!items?.length) return null;
  return <details className="evidence-details"><summary><Evidence ids={items.map((item) => item.input_id)}/> View citations</summary><ol>{items.map((item) => <li key={`${item.input_id}-${item.segment_id || "input"}`}><span>{item.locator || "Captured input"}</span><p>{item.excerpt}</p></li>)}</ol></details>;
}

function Composer({ onSubmit, busy }) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [listening, setListening] = useState(false);
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceBaseRef = useRef("");

  const waitForArtifact = async (artifactId) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const artifact = await identityApi.getArtifact(artifactId);
      setAttachments((current) => current.map((item) => item.id === artifactId ? { ...item, ...artifact } : item));
      if (artifact.status === "ready" || artifact.status === "failed") return artifact;
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    throw new Error("Extraction is taking longer than expected. You can retry it here.");
  };

  const uploadFile = async (file, temporaryId) => {
    try {
      const queued = await identityApi.uploadArtifact(file);
      setAttachments((current) => current.map((item) => item.id === temporaryId ? { ...item, ...queued, temporaryId } : item));
      await waitForArtifact(queued.id);
    } catch (error) {
      setAttachments((current) => current.map((item) => item.id === temporaryId || item.temporaryId === temporaryId ? { ...item, status: "failed", error: error.message } : item));
    }
  };

  const captureUrl = async (url) => {
    const temporaryId = `url-${Date.now()}`;
    setAttachments((current) => [...current, { id: temporaryId, temporaryId, name: url, mime_type: "text/html", size: 0, status: "uploading", source_uri: url }]);
    try {
      const queued = await identityApi.captureWebSource(url);
      setAttachments((current) => current.map((item) => item.id === temporaryId ? { ...item, ...queued, temporaryId } : item));
      return await waitForArtifact(queued.id);
    } catch (error) {
      setAttachments((current) => current.map((item) => item.id === temporaryId || item.temporaryId === temporaryId ? { ...item, status: "failed", error: error.message } : item));
      return null;
    }
  };

  const addFiles = async (fileList) => {
    const available = Math.max(0, 5 - attachments.length);
    const files = Array.from(fileList).slice(0, available);
    const accepted = [];
    for (const file of files) {
      if (file.size > 26_214_400) {
        setNotice(`${file.name} is larger than 25 MB.`);
        continue;
      }
      if (!/\.(pdf|txt|md|png|jpe?g|webp|gif|flac|mp3|mp4|mpeg|mpga|m4a|ogg|wav|webm)$/i.test(file.name)) {
        setNotice(`${file.name} is not supported. Add a document, image, or audio recording.`);
        continue;
      }
      const temporaryId = `${file.name}-${file.lastModified}-${file.size}`;
      accepted.push({
        id: temporaryId,
        temporaryId,
        name: file.name,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
        status: "uploading",
        file,
      });
    }
    setAttachments((current) => [...current, ...accepted]);
    if (accepted.length) {
      setNotice("");
      await Promise.all(accepted.map((item) => uploadFile(item.file, item.temporaryId)));
    }
  };

  const retryFile = async (file) => {
    if (!file.id?.startsWith("artifact-")) return;
    try {
      const queued = await identityApi.retryArtifact(file.id);
      setAttachments((current) => current.map((item) => item.id === file.id ? { ...item, ...queued } : item));
      await waitForArtifact(file.id);
    } catch (error) {
      setAttachments((current) => current.map((item) => item.id === file.id ? { ...item, status: "failed", error: error.message } : item));
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice("Voice input is not supported in this browser. Try Chrome or Safari.");
      return;
    }
    const recognition = new Recognition();
    voiceBaseRef.current = content.trim();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setVoiceUsed(true); setNotice("Listening… speak naturally."); };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setContent([voiceBaseRef.current, transcript].filter(Boolean).join(" "));
    };
    recognition.onerror = () => setNotice("I couldn't hear that. Tap the microphone to try again.");
    recognition.onend = () => { setListening(false); setNotice((current) => current === "Listening… speak naturally." ? "" : current); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (attachments.some((item) => item.status !== "ready")) return;
    if (content.trim().length < 3 && attachments.length === 0) return;
    const text = content.trim() || `Attached: ${attachments.map((item) => item.name).join(", ")}`;
    let submittedAttachments = attachments;
    if (/^https?:\/\/\S+$/i.test(text) && attachments.length === 0) {
      const ready = await captureUrl(text);
      if (!ready) return;
      submittedAttachments = [ready];
    }
    const sourceType = voiceUsed || submittedAttachments.some((item) => (item.media_type || item.mime_type || "").startsWith("audio/")) ? "voice" : submittedAttachments.some((item) => (item.media_type || item.mime_type || "").startsWith("image/")) ? "screenshot" : submittedAttachments.length ? "note" : /^https?:\/\//i.test(text) ? "link" : /\?\s*$/.test(text) ? "question" : "thought";
    const saved = await onSubmit({
      content: text,
      source_type: sourceType,
      destination: null,
      attachments: submittedAttachments.map((item) => ({ name: item.name, mime_type: item.media_type || item.mime_type, size: item.size, artifact_id: item.id })),
    });
    if (!saved) return;
    setContent("");
    setAttachments([]);
    setVoiceUsed(false);
    setNotice("");
  };
  return (
    <form className={`composer composer--simple ${listening ? "is-listening" : ""}`} onSubmit={submit} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
      <label className="sr-only" htmlFor="knowledge-capture">Add anything to your knowledge identity</label>
      <textarea id="knowledge-capture" value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") event.currentTarget.form?.requestSubmit(); }} placeholder="Drop a thought, link, question, or half-formed idea…" rows={4}/>
      {attachments.length ? <div className="composer__attachments">{attachments.map((file) => <span className={`attachment attachment--${file.status}`} key={file.id}><Icon name="paperclip" size={14}/><span>{file.name}<small>{file.status === "ready" ? `${file.segments?.length || 0} source ${file.segments?.length === 1 ? "segment" : "segments"}` : file.status === "failed" ? file.error || "Extraction failed" : file.status === "uploading" ? "Uploading…" : "Extracting…"}</small></span>{file.status === "failed" && file.id?.startsWith("artifact-") ? <button className="attachment__retry" type="button" onClick={() => retryFile(file)}>Retry</button> : null}<button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} aria-label={`Remove ${file.name}`}><Icon name="close" size={14}/></button></span>)}</div> : null}
      <div className="composer__controls">
        <div className="composer__tools">
          <input ref={fileInputRef} className="sr-only" type="file" multiple accept=".pdf,.txt,.md,image/png,image/jpeg,image/webp,image/gif,audio/*,.mp4,.webm" onChange={async (event) => { await addFiles(event.target.files); event.target.value = ""; }} />
          <button className="composer__icon-button" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach files" title="Attach files"><Icon name="paperclip"/></button>
          <button className={`composer__icon-button ${listening ? "is-active" : ""}`} type="button" onClick={toggleVoice} aria-label={listening ? "Stop voice input" : "Start voice input"} aria-pressed={listening} title="Voice input"><Icon name="mic"/></button>
          <span className="composer__hint">{notice || "Type, speak, or attach — no organizing required"}</span>
        </div>
        <button className="composer__submit" type="submit" disabled={busy || attachments.some((item) => item.status !== "ready") || (content.trim().length < 3 && attachments.length === 0)} aria-label="Add to Knowledge Identity"><span>{busy ? "Making sense of it…" : attachments.some((item) => ["uploading", "queued", "extracting"].includes(item.status)) ? "Reading…" : "Add"}</span><Icon name={busy ? "spark" : "send"} size={18}/></button>
      </div>
    </form>
  );
}

function Graph({ identity }) {
  if (!identity.concepts.length) return <div className="knowledge-graph knowledge-graph--empty" aria-label="Knowledge concepts"><div className="graph-empty"><Icon name="graph" size={28}/><strong>No concepts yet</strong><span>Capture something, then approve the concepts that feel useful.</span></div></div>;
  return <div className="knowledge-map__concepts" aria-label="Knowledge concepts">{identity.concepts.map((concept) => <article className={`map-concept map-concept--${concept.state}`} key={concept.id} title={concept.evidence[0]?.excerpt}><strong>{concept.name}</strong><small>{stateLabel[concept.state]} · {concept.evidence.length} source{concept.evidence.length === 1 ? "" : "s"}</small></article>)}</div>;
}

function ReviewPanel({ run, busy, onAccept, onReject, onRetry }) {
  const pending = run.actions.filter((action) => action.status === "pending");
  const [enabled, setEnabled] = useState(() => Object.fromEntries(pending.map((action) => [action.id, true])));
  const [names, setNames] = useState(() => Object.fromEntries(pending.filter((action) => action.kind === "upsert_concept").map((action) => [action.payload.concept_id, action.payload.name])));
  const [stateValues, setStateValues] = useState(() => Object.fromEntries(pending.filter((action) => action.kind === "set_knowledge_state").map((action) => [action.payload.concept_id, action.payload.state])));
  if (run.extraction_status === "failed") return <section className="review-panel review-panel--failed" aria-live="polite"><div className="review-panel__intro"><span className="eyebrow">Input saved</span><h2>AI could not finish reading this source.</h2><p>{run.extraction_error || "Extraction failed. Retry when ready."} Your original input and attachment are safe. No concepts were added.</p></div><div className="review-panel__actions"><button className="review-panel__reject" type="button" onClick={onReject} disabled={busy}>Keep input only</button><button className="review-panel__accept" type="button" onClick={onRetry} disabled={busy}><Icon name="spark" size={18}/>{busy ? "Retrying…" : "Retry AI extraction"}</button></div></section>;
  const concepts = pending.filter((action) => action.kind === "upsert_concept");
  const stateProposals = pending.filter((action) => action.kind === "set_knowledge_state");
  const stateActions = Object.fromEntries(stateProposals.map((action) => [action.payload.concept_id, action]));
  const toggle = (actionId) => setEnabled((current) => ({ ...current, [actionId]: !current[actionId] }));
  const submit = () => {
    const conceptEnabled = Object.fromEntries(concepts.map((action) => [action.payload.concept_id, enabled[action.id] !== false]));
    const decisions = [];
    concepts.forEach((action) => decisions.push({ action_id: action.id, decision: conceptEnabled[action.payload.concept_id] ? "approve" : "reject", ...(conceptEnabled[action.payload.concept_id] ? { payload: { name: names[action.payload.concept_id] || action.payload.name } } : {}) }));
    stateProposals.forEach((action) => decisions.push({ action_id: action.id, decision: conceptEnabled[action.payload.concept_id] && enabled[action.id] !== false ? "approve" : "reject", ...(conceptEnabled[action.payload.concept_id] && enabled[action.id] !== false ? { payload: { state: stateValues[action.payload.concept_id] || action.payload.state } } : {}) }));
    onAccept(decisions);
  };
  return <section className="review-panel" aria-live="polite"><div className="review-panel__intro"><span className="eyebrow">Review before organizing</span><h2>Here is how AI understood your input.</h2><p>Edit names and states, or turn off anything that does not belong. Your original input is already preserved.</p><div className="review-trace"><Icon name="evidence" size={15}/><span>{pending.length} evidence-backed actions</span>{run.extraction_trace ? <><i/> <span>{run.extraction_trace.provider === "openai" ? run.extraction_trace.model : run.extraction_trace.used_fallback ? "Local fallback" : "Local extraction"}</span></> : null}</div></div><div className="review-editor"><div className="review-editor__section"><small>Concepts and states</small>{concepts.map((action) => { const conceptId = action.payload.concept_id; const stateAction = stateActions[conceptId]; const active = enabled[action.id] !== false; return <div className={`review-concept ${active ? "" : "is-rejected"}`} key={action.id}><input type="checkbox" checked={active} onChange={() => toggle(action.id)} aria-label={`Include ${action.payload.name}`}/><input className="review-concept__name" value={names[conceptId] ?? action.payload.name} onChange={(event) => setNames((current) => ({ ...current, [conceptId]: event.target.value }))} disabled={!active} aria-label={`Concept name for ${action.payload.name}`}/>{stateAction ? <select value={stateValues[conceptId] ?? stateAction.payload.state} onChange={(event) => setStateValues((current) => ({ ...current, [conceptId]: event.target.value }))} disabled={!active} aria-label={`Knowledge state for ${action.payload.name}`}><option value="unknown">Unknown</option><option value="aware">Aware</option><option value="learning">Learning</option><option value="known">Known</option></select> : null}</div>; })}</div></div><div className="review-panel__actions"><button className="review-panel__reject" type="button" onClick={onReject} disabled={busy}>Keep input only</button><button className="review-panel__accept" type="button" onClick={submit} disabled={busy || concepts.every((action) => enabled[action.id] === false)}><Icon name="spark" size={18}/>{busy ? "Applying…" : "Apply selected changes"}</button></div></section>;
}

function Chat({ onChat, messages, busy }) {
  const [value, setValue] = useState("");
  const submit = async (event) => { event.preventDefault(); if (!value.trim()) return; const message = value.trim(); setValue(""); await onChat(message); };
  return <section className="chat" id="ask"><div className="section-title"><span><Icon name="chat"/>Ask your knowledge</span><small>Answers cite your evidence</small></div><div className="chat__messages">{messages.map((item, index) => <div className={`message message--${item.role}`} key={`${item.role}-${index}`}>{item.content}<EvidenceDetails items={item.evidence}/></div>)}</div><form onSubmit={submit}><label className="sr-only" htmlFor="knowledge-question">Ask your knowledge identity</label><input id="knowledge-question" value={value} onChange={(event) => setValue(event.target.value)} placeholder="What do I actually know about RAG?"/><button type="submit" disabled={busy || !value.trim()} aria-label="Send question"><Icon name="arrow"/></button></form></section>;
}

const pages = [
  ["capture", "Capture"],
  ["identity", "Identity"],
  ["growth", "Growth"],
  ["library", "Library"],
];

function AppHeader({ mode, page }) {
  return <header className="app-topbar"><a className="brand" href="#capture"><span className="brand__logo">KI</span><span className="brand__name">Knowledge Identity</span></a><nav aria-label="Primary navigation">{pages.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={page === id ? "page" : undefined}>{label}</a>)}</nav><div className="topbar-tools"><span className="connection"><i className={`mode-dot mode-dot--${mode}`}/>{mode === "api" ? "Synced" : mode === "loading" ? "Connecting" : "Backend offline"}</span></div></header>;
}

function PageIntro({ title, guide }) {
  return <header className="page-intro"><h1>{title}</h1>{guide ? <p>{guide}</p> : null}</header>;
}

function IdentityPage({ identity, onChat, messages, chatBusy }) {
  return <section className="app-page"><PageIntro title="Knowledge" guide="Review your confirmed concepts or ask a question grounded in your notes."/><section className="dashboard dashboard--identity"><div className="dashboard__main"><section className="panel identity-panel"><div className="section-title"><span><Icon name="graph"/>Concepts</span><small>{identity.concepts.length}</small></div><Graph identity={identity}/></section></div><aside className="dashboard__side"><Chat onChat={onChat} messages={messages} busy={chatBusy}/></aside></section></section>;
}

function GrowthPage({ recap, period, onPeriodChange, loading }) {
  return <section className="app-page app-page--focused"><PageIntro title="Growth" guide="Choose a time range to see what changed."/><div className="period-switcher" role="group" aria-label="Growth period">{["week", "month", "year"].map((value) => <button key={value} type="button" className={period === value ? "is-active" : ""} aria-pressed={period === value} onClick={() => onPeriodChange(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div><section className={`panel recap growth-recap ${loading ? "is-loading" : ""}`} aria-live="polite"><h2>{loading ? "Updating…" : recap.headline}</h2><p>{recap.narrative}</p>{recap.highlights.length ? <ul>{recap.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}<Evidence ids={recap.evidence_input_ids}/></section></section>;
}

function HighlightedText({ text }) {
  return text.split(/(\[\[[^\]]+\]\])/g).map((part, index) => part.startsWith("[[") && part.endsWith("]]" ) ? <mark key={`${part}-${index}`}>{part.slice(2, -2)}</mark> : part);
}

function OriginalNote({ text }) {
  return <article className="original-note">{text.split(/\n{2,}/).map((paragraph, index) => paragraph.trim() ? <p key={index}>{paragraph.trim()}</p> : null)}</article>;
}

function StructuredNote({ note }) {
  const body = note?.body || [note?.summary, ...(note?.sections || [])].filter(Boolean).join("\n\n");
  if (!body) return <p className="empty-state">No structured note was created for this source.</p>;
  return <article className="structured-note">{body.split(/\n{2,}/).map((block, index) => { const value = block.trim(); if (!value) return null; if (value.startsWith("## ")) return <h3 key={index}><HighlightedText text={value.slice(3)}/></h3>; if (value.startsWith("# ")) return <h2 key={index}><HighlightedText text={value.slice(2)}/></h2>; if (value.split("\n").every((line) => line.startsWith("- "))) return <ul key={index}>{value.split("\n").map((line) => <li key={line}><HighlightedText text={line.slice(2)}/></li>)}</ul>; if (value.split("\n").every((line) => /^\d+\.\s/.test(line))) return <ol key={index}>{value.split("\n").map((line) => <li key={line}><HighlightedText text={line.replace(/^\d+\.\s/, "")}/></li>)}</ol>; return <p key={index}><HighlightedText text={value}/></p>; })}</article>;
}

function SourceRecord({ item, note }) {
  const [view, setView] = useState("original");
  const title = item.destination || item.attachments?.[0]?.name || item.source_type;
  const originalText = item.attachments?.map((attachment) => attachment.content_text).filter(Boolean).join("\n\n") || item.content;
  return <details className="source-record"><summary><span><strong>{title}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></span><Evidence ids={[item.id]}/></summary><div className="source-record__body"><div className="source-tabs" role="tablist" aria-label={`Views for ${title}`}><button type="button" role="tab" aria-selected={view === "original"} className={view === "original" ? "is-active" : ""} onClick={() => setView("original")}>Original</button><button type="button" role="tab" aria-selected={view === "note"} className={view === "note" ? "is-active" : ""} onClick={() => setView("note")}>AI note</button></div>{view === "original" ? <section className="source-view note-reader" role="tabpanel"><div className="source-view__header"><div><strong>Original note</strong><small>Stored unchanged</small></div>{item.attachments?.map((attachment) => attachment.artifact_id ? <a key={attachment.artifact_id} href={artifactContentUrl(attachment.artifact_id)} target="_blank" rel="noreferrer">Open {attachment.name}</a> : null)}</div><OriginalNote text={originalText}/></section> : <section className="source-view note-reader" role="tabpanel"><div className="source-view__header"><div><strong>{note?.title || "Structured note"}</strong><small>Detailed AI note · concepts highlighted</small></div></div><StructuredNote note={note}/></section>}</div></details>;
}

function LibraryPage({ identity, busy, notice, onUndo, onExport, onRestore }) {
  const importRef = useRef(null);
  const importBackup = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const backup = JSON.parse(await file.text()); if (window.confirm("Replace current knowledge with this backup? You can undo once before restarting the backend.")) await onRestore(backup); } finally { event.target.value = ""; } };
  const noteByInput = Object.fromEntries(identity.notes.flatMap((note) => note.evidence_input_ids.map((inputId) => [inputId, note])));
  return <section className="app-page"><PageIntro title="Library" guide="Open a note, then switch between the unchanged original and the structured AI version."/><div className="library-toolbar"><button type="button" onClick={onExport}>Download backup</button><button type="button" onClick={() => importRef.current?.click()}>Restore backup</button><button type="button" onClick={onUndo} disabled={busy}>Undo last change</button><input ref={importRef} className="sr-only" type="file" accept="application/json" onChange={importBackup}/></div>{notice ? <p className="library-notice" role="status">{notice}</p> : null}<section className="panel library-sources"><div className="section-title"><span>Notes</span><small>{identity.recent_inputs.length}</small></div>{identity.recent_inputs.length ? identity.recent_inputs.map((item) => <SourceRecord key={item.id} item={item} note={noteByInput[item.id]}/>) : <p className="empty-state">No notes yet.</p>}</section></section>;
}

export default function KnowledgeIdentityPrototype() {
  const [identity, setIdentity] = useState(emptyIdentity);
  const [mode, setMode] = useState("loading");
  const [error, setError] = useState("");
  const [inputBusy, setInputBusy] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [pendingRun, setPendingRun] = useState(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [page, setPage] = useState(() => pages.some(([id]) => `#${id}` === window.location.hash) ? window.location.hash.slice(1) : "capture");
  const [growthPeriod, setGrowthPeriod] = useState("week");
  const [growthRecap, setGrowthRecap] = useState(emptyIdentity.recap);
  const [growthBusy, setGrowthBusy] = useState(false);
  const [manageBusy, setManageBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", content: "I can reflect what you know, show the evidence behind it, and name the gap at your current edge.", evidence: [] }]);

  const loadIdentity = useCallback(async () => { setMode("loading"); setError(""); try { setIdentity(await identityApi.load()); setMode("api"); } catch { setMode("error"); setError("The backend is not reachable. Start it to load or save your knowledge — no demo data has been substituted."); } }, []);
  useEffect(() => { loadIdentity(); }, [loadIdentity]);
  useEffect(() => { const onHashChange = () => { const next = window.location.hash.slice(1); setPage(pages.some(([id]) => id === next) ? next : "capture"); window.scrollTo({ top: 0, behavior: "smooth" }); }; window.addEventListener("hashchange", onHashChange); if (!window.location.hash) window.history.replaceState(null, "", "#capture"); return () => window.removeEventListener("hashchange", onHashChange); }, []);
  useEffect(() => { setGrowthRecap(identity.recap); }, [identity.recap]);
  const changeGrowthPeriod = useCallback(async (period) => { setGrowthPeriod(period); setGrowthBusy(true); try { setGrowthRecap(await identityApi.recap(period)); setMode("api"); } catch { setError("Growth could not be loaded. Please reconnect and try again."); setMode("error"); } finally { setGrowthBusy(false); } }, []);
  const previewInput = useCallback(async (payload) => { setInputBusy(true); setError(""); try { const run = await identityApi.previewInput(payload); setPendingRun(run); setMode("api"); return true; } catch { setMode("error"); setError("This input was not saved because the backend is offline. Your text is still in the composer."); return false; } finally { setInputBusy(false); } }, []);
  const acceptRun = useCallback(async (decisions = []) => { if (!pendingRun) return; setDecisionBusy(true); setError(""); try { setIdentity(await identityApi.commitWorkflow(pendingRun.id, decisions)); setMode("api"); setPendingRun(null); } catch { setMode("error"); setError("The selected changes could not be saved. Please reconnect and try again."); } finally { setDecisionBusy(false); } }, [pendingRun]);
  const rejectRun = useCallback(async () => { if (!pendingRun) return; setDecisionBusy(true); setError(""); try { setIdentity(await identityApi.rejectWorkflow(pendingRun.id)); setMode("api"); setPendingRun(null); } catch { setMode("error"); setError("The workflow could not be updated. Please reconnect and try again."); } finally { setDecisionBusy(false); } }, [pendingRun]);
  const retryExtraction = useCallback(async () => { if (!pendingRun) return; setDecisionBusy(true); setError(""); try { setPendingRun(await identityApi.retryExtraction(pendingRun.id)); setMode("api"); } catch { setMode("error"); setError("AI extraction still could not finish. Your input is safe; try again later."); } finally { setDecisionBusy(false); } }, [pendingRun]);
  const chat = useCallback(async (message) => { setMessages((items) => [...items, { role: "user", content: message }]); setChatBusy(true); try { const response = await identityApi.chat(message); setMessages((items) => [...items, { role: "assistant", content: response.answer, evidence: response.evidence }]); setMode("api"); } catch { setMessages((items) => [...items, { role: "assistant", content: "I couldn't reach your knowledge store, so I won't invent an answer. Start the backend and try again.", evidence: [] }]); setMode("error"); } finally { setChatBusy(false); } }, []);
  const mutate = useCallback(async (operation) => { setManageBusy(true); setNotice(""); try { const result = await operation(); setIdentity(result.identity); setNotice(result.message); setMode("api"); } catch (cause) { setNotice(cause.message || "The change could not be saved."); } finally { setManageBusy(false); } }, []);
  const exportBackup = useCallback(async () => { try { const backup = await identityApi.exportBackup(); const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `knowledge-identity-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setNotice("Backup downloaded."); } catch { setNotice("Backup could not be downloaded."); } }, []);

  return <div className="knowledge-app"><a className="skip-link" href="#main-content">Skip to content</a><AppHeader mode={mode} page={page}/><main id="main-content" tabIndex="-1">{page === "capture" ? <><section className="capture-home"><div className="capture-home__intro"><h1>Capture</h1><p>Type, speak, paste a link, or attach a file.</p></div><Composer onSubmit={previewInput} busy={inputBusy}/>{error ? <div className="connection-error" role="alert"><span>{error}</span><button type="button" onClick={loadIdentity}>Retry connection</button></div> : null}</section>{pendingRun ? <ReviewPanel key={pendingRun.id} run={pendingRun} busy={decisionBusy} onAccept={acceptRun} onReject={rejectRun} onRetry={retryExtraction}/> : null}<ImplementationPlan/></> : null}{page === "identity" ? <IdentityPage identity={identity} onChat={chat} messages={messages} chatBusy={chatBusy}/> : null}{page === "growth" ? <GrowthPage recap={growthRecap} period={growthPeriod} onPeriodChange={changeGrowthPeriod} loading={growthBusy}/> : null}{page === "library" ? <LibraryPage identity={identity} busy={manageBusy} notice={notice} onUndo={() => mutate(identityApi.undo)} onExport={exportBackup} onRestore={(backup) => mutate(() => identityApi.restoreBackup(backup))}/> : null}</main><footer><span>Knowledge Identity</span></footer></div>;
}
