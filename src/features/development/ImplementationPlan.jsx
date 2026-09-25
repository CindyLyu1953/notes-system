import { implementationPhases } from "./implementationPlan.js";

export function ImplementationPlan() {
  const items = implementationPhases.flatMap((phase) => phase.items);
  const completed = items.filter(([status]) => status === "complete").length;

  return (
    <section className="build-plan" id="build-plan" aria-labelledby="build-plan-title">
      <header className="build-plan__header">
        <div>
          <span className="eyebrow">Development view · remove before launch</span>
          <h2 id="build-plan-title">Implementation plan</h2>
          <p>A live checklist of what works now and what still stands between this prototype and a usable product.</p>
        </div>
        <div className="build-plan__progress" aria-label={`${completed} of ${items.length} items complete`}>
          <strong>{completed}/{items.length}</strong>
          <span>implemented</span>
        </div>
      </header>
      <div className="build-plan__phases">
        {implementationPhases.map((phase, index) => (
          <details key={phase.title} open={index === 1}>
            <summary>
              <span>{phase.title}</span>
              <small className={`plan-status plan-status--${phase.status}`}>{phase.status.replace("-", " ")}</small>
            </summary>
            <ul>
              {phase.items.map(([status, label]) => (
                <li className={`plan-item plan-item--${status}`} key={label}>
                  <i aria-hidden="true">{status === "complete" ? "✓" : "·"}</i>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
