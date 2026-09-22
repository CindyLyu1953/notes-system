import { useCallback, useEffect, useMemo, useState } from "react";
import { identityApi } from "./api.js";
import { addDemoInput, demoIdentity } from "./demoData.js";

const stateLabel = { unknown: "Unknown", aware: "Aware", learning: "Learning", known: "Known" };

function Icon({ name, size = 20 }) {
  const paths = {
    spark: <><path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Z"/><path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z"/></>,
    graph: <><circle cx="6" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/><circle cx="5" cy="17" r="2"/><path d="m8 7 8-1m1 2-2 8M7 16l6 2M6 9l-1 6"/></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    evidence: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Status({ state }) {
  return <span className={`state state--${state}`}><i />{stateLabel[state] || state}</span>;
}

function Evidence({ ids }) {
  return <span className="evidence"><Icon name="evidence" size={14}/>{ids.length} source{ids.length === 1 ? "" : "s"}</span>;
}

function Composer({ onSubmit, busy }) {
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState("thought");
  const [destination, setDestination] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (content.trim().length < 3) return;
    await onSubmit({ content: content.trim(), source_type: sourceType, destination: destination.trim() || null });
    setContent("");
    setDestination("");
  };
  return (
    <form className="composer" onSubmit={submit}>
      <label htmlFor="knowledge-capture">What is on your mind?</label>
      <textarea id="knowledge-capture" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Drop a thought, question, learning, project reflection, or rough note…" rows={4}/>
      <div className="composer__controls">
        <select value={sourceType} onChange={(event) => setSourceType(event.target.value)} aria-label="Input type">
          <option value="thought">Thought</option><option value="note">Note</option><option value="question">Question</option><option value="project">Project</option><option value="link">Link</option>
        </select>
        <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Optional collection" aria-label="Optional collection"/>
        <button type="submit" disabled={busy || content.trim().length < 3}><Icon name="spark" size={18}/>{busy ? "Organizing…" : "Make sense of it"}</button>
      </div>
    </form>
  );
}

function ConceptList({ concepts, limit = 6 }) {
  return <div className="concept-list">{concepts.slice(0, limit).map((concept) => <article className="concept-row" key={concept.id}><div><strong>{concept.name}</strong><small>{concept.evidence.length} evidence {concept.evidence.length === 1 ? "item" : "items"}</small></div><Status state={concept.state}/></article>)}</div>;
}

function Graph({ identity }) {
  const visible = identity.concepts.slice(0, 6);
  const positions = [[50, 48], [19, 23], [80, 20], [18, 78], [82, 76], [50, 88]];
  const positionById = Object.fromEntries(visible.map((item, index) => [item.id, positions[index]]));
  return <div className="knowledge-graph" aria-label="Knowledge concept network"><svg viewBox="0 0 100 100" role="img" aria-label="Connected knowledge concepts">{identity.relations.map((relation) => { const a = positionById[relation.source]; const b = positionById[relation.target]; return a && b ? <line key={`${relation.source}-${relation.target}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/> : null; })}</svg>{visible.map((concept, index) => <button type="button" className={`graph-node graph-node--${concept.state}`} key={concept.id} style={{ left: `${positions[index][0]}%`, top: `${positions[index][1]}%` }} title={concept.evidence[0]?.excerpt}><span>{concept.name}</span><small>{stateLabel[concept.state]}</small></button>)}</div>;
}

function Recommendation({ item }) {
  return <article className="recommendation"><span className="eyebrow">Just beyond your edge</span><h3>{item.concept}</h3><p>{item.reason}</p><div className="bridge">Bridge from {item.bridge_from.slice(0, 2).join(" + ")}</div><button type="button">Start with one question <Icon name="arrow" size={17}/></button></article>;
}

function Chat({ onChat, messages, busy }) {
  const [value, setValue] = useState("");
  const submit = async (event) => { event.preventDefault(); if (!value.trim()) return; const message = value.trim(); setValue(""); await onChat(message); };
  return <section className="chat" id="ask"><div className="section-title"><span><Icon name="chat"/>Ask your knowledge</span><small>Answers cite your evidence</small></div><div className="chat__messages">{messages.map((item, index) => <div className={`message message--${item.role}`} key={`${item.role}-${index}`}>{item.content}{item.evidence?.length ? <Evidence ids={item.evidence.map((e) => e.input_id)}/> : null}</div>)}</div><form onSubmit={submit}><label className="sr-only" htmlFor="knowledge-question">Ask your knowledge identity</label><input id="knowledge-question" value={value} onChange={(event) => setValue(event.target.value)} placeholder="What do I actually know about RAG?"/><button type="submit" disabled={busy || !value.trim()} aria-label="Send question"><Icon name="arrow"/></button></form></section>;
}

function AppHeader({ mode }) {
  return <header className="app-topbar"><a className="brand" href="#today"><span className="brand__logo">KI</span><span className="brand__name">Knowledge Identity</span></a><nav aria-label="Primary"><a href="#today">Today</a><a href="#identity">Identity</a><a href="#growth">Growth</a><a href="#ask">Ask</a></nav><div className="topbar-tools"><span className="connection"><i className={`mode-dot mode-dot--${mode}`}/>{mode === "api" ? "Synced" : mode === "loading" ? "Connecting" : "Local demo"}</span><button className="tool-button" type="button" aria-label="Theme"><Icon name="sun" size={18}/></button><button className="profile-button" type="button" aria-label="Open profile">CL</button></div></header>;
}

export default function KnowledgeIdentityPrototype() {
  const [identity, setIdentity] = useState(demoIdentity);
  const [mode, setMode] = useState("loading");
  const [inputBusy, setInputBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "I can reflect what you know, show the evidence behind it, and name the gap at your current edge.", evidence: [] }]);

  useEffect(() => { identityApi.load().then((data) => { setIdentity(data); setMode("api"); }).catch(() => setMode("demo")); }, []);
  const addInput = useCallback(async (payload) => { setInputBusy(true); try { const next = await identityApi.addInput(payload); setIdentity(next); setMode("api"); } catch { setIdentity((current) => addDemoInput(current, payload)); setMode("demo"); } finally { setInputBusy(false); } }, []);
  const chat = useCallback(async (message) => { setMessages((items) => [...items, { role: "user", content: message }]); setChatBusy(true); try { const response = await identityApi.chat(message); setMessages((items) => [...items, { role: "assistant", content: response.answer, evidence: response.evidence }]); setMode("api"); } catch { setMessages((items) => [...items, { role: "assistant", content: `Based on your evidence, your strongest pattern is ${identity.concepts.slice(0, 3).map((item) => item.name).join(", ")}. Your next gap is turning those ideas into observable evaluation criteria.`, evidence: identity.recent_inputs.slice(0, 2).map((item) => ({ input_id: item.id })) }]); setMode("demo"); } finally { setChatBusy(false); } }, [identity]);
  const counts = useMemo(() => Object.fromEntries(["known", "learning", "aware"].map((state) => [state, identity.concepts.filter((item) => item.state === state).length])), [identity.concepts]);

  return <div className="knowledge-app"><a className="skip-link" href="#main-content">Skip to content</a><AppHeader mode={mode}/><main id="main-content"><section className="hero" id="today"><div><span className="eyebrow">Your knowledge, reflected back</span><h1>Build a clearer picture<br/>of what you know.</h1><p>Capture anything in your own words. Knowledge Identity organizes it, traces the evidence, and reveals the next useful connection.</p></div><div className="identity-summary"><span>This week</span><strong>{identity.concepts.length}</strong><small>concepts in motion</small><div><b>{counts.known} known</b><b>{counts.learning} learning</b><b>{counts.aware} aware</b></div></div></section><Composer onSubmit={addInput} busy={inputBusy}/><section className="dashboard"><div className="dashboard__main"><section className="panel identity-panel" id="identity"><div className="section-title"><span><Icon name="graph"/>Your living knowledge</span><small>{identity.concepts.length} concepts · {identity.relations.length} connections</small></div><Graph identity={identity}/></section><section className="panel recap" id="growth"><span className="eyebrow">This week&apos;s growth</span><h2>{identity.recap.headline}</h2><p>{identity.recap.narrative}</p><ul>{identity.recap.highlights.map((item) => <li key={item}>{item}</li>)}</ul><Evidence ids={identity.recap.evidence_input_ids}/></section></div><aside className="dashboard__side"><Recommendation item={identity.recommendation}/><section className="panel"><div className="section-title"><span>Knowledge state</span><small>Live</small></div><ConceptList concepts={identity.concepts}/></section><Chat onChat={chat} messages={messages} busy={chatBusy}/></aside></section></main><footer><span>Knowledge Identity</span><span>Every conclusion stays connected to its source.</span></footer></div>;
}
