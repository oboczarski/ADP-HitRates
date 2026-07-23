"use client";

import { arc } from "d3-shape";
import {
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type MatrixPosition = "QB" | "RB" | "WR" | "TE";
export type MatrixSourceRange = "Top 6" | "Round 1" | "Round 2" | "Round 3";

export type MatrixTrendRow = {
  range: MatrixSourceRange;
  overall: number;
  QB: number | null;
  RB: number | null;
  WR: number | null;
  TE: number | null;
};

type MatrixGradientMap = Record<MatrixPosition, readonly string[]>;

type QuadrantArcMatrixProps = {
  data: readonly MatrixTrendRow[];
  gradients: MatrixGradientMap;
};

type PolarPoint = {
  x: number;
  y: number;
};

type MatrixTooltip = {
  x: number;
  y: number;
  position: MatrixPosition;
  range: MatrixRange;
  value: number | null;
};

const rangeDefinitions = [
  { source: "Top 6", label: "TOP 6", color: "#ff3fb4", color2: "#ff86d4" },
  { source: "Round 1", label: "RD 1", color: "#a66bff", color2: "#d27cff" },
  { source: "Round 2", label: "RD 2", color: "#28b9ff", color2: "#6ce8ff" },
  { source: "Round 3", label: "RD 3", color: "#18e7b4", color2: "#72ffd8" },
] as const;

type MatrixRange = (typeof rangeDefinitions)[number]["label"];

const positions: MatrixPosition[] = ["QB", "RB", "WR", "TE"];
const quadrantStartAngles = [-35, 55, 145, 235];
const rangeRadii = [205, 179, 153, 127];
const guideRadii = [90, 115, 140, 165, 190, 215];
const annularArc = arc();

const labelPlacement = {
  QB: { dx: 10, dy: 0, textAnchor: "start", dominantBaseline: "central" },
  RB: { dx: 0, dy: 10, textAnchor: "middle", dominantBaseline: "hanging" },
  WR: { dx: -10, dy: 0, textAnchor: "end", dominantBaseline: "central" },
  TE: { dx: 0, dy: -10, textAnchor: "middle", dominantBaseline: "auto" },
} as const;

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function polarPoint(radius: number, angle: number): PolarPoint {
  const radians = degreesToRadians(angle);
  return {
    x: Math.sin(radians) * radius,
    y: -Math.cos(radians) * radius,
  };
}

function arcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius = 5,
) {
  return (
    annularArc.cornerRadius(cornerRadius)({
      innerRadius,
      outerRadius,
      startAngle: degreesToRadians(startAngle),
      endAngle: degreesToRadians(endAngle),
    }) ?? ""
  );
}

function formatPercent(value: number | null) {
  return value === null ? "NA" : `${value.toFixed(1)}%`;
}

function MatrixDefinitions({ gradients }: { gradients: MatrixGradientMap }) {
  return (
    <defs>
      {positions.map((position) => {
        const colors = gradients[position];
        return (
          <linearGradient
            id={`matrix-${position}`}
            key={position}
            x1="0%"
            x2="100%"
            y1="0%"
            y2="100%"
          >
            {colors.map((color, index) => (
              <stop
                key={color}
                offset={`${(index / (colors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        );
      })}

      <radialGradient id="matrix-center-fill" cx="42%" cy="34%" r="70%">
        <stop offset="0%" stopColor="#242752" stopOpacity="0.72" />
        <stop offset="48%" stopColor="#0e1028" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#060713" />
      </radialGradient>

      <filter id="matrix-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <pattern
        id="matrix-na"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="8" height="8" fill="rgba(255,255,255,.025)" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="#77809a" strokeWidth="2" />
      </pattern>
    </defs>
  );
}

export default function QuadrantArcMatrix({
  data,
  gradients,
}: QuadrantArcMatrixProps) {
  const [selectedPosition, setSelectedPosition] = useState<MatrixPosition | "ALL">("ALL");
  const [tooltip, setTooltip] = useState<MatrixTooltip | null>(null);

  const matrixData = useMemo(
    () =>
      positions.map((position) => ({
        position,
        colors: gradients[position],
        values: Object.fromEntries(
          rangeDefinitions.map(({ source, label }) => {
            const row = data.find((item) => item.range === source);
            return [label, row?.[position] ?? null];
          }),
        ) as Record<MatrixRange, number | null>,
      })),
    [data, gradients],
  );

  const togglePosition = (position: MatrixPosition) => {
    setSelectedPosition((current) => (current === position ? "ALL" : position));
  };

  const handleKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    position: MatrixPosition,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePosition(position);
    }
  };

  const showTooltip = (
    event: PointerEvent<SVGGElement>,
    position: MatrixPosition,
    range: MatrixRange,
    value: number | null,
  ) => {
    setTooltip({
      x: Math.max(12, Math.min(event.clientX + 16, window.innerWidth - 242)),
      y: Math.max(12, Math.min(event.clientY + 16, window.innerHeight - 138)),
      position,
      range,
      value,
    });
  };

  return (
    <div className="viz-shell matrix-shell">
      <svg
        viewBox="0 0 620 620"
        className="viz-svg matrix-svg"
        role="img"
        aria-labelledby="quadrant-matrix-svg-title quadrant-matrix-svg-description"
      >
        <title id="quadrant-matrix-svg-title">Quadrant arc matrix</title>
        <desc id="quadrant-matrix-svg-description">
          Hit rates for quarterback, running back, wide receiver, and tight end across
          Top 6, Round 1, Round 2, and Round 3 rookie ADP ranges on a shared zero to one
          hundred percent scale.
        </desc>
        <MatrixDefinitions gradients={gradients} />

        <g transform="translate(310 310)">
          {guideRadii.map((radius) => (
            <circle
              key={radius}
              r={radius}
              fill="none"
              stroke="rgba(132,151,196,.075)"
              strokeWidth="1"
              aria-hidden="true"
            />
          ))}

          {[0, 90, 180, 270].map((angle) => {
            const start = polarPoint(112, angle + 45);
            const end = polarPoint(232, angle + 45);
            return (
              <line
                key={angle}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="rgba(177,196,238,.11)"
                strokeWidth="1"
                aria-hidden="true"
              />
            );
          })}

          {matrixData.map(({ position, colors, values }, positionIndex) => {
            const startAngle = quadrantStartAngles[positionIndex];
            const positionPoint = polarPoint(258, startAngle + 35);
            const opacity =
              selectedPosition === "ALL" || selectedPosition === position ? 1 : 0.2;

            return (
              <g key={position} data-matrix-quadrant={position}>
                <text
                  x={positionPoint.x}
                  y={positionPoint.y - 3}
                  textAnchor="middle"
                  className="matrix-position"
                  fill={colors[1]}
                  opacity={opacity}
                >
                  {position}
                </text>
                <text
                  x={positionPoint.x}
                  y={positionPoint.y + 14}
                  textAnchor="middle"
                  className="matrix-position-caption"
                  opacity={opacity}
                >
                  POSITION
                </text>

                {rangeDefinitions.map(({ label }, rangeIndex) => {
                  const value = values[label];
                  const radius = rangeRadii[rangeIndex];
                  const endAngle =
                    value === null ? startAngle + 70 : startAngle + (70 * value) / 100;
                  const point = polarPoint(
                    radius,
                    value === null ? startAngle + 35 : endAngle,
                  );
                  const placement =
                    value === null
                      ? {
                          x: point.x,
                          y: point.y - 10,
                          textAnchor: "middle" as const,
                          dominantBaseline: "auto" as const,
                        }
                      : {
                          x: point.x + labelPlacement[position].dx,
                          y: point.y + labelPlacement[position].dy,
                          textAnchor: labelPlacement[position].textAnchor,
                          dominantBaseline: labelPlacement[position].dominantBaseline,
                        };
                  const accessibleLabel = `${position} · ${label}: ${formatPercent(value)}`;

                  return (
                    <g
                      className="viz-hit-target"
                      role="button"
                      tabIndex={0}
                      aria-label={accessibleLabel}
                      aria-pressed={selectedPosition === position}
                      opacity={opacity}
                      data-position={position}
                      data-range={label}
                      data-value={value ?? "NA"}
                      key={label}
                      onClick={() => togglePosition(position)}
                      onKeyDown={(event) => handleKeyDown(event, position)}
                      onPointerMove={(event) => showTooltip(event, position, label, value)}
                      onPointerLeave={() => setTooltip(null)}
                    >
                      <title>{accessibleLabel}</title>
                      <path
                        d={arcPath(radius - 7, radius + 7, startAngle, startAngle + 70, 7)}
                        fill="rgba(151,169,212,.075)"
                        stroke="rgba(192,205,240,.07)"
                        strokeWidth="1"
                      />
                      {value === null ? (
                        <path
                          d={arcPath(radius - 7, radius + 7, startAngle, startAngle + 70, 7)}
                          fill="url(#matrix-na)"
                          stroke="rgba(151,165,198,.28)"
                          strokeDasharray="3 4"
                        />
                      ) : (
                        <path
                          d={arcPath(radius - 7, radius + 7, startAngle, endAngle, 7)}
                          fill={`url(#matrix-${position})`}
                          filter="url(#matrix-glow)"
                        />
                      )}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={value === null ? 0 : 3.25}
                        fill="#f7fbff"
                      />
                      <text
                        x={placement.x}
                        y={placement.y}
                        textAnchor={placement.textAnchor}
                        dominantBaseline={placement.dominantBaseline}
                        className="matrix-value"
                      >
                        {formatPercent(value)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <circle r="104" fill="url(#matrix-center-fill)" className="matrix-core" />
          <circle r="95" fill="#070817" stroke="rgba(182,199,240,.16)" />
          <circle
            r="83"
            fill="none"
            stroke="rgba(64,224,255,.13)"
            strokeDasharray="2 7"
          />
          <text y="-38" textAnchor="middle" className="core-eyebrow">
            OVERALL · RD 1
          </text>
          <text y="14" textAnchor="middle" className="core-value">
            63.5%
          </text>
          <text y="39" textAnchor="middle" className="core-label">
            HIT PROBABILITY
          </text>
          <line x1="-40" x2="40" y1="57" y2="57" stroke="rgba(83,255,208,.4)" />
          <text y="76" textAnchor="middle" className="core-foot">
            RD 3 · 25.5%
          </text>
        </g>
      </svg>

      <div className="matrix-range-rail" aria-label="Arc order from outside to inside">
        <span>OUTER</span>
        {rangeDefinitions.map(({ label, color2 }) => (
          <b key={label} style={{ color: color2 }}>
            {label}
          </b>
        ))}
        <span>INNER</span>
      </div>

      {tooltip ? (
        <div
          className="matrix-data-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="status"
        >
          <strong>{tooltip.position} · {tooltip.range}</strong>
          <div>
            <span>Hit rate</span>
            <b>{formatPercent(tooltip.value)}</b>
          </div>
          <div>
            <span>ADP band</span>
            <b>{tooltip.range}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
}
