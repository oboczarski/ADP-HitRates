"use client";

import { useEffect, useState, type CSSProperties } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const trendData = [
  { range: "Top 6", overall: 75.0, QB: null, RB: 75.0, WR: 73.7, TE: 100.0 },
  { range: "Round 1", overall: 63.5, QB: 83.3, RB: 61.9, WR: 62.8, TE: 50.0 },
  { range: "Round 2", overall: 47.9, QB: 75.0, RB: 45.7, WR: 42.1, TE: 47.7 },
  { range: "Round 3", overall: 25.5, QB: 46.7, RB: 15.6, WR: 22.2, TE: 39.0 },
] as const;

type DraftRange = (typeof trendData)[number]["range"];

const overallData = trendData.map(({ range, overall }) => ({ range, overall }));

const statCardNotes = {
  "Top 6": "Premium capital",
  "Round 1": "Strong hit zone",
  "Round 2": "Coin-flip range",
  "Round 3": "High-risk range",
} satisfies Record<DraftRange, string>;

const statCardMobileNotes = {
  "Top 6": "Premium",
  "Round 1": "Strong",
  "Round 2": "Coin flip",
  "Round 3": "High risk",
} satisfies Record<DraftRange, string>;

const statCards = overallData.map((metric, index) => ({
  ...metric,
  note: statCardNotes[metric.range],
  mobileNote: statCardMobileNotes[metric.range],
  sequence: String(index + 1).padStart(2, "0"),
}));

type StatDialStyle = CSSProperties & {
  "--arc-end": string;
  "--arc-mid": string;
};

const positionGradients = {
  QB: ["#FFA947", "#FF916B", "#FF666B", "#F94095"],
  RB: ["#004CFF", "#00B3FF", "#00EDFF", "#00FFCB"],
  WR: ["#5300FF", "#4947FF", "#0066FF", "#0099FF"],
  TE: ["#FF0088", "#D400FF", "#5D00FF", "#4C00FF"],
};

const curveData = [
  { range: "Top 6", QB: null, QBLabel: null, RB: 74.5, RBLabel: 75.0, WR: 68.7, WRLabel: 73.7, TE: 99.0, TELabel: 100.0 },
  { range: "Round 1", QB: 83.3, QBLabel: 83.3, RB: 57.1, RBLabel: 61.9, WR: 63.1, WRLabel: 62.8, TE: 50.0, TELabel: 50.0 },
  { range: "Round 2", QB: 75.0, QBLabel: 75.0, RB: 39.0, RBLabel: 45.7, WR: 33.0, WRLabel: 42.1, TE: 45.0, TELabel: 47.7 },
  { range: "Round 3", QB: 43.9, QBLabel: 46.7, RB: 12.6, RBLabel: 15.6, WR: 20.0, WRLabel: 22.2, TE: 37.5, TELabel: 39.0 },
];

const positionData = [
  { position: "QB", top6: 10, round1: 83.3, round2: 75.0, round3: 46.7 },
  { position: "RB", top6: 75.0, round1: 61.9, round2: 45.7, round3: 15.6 },
  { position: "WR", top6: 73.7, round1: 62.8, round2: 42.1, round3: 22.2 },
  { position: "TE", top6: 100.0, round1: 50.0, round2: 47.7, round3: 39.0 },
];

const rangeColors = {
  top6: ["#172A55", "#0099FF", "#00DDFA"],
  round1: ["#12342F", "#00B3A4", "#00FF99"],
  round2: ["#321642", "#A74EFF", "#FF0AA5"],
  round3: ["#3A1727", "#FF6B6B", "#FFB847"],
};

const rangeBorders = {
  top6: ["#0099FF", "#00DDFA", "#B8FAFF"],
  round1: ["#00B3A4", "#00FF99", "#B8FFE3"],
  round2: ["#A74EFF", "#FF0AA5", "#FFA9E2"],
  round3: ["#FF6B6B", "#FFB847", "#FFE0A3"],
};

function PercentLabel({ x, y, value, index, offsets = [] }: { x?: number; y?: number; value?: number; index?: number; offsets?: number[] }) {
  if (x == null || y == null || value == null) return null;
  return (
    <text x={x} y={y + (offsets[index ?? 0] ?? -13)} textAnchor="middle" className="chart-value">
      {value.toFixed(1)}%
    </text>
  );
}

function CurvePercentLabel({ x, y, index, actuals }: { x?: number; y?: number; index?: number; actuals: Array<number | null> }) {
  const value = actuals[index ?? 0];
  if (x == null || y == null || value == null) return null;
  return (
    <text x={x} y={y - 10} textAnchor="middle" className="chart-value">
      {value.toFixed(1)}%
    </text>
  );
}

function BarValueLabel({ x, y, width, value, index, seriesKey, compact }: { x?: number; y?: number; width?: number; value?: number; index?: number; seriesKey: string; compact: boolean }) {
  if (x == null || y == null || width == null || value == null) return null;
  const isNA = seriesKey === "top6" && index === 0;
  const label = isNA ? "NA" : compact ? `${Math.round(Number(value))}%` : `${Number(value).toFixed(1)}%`;
  const cx = x + width / 2;
  const labelY = y - (compact ? 6 : 8);
  return (
    <text
      x={cx}
      y={labelY}
      textAnchor="middle"
      className={isNA ? "bar-value bar-value-na" : "bar-value"}
    >
      {label}
    </text>
  );
}

type GroupedAxisTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
  compact: boolean;
};

type TooltipDatum = {
  dataKey?: string | number;
  value?: string | number | null;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipDatum[];
  label?: string | number;
};

function GroupedAxisTick({ x, y, payload, compact }: GroupedAxisTickProps) {
  const labels = compact ? ["T6", "RD1", "RD2", "RD3"] : ["TOP·6", "RD·1", "RD·2", "RD·3"];
  const offsets = compact ? [-24, -8, 8, 24] : [-59, -20, 20, 59];
  const rangeY = compact ? 8 : 13;
  const positionY = compact ? 24 : 38;
  return (
    <g transform={`translate(${x},${y})`}>
      {labels.map((label, index) => (
        <text key={label} x={offsets[index]} y={rangeY} textAnchor="middle" className="bar-axis-range">{label}</text>
      ))}
      <text x={0} y={positionY} textAnchor="middle" className="bar-axis-position">{payload?.value}</text>
    </g>
  );
}

function TrendTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="tooltip-kicker">{label}</span>
      {payload.filter((item, index, items) => (
        items.findIndex((candidate) => candidate.dataKey === item.dataKey) === index
      )).map((item) => {
        const position = String(item.dataKey);
        const shownValue = item.payload?.[`${position}Label`] ?? item.value;
        const color = position in positionGradients
          ? positionGradients[position as keyof typeof positionGradients][3]
          : "#d747ff";
        return (
          <div className="tooltip-row" key={String(item.dataKey)}>
            <span><i style={{ background: color }} />{position}</span>
            <strong>{Number(shownValue).toFixed(1)}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function BarTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const names: Record<string, string> = { top6: "Top 6", round1: "Round 1", round2: "Round 2", round3: "Round 3" };
  return (
    <div className="chart-tooltip">
      <span className="tooltip-kicker">{label}</span>
      {payload.filter((item) => item.value != null).map((item) => {
        const dataKey = String(item.dataKey);
        const color = dataKey in rangeColors
          ? rangeColors[dataKey as keyof typeof rangeColors][2]
          : "#d747ff";
        return (
          <div className="tooltip-row" key={dataKey}>
            <span><i style={{ background: color }} />{names[dataKey] ?? dataKey}</span>
            <strong>{label === "QB" && dataKey === "top6" ? "NA" : `${Number(item.value).toFixed(1)}%`}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [compactBars, setCompactBars] = useState(false);

  useEffect(() => {
    const update = () => setCompactBars(window.innerWidth <= 560);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="dashboard-shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark"><i /><i /><i /></span>
            <span>ADP / OUTCOMES</span>
          </div>
          <div className="sample-badge"><span /> 2015-2018 &amp; 2020-2023 · RDs 1–3 · 1QB ADP</div>
        </header>

        <section className="hero">
          <div className="eyebrow"><span>CAREER HIT STUDY</span><i /></div>
          <h1>Draft capital has a<br /><em>measurable edge.</em></h1>
          <p>
            Positional hit rates across eight rookie classes—tracking whether each
            player cleared their position-specific fantasy threshold at least once.
          </p>
        </section>

        <section className="stat-grid" aria-label="Overall hit probability summary">
          {statCards.map(({ range, overall, note, mobileNote, sequence }, index) => {
            const arcEnd = overall * 3.6;
            const dialStyle = {
              "--arc-end": `${arcEnd}deg`,
              "--arc-mid": `${arcEnd / 2}deg`,
            } as StatDialStyle;
            const titleId = `stat-title-${index + 1}`;
            const noteId = `stat-note-${index + 1}`;

            return (
              <article
                className={`stat-card stat-${index + 1}`}
                aria-labelledby={titleId}
                key={range}
              >
                <div className="stat-top">
                  <div className="stat-heading">
                    <span className="stat-kicker">ADP RANGE</span>
                    <strong id={titleId}>{range.toUpperCase()}</strong>
                  </div>
                  <span className="stat-index" aria-hidden="true"><i />{sequence}</span>
                </div>

                <div
                  className="stat-dial"
                  style={dialStyle}
                  role="meter"
                  aria-label={`${range} overall hit rate`}
                  aria-describedby={noteId}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={overall}
                  aria-valuetext={`${overall.toFixed(1)} percent`}
                >
                  <span className="stat-arc-glow" aria-hidden="true" />
                  <span className="stat-arc" aria-hidden="true" />
                  <span className="stat-arc-echo" aria-hidden="true" />
                  <span className="stat-origin" aria-hidden="true" />
                  <span className="stat-cap" aria-hidden="true" />
                  <span className="stat-core" aria-hidden="true">
                    <strong className="stat-value">{overall.toFixed(1)}<small>%</small></strong>
                    <em>HIT RATE</em>
                  </span>
                </div>

                <div className="stat-note" id={noteId}>
                  <span className="stat-status" aria-hidden="true" />
                  <strong>
                    <span className="stat-note-desktop">{note}</span>
                    <span className="stat-note-mobile">{mobileNote}</span>
                  </strong>
                  <small aria-hidden="true">0—100</small>
                </div>
              </article>
            );
          })}
        </section>

        <section className="panel overall-panel">
          <div className="panel-header overall-header">
            <div>
              <span className="section-index">01 / OVERALL PROBABILITY</span>
              <h2>Overall hit rate by draft range</h2>
              <p>Aggregate Hit Probability · 1QB ADP · Rounds 1–3</p>
            </div>
            <div className="overall-drop">
              <small>TOP 6 → ROUND 3</small>
              <strong>−49.5<em> %</em></strong>
            </div>
          </div>
          <div className="overall-chart" role="img" aria-label="Area chart showing overall hit rate for Top 6, Round 1, Round 2, and Round 3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallData} margin={compactBars ? { top: 10, right: 16, bottom: 4, left: 0 } : { top: 42, right: 34, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="overallLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff0aa5" />
                    <stop offset="34%" stopColor="#d747ff" />
                    <stop offset="68%" stopColor="#7866FF" />
                    <stop offset="100%" stopColor="#00DDFA" />
                  </linearGradient>
                  <linearGradient id="overallArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7866FF" stopOpacity=".42" />
                    <stop offset="52%" stopColor="#4D79FF" stopOpacity=".13" />
                    <stop offset="100%" stopColor="#00DDFA" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.065)" strokeDasharray="2 9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#b4bbcc", fontSize: 11, fontWeight: 750 }} dy={12} />
                <YAxis domain={[0, 85]} ticks={[0, 20, 40, 60, 80]} axisLine={false} tickLine={false} width={compactBars ? 35 : 42} tickFormatter={(v) => `${v}%`} tick={{ fill: "#626b84", fontSize: compactBars ? 9 : 10 }} />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(255,255,255,.15)", strokeDasharray: "3 6" }} />
                <Area type="monotone" dataKey="overall" stroke="url(#overallLine)" strokeWidth={4} fill="url(#overallArea)" dot={{ r: 6, fill: "#080f20", stroke: "#d747ff", strokeWidth: 3 }} activeDot={{ r: 8, fill: "#fff", stroke: "#7866FF", strokeWidth: 4 }} isAnimationActive={false}>
                  <LabelList content={<PercentLabel offsets={[-18, -18, -18, -18]} />} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel trend-panel">
          <div className="panel-header">
            <div>
              <span className="section-index">02 / POSITIONAL CURVES</span>
              <h2>Hit-rate descent by ADP</h2>
              <p>Each line follows one position as draft investment declines.</p>
            </div>
            <div className="legend" aria-label="Position legend">
              {Object.entries(positionGradients).map(([position, colors]) => (
                <span key={position}><i className="gradient-legend-mark" style={{ background: `linear-gradient(90deg, ${colors.join(",")})`, boxShadow: `0 0 14px ${colors[3]}` }} />{position}</span>
              ))}
            </div>
          </div>
          <div className="trend-chart" role="img" aria-label="Line chart showing positional hit rate by ADP range">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={curveData} margin={compactBars ? { top: 6, right: 18, bottom: 3, left: 0 } : { top: 28, right: 34, bottom: 5, left: 0 }}>
                <defs>
                  {Object.entries(positionGradients).map(([position, colors]) => (
                    <linearGradient id={`line-${position}`} key={`line-${position}`} x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor={colors[0]} />
                      <stop offset="33%" stopColor={colors[1]} />
                      <stop offset="67%" stopColor={colors[2]} />
                      <stop offset="100%" stopColor={colors[3]} />
                    </linearGradient>
                  ))}
                  {Object.entries(positionGradients).map(([position, colors]) => (
                    <linearGradient id={`area-${position}`} key={`area-${position}`} x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor={colors[0]} stopOpacity=".015" />
                      <stop offset="33%" stopColor={colors[1]} stopOpacity=".035" />
                      <stop offset="67%" stopColor={colors[2]} stopOpacity=".07" />
                      <stop offset="100%" stopColor={colors[3]} stopOpacity=".12" />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" strokeDasharray="2 8" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#a8b0c7", fontSize: 12, fontWeight: 650 }} dy={12} />
                <YAxis domain={[10, 110]} ticks={[25, 50, 75, 100]} axisLine={false} tickLine={false} width={compactBars ? 35 : 42} tickFormatter={(v) => `${v}%`} tick={{ fill: "#626b84", fontSize: compactBars ? 9 : 11 }} />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(255,255,255,.16)", strokeDasharray: "3 6" }} />
                {Object.keys(positionGradients).map((position) => (
                  <Area
                    key={`area-${position}`}
                    type="monotone"
                    dataKey={position}
                    stroke="none"
                    fill={`url(#area-${position})`}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
                {Object.entries(positionGradients).map(([position, colors]) => {
                  const actuals = curveData.map((row) => row[`${position}Label` as keyof typeof row] as number | null);
                  return (
                  <Line
                    key={position}
                    type="monotone"
                    dataKey={position}
                    name={position}
                    stroke={`url(#line-${position})`}
                    strokeWidth={4}
                    connectNulls={false}
                    dot={{ r: 5, fill: colors[0], stroke: colors[3], strokeWidth: 3 }}
                    activeDot={{ r: 7, fill: colors[3], stroke: "#07101d", strokeWidth: 4 }}
                    isAnimationActive={false}
                  >
                    <LabelList content={<CurvePercentLabel actuals={actuals} />} />
                  </Line>
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footnote"><span>NOTE</span> No QBs inside the Top 6 of 1QB ADP during the sample period</div>
        </section>

        <section className="analysis-grid">
          <article className="panel comparison-panel">
            <div className="panel-header compact-header">
              <div>
                <span className="section-index">03 / RANGE COMPARISON</span>
                <h2>Positional hit-rate spectrum</h2>
                <p>Bars visualize positional variance across ADP</p>
              </div>
              <div className="range-legend" aria-label="ADP range legend">
                {Object.entries({ top6: "TOP 6", round1: "RD 1", round2: "RD 2", round3: "RD 3" }).map(([key, label]) => (
                  <span key={key}><i style={{ background: `linear-gradient(90deg, ${rangeColors[key as keyof typeof rangeColors][0]}, ${rangeColors[key as keyof typeof rangeColors][2]})` }} />{label}</span>
                ))}
              </div>
            </div>
            <div className="bar-chart" role="img" aria-label="Grouped vertical bar chart comparing hit rates by position and ADP range">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positionData} margin={compactBars ? { top: 8, right: 9, bottom: 3, left: 0 } : { top: 45, right: 18, bottom: 5, left: 0 }} barCategoryGap="22%" barGap={compactBars ? 2 : 7}>
                  <defs>
                    {Object.entries(rangeColors).map(([key, colors]) => (
                      <linearGradient id={`bar-${key}`} key={key} x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={colors[0]} stopOpacity=".10" />
                        <stop offset="54%" stopColor={colors[1]} stopOpacity=".18" />
                        <stop offset="100%" stopColor={colors[2]} stopOpacity=".26" />
                      </linearGradient>
                    ))}
                    {Object.entries(rangeBorders).map(([key, colors]) => (
                      <linearGradient id={`bar-border-${key}`} key={`border-${key}`} x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={colors[0]} />
                        <stop offset="55%" stopColor={colors[1]} />
                        <stop offset="100%" stopColor={colors[2]} />
                      </linearGradient>
                    ))}
                    <linearGradient id="bar-na" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#343A49" stopOpacity=".18" />
                      <stop offset="100%" stopColor="#8992A5" stopOpacity=".34" />
                    </linearGradient>
                    <linearGradient id="bar-border-na" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#687184" stopOpacity=".35" />
                      <stop offset="100%" stopColor="#C0C7D4" stopOpacity=".62" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,.065)" strokeDasharray="2 9" />
                  <XAxis dataKey="position" axisLine={false} tickLine={false} height={compactBars ? 34 : 58} interval={0} tick={<GroupedAxisTick compact={compactBars} />} />
                  <YAxis domain={[0, 110]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} width={compactBars ? 35 : 42} tickFormatter={(v) => `${v}%`} tick={{ fill: "#626b84", fontSize: compactBars ? 9 : 10 }} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,.025)" }} />
                  {Object.keys(rangeColors).map((key) => (
                    <Bar key={key} dataKey={key} radius={[10, 10, 3, 3]} barSize={compactBars ? 14 : 32} isAnimationActive={false}>
                      {positionData.map((entry, index) => {
                        const isNA = key === "top6" && index === 0;
                        return (
                          <Cell
                            key={`${key}-${entry.position}`}
                            fill={isNA ? "url(#bar-na)" : `url(#bar-${key})`}
                            stroke={isNA ? "url(#bar-border-na)" : `url(#bar-border-${key})`}
                            strokeWidth={compactBars ? (isNA ? 0.65 : 1) : (isNA ? 1.65 : 2.4)}
                          />
                        );
                      })}
                      <LabelList dataKey={key} content={<BarValueLabel seriesKey={key} compact={compactBars} />} />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-footnote"><span>NA</span> No QBs inside the Top 6 of 1QB ADP during the sample period</div>
          </article>

          <aside className="insight-stack">
            <article className="panel insight-hero">
              <span className="section-index">04 / SIGNAL</span>
              <div className="signal-orbit">
                <div className="signal-ring"><span>49.5<small>%</small></span></div>
              </div>
              <h2>The cost of waiting</h2>
              <p>Overall hit probability falls <strong>49.5 percent</strong> from the Top 6 to Round 3.</p>
              <div className="signal-scale">
                <span><i style={{ width: "75%" }} /><b>75.0%</b><small>TOP 6</small></span>
                <span><i style={{ width: "25.5%" }} /><b>25.5%</b><small>ROUND 3</small></span>
              </div>
            </article>
            <article className="panel mini-insight qb-insight">
              <span className="mini-number">46.7%</span>
              <div><strong>QB leads the Round 3 group</strong><p>Highest positional hit rate in the final range.</p></div>
            </article>
            <article className="panel mini-insight rb-insight">
              <span className="mini-number">15.6%</span>
              <div><strong>RB carries the steepest late risk</strong><p>Lowest positional hit rate in Round 3.</p></div>
            </article>
          </aside>
        </section>

        <section className="method-panel">
          <div className="method-heading">
            <span className="section-index">05 / STUDY FRAME</span>
            <h2>What counts as a hit?</h2>
          </div>
          <div className="method-definition">
            <span>CAREER RULE</span>
            <strong>Threshold reached ≥ 1 time</strong>
            <p>Across the player&apos;s career</p>
          </div>
          <div className="threshold-grid">
            {[
              ["QB", "179", "#ff0aa5"], ["RB", "179", "#00FF99"],
              ["WR", "179", "#0099FF"], ["TE", "151", "#8F00FF"],
            ].map(([position, threshold, color]) => (
              <div className="threshold-item" key={position}>
                <span style={{ color }}>{position}</span>
                <strong>≥ {threshold}</strong>
                <small>PPR FPTS</small>
              </div>
            ))}
          </div>
          <div className="benchmark-copy">
            <span>BENCHMARK</span>
            <p>Thresholds derived from the average minimum for <strong>QB2, RB2, WR2 and TE1</strong> PPR finishes.</p>
          </div>
          <div className="dataset-parameters">
            <span className="dataset-title">ADP DATASET PARAMETERS</span>
            <div className="dataset-parameter-grid">
              {[
                ["SCORING TYPE", "PPR", "#ff0aa5"],
                ["LEAGUE SIZE", "12-teams", "#00FF99"],
                ["LEAGUE FORMAT", "1QB", "#0099FF"],
              ].map(([label, value, color]) => (
                <div className="dataset-parameter" key={label}>
                  <span>{label}</span>
                  <strong style={{ color }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer>
          <span>ROOKIE ADP OUTCOME STUDY</span>
          <div className="palette-rail" aria-label="Chart color palettes">
            {["#ff0aa5", "#d747ff", "#00DDFA", "#e8d058", "#FF916B", "#CE34F9", "#00FF99", "#69D6FF", "#5F03DF", "#0099FF", "#4c00ff", "#D200FF"].map((color, index) => <i key={`${color}-${index}`} style={{ background: color }} />)}
          </div>
          <span>2015-2018 &amp; 2020-2023 SAMPLE</span>
        </footer>
      </div>
    </main>
  );
}
