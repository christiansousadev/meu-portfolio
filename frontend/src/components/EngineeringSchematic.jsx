// frontend/src/components/EngineeringSchematic.jsx
//
// Fluxograma no vocabulário da ISO 5807: documento (ERP), processo
// predefinido (integração), dados armazenados (base), decisão (conciliação),
// processo (governança) e o carimbo de conferência ao final.
// Um registro percorre o traçado uma única vez no carregamento; depois disso
// o esquema só reage a hover, foco, toque e teclado.

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import useMediaQuery from "../hooks/useMediaQuery";
import { SCHEMATIC_COPY, STAGES, STAGE_COPY } from "../content/engineering";

export const LEDGER_FOCUS_EVENT = "ledger:focus";

const ROW_QUERY = "(min-width: 900px)";

function Shape({ kind }) {
  const common = {
    className: "sch-shape",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    "aria-hidden": true,
    focusable: "false",
  };
  if (kind === "document") {
    return (
      <svg {...common}>
        <path vectorEffect="non-scaling-stroke" d="M1,1 H99 V82 C80,70 62,98 42,90 C26,84 12,82 1,90 Z" />
      </svg>
    );
  }
  if (kind === "predefined") {
    return (
      <svg {...common}>
        <rect vectorEffect="non-scaling-stroke" x="1" y="1" width="98" height="98" />
        <path vectorEffect="non-scaling-stroke" className="sch-shape-detail" d="M8,1 V99 M92,1 V99" />
      </svg>
    );
  }
  if (kind === "stored") {
    return (
      <svg {...common}>
        <path vectorEffect="non-scaling-stroke" d="M1,14 C1,3 99,3 99,14 V86 C99,97 1,97 1,86 Z" />
        <path vectorEffect="non-scaling-stroke" className="sch-shape-detail" d="M1,14 C1,25 99,25 99,14" />
      </svg>
    );
  }
  if (kind === "decision") {
    return (
      <svg {...common}>
        <path vectorEffect="non-scaling-stroke" d="M50,2 L98,50 L50,98 L2,50 Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect vectorEffect="non-scaling-stroke" x="1" y="1" width="98" height="98" />
    </svg>
  );
}

function Connector({ label }) {
  return (
    <span className="sch-link" aria-hidden="true">
      <svg className="sch-arrow" viewBox="0 0 28 12" focusable="false">
        <path pathLength="1" d="M1,6 H25" />
        <path className="sch-arrow-head" d="M20,1.5 L26,6 L20,10.5" />
      </svg>
      {label && <span className="sch-link-label">{label}</span>}
    </span>
  );
}

const SHAPE_BY_STAGE = { integration: "predefined", data: "stored", governance: "process" };

const todayIso = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function EngineeringSchematic({ lang = "pt" }) {
  const copy = SCHEMATIC_COPY[lang] || SCHEMATIC_COPY.pt;
  const stageCopy = STAGE_COPY[lang] || STAGE_COPY.pt;
  const isRow = useMediaQuery(ROW_QUERY);
  const [active, setActive] = useState(null);
  const [loop, setLoop] = useState(null);
  const rootRef = useRef(null);
  const integrationRef = useRef(null);
  const decisionRef = useRef(null);
  const stampDate = useMemo(todayIso, []);

  // ordem visual: 0 origem, 1 integração, 2 dados, 3 decisão, 4 governança, 5 carimbo
  const order = { integration: 1, data: 2, governance: 4 };
  const litUntil = active ? order[active] : -1;
  const lit = (index) => (index <= litUntil ? "is-lit" : "");

  // o laço "não conciliado -> correção" depende da posição real dos nós
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const measure = () => {
      const box = root.getBoundingClientRect();
      const a = integrationRef.current?.getBoundingClientRect();
      const d = decisionRef.current?.getBoundingClientRect();
      if (!a || !d || !box.width) return;
      const rel = (r) => ({
        left: r.left - box.left,
        right: r.right - box.left,
        top: r.top - box.top,
        bottom: r.bottom - box.top,
        cx: r.left - box.left + r.width / 2,
        cy: r.top - box.top + r.height / 2,
      });
      const ri = rel(a);
      const rd = rel(d);

      if (isRow) {
        const y = Math.max(ri.bottom, rd.bottom) + 26;
        setLoop({
          w: box.width,
          h: box.height,
          d: `M${rd.cx},${rd.bottom} V${y} H${ri.cx} V${ri.bottom + 4}`,
          head: `M${ri.cx - 5},${ri.bottom + 11} L${ri.cx},${ri.bottom + 4} L${ri.cx + 5},${ri.bottom + 11}`,
          label: { x: (ri.cx + rd.cx) / 2, y: y + 18, anchor: "middle" },
        });
      } else {
        const x = Math.max(ri.right, rd.right) + 18;
        setLoop({
          w: box.width,
          h: box.height,
          d: `M${rd.right},${rd.cy} H${x} V${ri.cy} H${ri.right + 4}`,
          head: `M${ri.right + 11},${ri.cy - 5} L${ri.right + 4},${ri.cy} L${ri.right + 11},${ri.cy + 5}`,
          label: { x: rd.right + 6, y: rd.cy - 8, anchor: "start" },
        });
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [isRow, lang]);

  const goToStage = (stage) => {
    window.dispatchEvent(new CustomEvent(LEDGER_FOCUS_EVENT, { detail: stage.anchor }));
  };

  const stageNode = (stage, index) => {
    const text = stageCopy[stage.id];
    return (
      <li key={stage.id} className={`sch-step ${lit(index)}`} style={{ "--i": index }}>
        <Connector label={stage.id === "governance" ? copy.yes : null} />
        <button
          ref={stage.id === "integration" ? integrationRef : null}
          type="button"
          className={`sch-node sch-node--${SHAPE_BY_STAGE[stage.id]} ${
            active === stage.id ? "is-active" : ""
          }`}
          onMouseEnter={() => setActive(stage.id)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(stage.id)}
          onBlur={() => setActive(null)}
          onClick={() => goToStage(stage)}
          aria-label={`${stage.number}. ${text.label}: ${text.detail}. ${copy.stageAction(text.label)}`}
        >
          <Shape kind={SHAPE_BY_STAGE[stage.id]} />
          <span className="sch-node-text" aria-hidden="true">
            <span className="sch-node-title">
              <span className="sch-num">{stage.number}</span> {text.label}
            </span>
            <span className="sch-node-detail">{text.detail}</span>
          </span>
        </button>
      </li>
    );
  };

  const [integration, data, governance] = STAGES;

  return (
    <figure
      ref={rootRef}
      className={`schematic ${isRow ? "schematic--row" : "schematic--column"}`}
      data-active={active || undefined}
    >
      <ol className="sch-track">
        <li className={`sch-step sch-step--source ${lit(0)}`} style={{ "--i": 0 }}>
          <span className="sch-node sch-node--document">
            <Shape kind="document" />
            <span className="sch-node-text">
              <span className="sch-node-title">{copy.source.label}</span>
              <span className="sch-node-detail">{copy.source.detail}</span>
            </span>
          </span>
        </li>

        {stageNode(integration, 1)}
        {stageNode(data, 2)}

        <li className={`sch-step ${lit(3)}`} style={{ "--i": 3 }}>
          <Connector />
          <span ref={decisionRef} className="sch-node sch-node--decision">
            <Shape kind="decision" />
            <span className="sch-node-text">
              <span className="sch-node-title">{copy.decision.label}</span>
            </span>
          </span>
        </li>

        {stageNode(governance, 4)}

        <li className={`sch-step sch-step--stamp ${lit(5)}`} style={{ "--i": 5 }}>
          <Connector />
          <span className="sch-stamp">
            <span className="sch-stamp-word">{copy.stamp}</span>
            <time className="sch-stamp-date" dateTime={stampDate}>
              {stampDate}
            </time>
          </span>
        </li>
      </ol>

      {loop && (
        <svg
          className="sch-loop"
          width={loop.w}
          height={loop.h}
          viewBox={`0 0 ${loop.w} ${loop.h}`}
          aria-hidden="true"
          focusable="false"
        >
          <path className="sch-loop-path" d={loop.d} />
          <path className="sch-loop-head" d={loop.head} />
          <text
            className="sch-loop-label"
            x={loop.label.x}
            y={loop.label.y}
            textAnchor={loop.label.anchor}
          >
            {isRow ? copy.no : copy.noShort}
          </text>
        </svg>
      )}

      <figcaption className="sch-caption">
        {copy.caption}. {copy.noNote}.
      </figcaption>
    </figure>
  );
}
