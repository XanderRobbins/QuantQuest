interface Props {
  id: string;
  color: string;
}

export function CardVisual({ id, color }: Props) {
  const c = color;
  const c30 = `${color}30`;
  const c50 = `${color}50`;
  const c80 = `${color}80`;

  const visuals: Record<string, React.ReactNode> = {
    /* ── SECTORS ─────────────────────────────────────────────── */

    tech: (
      // Bubble diagram: AAPL MSFT GOOGL NVDA META AMZN sized by weight
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[
          { x: 55,  y: 48, r: 22, label: "AAPL" },
          { x: 115, y: 44, r: 22, label: "MSFT" },
          { x: 168, y: 55, r: 17, label: "GOOGL" },
          { x: 213, y: 42, r: 17, label: "NVDA" },
          { x: 30,  y: 68, r: 14, label: "META" },
          { x: 245, y: 60, r: 14, label: "AMZN" },
        ].map(({ x, y, r, label }) => (
          <g key={label}>
            <circle cx={x} cy={y} r={r} fill={c50} stroke={c} strokeWidth="1.2" />
            <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={r > 18 ? 8 : 7} fontWeight="600">{label}</text>
          </g>
        ))}
      </svg>
    ),

    finance: (
      // Bar chart with candlestick-style green/red bars
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[
          { x: 28,  h: 55, up: true,  label: "JPM" },
          { x: 75,  h: 42, up: false, label: "BAC" },
          { x: 120, h: 60, up: true,  label: "GS" },
          { x: 165, h: 50, up: true,  label: "V" },
          { x: 210, h: 38, up: false, label: "MA" },
        ].map(({ x, h, up, label }) => (
          <g key={label}>
            <rect x={x} y={90 - h} width={34} height={h} rx="3" fill={up ? c : `${c}60`} />
            <text x={x + 17} y={96} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">{label}</text>
          </g>
        ))}
        <line x1="15" y1="88" x2="265" y2="88" stroke={c80} strokeWidth="1" />
      </svg>
    ),

    energy: (
      // Sine wave with lightning bolts
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <path
          d="M0,50 C30,20 50,80 80,50 C110,20 130,80 160,50 C190,20 210,80 240,50 C260,30 270,50 280,50"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"
        />
        {[60, 140, 220].map((x) => (
          <text key={x} x={x} y={28} fill={c} fontSize="18" textAnchor="middle" opacity="0.7">⚡</text>
        ))}
      </svg>
    ),

    healthcare: (
      // ECG heartbeat line
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <path
          d="M10,55 L55,55 L65,30 L75,80 L85,20 L95,75 L105,55 L150,55 L160,30 L170,80 L180,20 L190,75 L200,55 L270,55"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="85" cy="20" r="4" fill={c} opacity="0.6" />
        <circle cx="180" cy="20" r="4" fill={c} opacity="0.6" />
      </svg>
    ),

    faang: (
      // Network graph — 7 nodes (META AAPL AMZN NFLX GOOGL NVDA MSFT)
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {(() => {
          const nodes = [
            { x: 140, y: 50,  label: "NVDA" },
            { x: 70,  y: 25,  label: "META" },
            { x: 210, y: 25,  label: "AAPL" },
            { x: 40,  y: 72,  label: "AMZN" },
            { x: 240, y: 72,  label: "MSFT" },
            { x: 110, y: 85,  label: "NFLX" },
            { x: 170, y: 85,  label: "GOOGL"},
          ];
          const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[3,5],[4,6],[1,5],[2,6]];
          return (
            <>
              {edges.map(([a, b], i) => (
                <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
                  stroke={c80} strokeWidth="1" opacity="0.5" />
              ))}
              {nodes.map(({ x, y, label }) => (
                <g key={label}>
                  <circle cx={x} cy={y} r="10" fill={c50} stroke={c} strokeWidth="1.2" />
                  <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="5.5" fontWeight="700">{label}</text>
                </g>
              ))}
            </>
          );
        })()}
      </svg>
    ),

    semiconductors: (
      // Circuit board traces
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* traces */}
        <path d="M20,30 H80 V70 H140 V30 H200 V70 H260" fill="none" stroke={c} strokeWidth="2" opacity="0.6" />
        <path d="M20,70 H60 V30 H100 V70 H160 V30 H220 V70 H260" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" />
        {/* via dots */}
        {[80,140,200].map((x) => [30,70].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={c} opacity="0.8" />
        )))}
        {/* chip */}
        <rect x="110" y="35" width="60" height="30" rx="4" fill={c50} stroke={c} strokeWidth="1.5" />
        <text x="140" y="54" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">CHIP</text>
      </svg>
    ),

    "real-estate": (
      // City skyline
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[
          { x: 15,  w: 30, h: 45 },
          { x: 50,  w: 25, h: 65 },
          { x: 80,  w: 35, h: 35 },
          { x: 120, w: 20, h: 80 },
          { x: 145, w: 25, h: 55 },
          { x: 175, w: 30, h: 70 },
          { x: 210, w: 22, h: 40 },
          { x: 237, w: 28, h: 60 },
        ].map(({ x, w, h }, i) => (
          <g key={i}>
            <rect x={x} y={92 - h} width={w} height={h} rx="2" fill={i % 2 === 0 ? c50 : c80} />
            {/* windows */}
            {[...Array(Math.floor(h / 15))].map((_, row) =>
              [0, 1].map((col) => (
                <rect key={`${row}-${col}`} x={x + 5 + col * 10} y={92 - h + 5 + row * 13}
                  width={5} height={6} rx="1" fill="white" opacity="0.3" />
              ))
            )}
          </g>
        ))}
        <line x1="0" y1="93" x2="280" y2="93" stroke={c} strokeWidth="1.5" />
      </svg>
    ),

    "consumer-staples": (
      // Supermarket shelf with labeled products
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* shelves */}
        <line x1="15" y1="40" x2="265" y2="40" stroke={c80} strokeWidth="2" />
        <line x1="15" y1="75" x2="265" y2="75" stroke={c80} strokeWidth="2" />
        {/* top shelf items */}
        {["PG","KO","PEP","WMT","COST"].map((sym, i) => (
          <g key={sym}>
            <rect x={22 + i * 48} y={18} width={32} height={20} rx="3"
              fill={`hsl(${120 + i * 25}, 60%, 40%)`} opacity="0.8" />
            <text x={38 + i * 48} y={32} textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">{sym}</text>
          </g>
        ))}
        {/* bottom shelf items */}
        {["PG","KO","PEP","WMT","COST"].map((sym, i) => (
          <g key={`b-${sym}`}>
            <rect x={22 + i * 48} y={53} width={32} height={20} rx="3"
              fill={`hsl(${200 + i * 20}, 55%, 35%)`} opacity="0.7" />
            <text x={38 + i * 48} y={67} textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">{sym}</text>
          </g>
        ))}
      </svg>
    ),

    "consumer-discretionary": (
      // Trend line + ticker symbols
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <polyline
          points="15,80 50,65 80,70 110,45 145,50 175,30 210,35 245,15 270,18"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        <polygon points="265,10 278,18 265,26" fill={c} />
        {["TSLA","NKE","SBUX","HD","MCD"].map((sym, i) => (
          <text key={sym} x={22 + i * 50} y={97} fill={c80} fontSize="7" fontWeight="600">{sym}</text>
        ))}
      </svg>
    ),

    industrials: (
      // Two interlocking gears
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Gear 1 */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x = 100 + Math.cos(rad) * 34;
          const y = 50 + Math.sin(rad) * 34;
          return <rect key={i} x={x - 5} y={y - 4} width={10} height={8} rx="1"
            fill={c} transform={`rotate(${deg}, ${x}, ${y})`} opacity="0.8" />;
        })}
        <circle cx="100" cy="50" r="25" fill={c50} stroke={c} strokeWidth="1.5" />
        <circle cx="100" cy="50" r="8" fill={c30} stroke={c} strokeWidth="1" />
        {/* Gear 2 */}
        {[15,45,75,105,135,165,195,225,255,285].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x = 180 + Math.cos(rad) * 26;
          const y = 50 + Math.sin(rad) * 26;
          return <rect key={i} x={x - 4} y={y - 3} width={8} height={6} rx="1"
            fill={c} transform={`rotate(${deg}, ${x}, ${y})`} opacity="0.7" />;
        })}
        <circle cx="180" cy="50" r="18" fill={c50} stroke={c} strokeWidth="1.5" />
        <circle cx="180" cy="50" r="6" fill={c30} stroke={c} strokeWidth="1" />
      </svg>
    ),

    utilities: (
      // Power tower with radiating lines
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Power lines between towers */}
        <path d="M50,35 Q90,55 130,40 Q170,25 210,35" fill="none" stroke={c80} strokeWidth="1.5" />
        <path d="M50,42 Q90,62 130,47 Q170,32 210,42" fill="none" stroke={c80} strokeWidth="1.5" />
        {/* Tower 1 */}
        <path d="M50,90 L42,35 L58,35 L50,90 M42,55 L58,55 M40,42 L60,42" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Tower 2 */}
        <path d="M130,90 L122,35 L138,35 L130,90 M122,55 L138,55 M120,42 L140,42" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Tower 3 */}
        <path d="M210,90 L202,35 L218,35 L210,90 M202,55 L218,55 M200,42 L220,42" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Lightning bolt */}
        <path d="M248,15 L238,50 L246,50 L236,85 L258,45 L248,45 Z" fill={c} opacity="0.7" />
      </svg>
    ),

    materials: (
      // Hexagonal molecular lattice (like graphene)
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {(() => {
          const hexPoints = (cx: number, cy: number, r: number) => {
            return Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI / 180) * (60 * i - 30);
              return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
            }).join(" ");
          };
          const positions = [
            [70, 50], [110, 28], [150, 50], [190, 28], [230, 50],
            [110, 72], [150, 94], [190, 72], [30, 28], [30, 72],
          ];
          return positions.map(([cx, cy], i) => (
            <polygon key={i} points={hexPoints(cx, cy, 18)}
              fill={c30} stroke={c} strokeWidth="1.5" opacity={0.6 + (i % 3) * 0.15} />
          ));
        })()}
        {[70,110,150,190,230].map((x, i) => (
          <circle key={i} cx={x} cy={i % 2 === 0 ? 50 : 28} r="4" fill={c} opacity="0.9" />
        ))}
      </svg>
    ),

    "communication-services": (
      // WiFi/signal waves radiating from center
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[20, 38, 56, 74].map((r, i) => (
          <path key={i} d={`M${140 - r * 1.6},${88 - r * 0.9} A${r * 1.6 * 1.1},${r} 0 0 1 ${140 + r * 1.6},${88 - r * 0.9}`}
            fill="none" stroke={c} strokeWidth="2" opacity={1 - i * 0.18} strokeLinecap="round" />
        ))}
        <circle cx="140" cy="88" r="5" fill={c} />
        <text x="140" y="24" textAnchor="middle" fill={c} fontSize="10" fontWeight="700" opacity="0.8">GOOGL · META · DIS · NFLX</text>
      </svg>
    ),

    "aerospace-defense": (
      // Radar sweep
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <circle cx="140" cy="55" r="40" fill="none" stroke={c} strokeWidth="1" opacity="0.4" />
        <circle cx="140" cy="55" r="28" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
        <circle cx="140" cy="55" r="15" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
        <line x1="100" y1="55" x2="180" y2="55" stroke={c} strokeWidth="1" opacity="0.3" />
        <line x1="140" y1="15" x2="140" y2="95" stroke={c} strokeWidth="1" opacity="0.3" />
        {/* Sweep arm */}
        <line x1="140" y1="55" x2="174" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M140,55 L174,24 A40,40 0 0 0 180,55 Z" fill={c} opacity="0.2" />
        {/* Blips */}
        <circle cx="160" cy="38" r="3" fill={c} opacity="0.9" />
        <circle cx="118" cy="68" r="2" fill={c} opacity="0.6" />
        <text x="140" y="10" textAnchor="middle" fill={c80} fontSize="7" fontWeight="600">RADAR</text>
      </svg>
    ),

    cybersecurity: (
      // Shield with hex pattern
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Background hexagons */}
        {[30,80,130,180,230,55,105,155,205,255].map((x, i) => {
          const y = i < 5 ? 25 : 75;
          const pts = Array.from({ length: 6 }, (_, k) => {
            const a = (Math.PI / 3) * k;
            return `${x + 18 * Math.cos(a)},${y + 18 * Math.sin(a)}`;
          }).join(" ");
          return <polygon key={i} points={pts} fill="none" stroke={c} strokeWidth="0.8" opacity="0.3" />;
        })}
        {/* Shield */}
        <path d="M140,12 L165,25 L165,58 Q165,75 140,88 Q115,75 115,58 L115,25 Z"
          fill={c50} stroke={c} strokeWidth="2" />
        <path d="M131,48 L138,55 L152,40" stroke="white" strokeWidth="3" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),

    biotech: (
      // DNA double helix
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Strand 1 */}
        <path d="M30,10 C70,30 70,70 110,90 C150,110 150,70 190,50 C230,30 230,70 260,90"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        {/* Strand 2 */}
        <path d="M30,90 C70,70 70,30 110,10 C150,-10 150,30 190,50 C230,70 230,30 260,10"
          fill="none" stroke={c80} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        {/* Rungs */}
        {[50, 90, 130, 170, 210, 250].map((x, i) => {
          const y1 = 10 + Math.sin(((x - 30) / 230) * Math.PI * 2) * 40 + 40;
          const y2 = 90 - Math.sin(((x - 30) / 230) * Math.PI * 2) * 40 - 40 + 80;
          return (
            <g key={i}>
              <line x1={x} y1={y1} x2={x} y2={100 - y1} stroke={c} strokeWidth="1.5" opacity="0.5" />
              <circle cx={x} cy={y1} r="3" fill={c} opacity="0.8" />
              <circle cx={x} cy={100 - y1} r="3" fill={c80} opacity="0.8" />
            </g>
          );
        })}
      </svg>
    ),

    "clean-energy": (
      // Solar panel + wind turbine
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Sun */}
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={i} x1={70 + Math.cos(rad) * 18} y1={40 + Math.sin(rad) * 18}
            x2={70 + Math.cos(rad) * 26} y2={40 + Math.sin(rad) * 26}
            stroke={c} strokeWidth="2" strokeLinecap="round" />;
        })}
        <circle cx="70" cy="40" r="14" fill={c50} stroke={c} strokeWidth="1.5" />
        {/* Solar panel */}
        <rect x="30" y="65" width="80" height="25" rx="2" fill={c50} stroke={c} strokeWidth="1.5" />
        {[0,1,2].map((col) => [0,1].map((row) => (
          <rect key={`${col}-${row}`} x={34 + col * 26} y={68 + row * 10} width={22} height={8} rx="1"
            fill={c} opacity="0.5" />
        )))}
        {/* Wind turbine */}
        <line x1="195" y1="100" x2="195" y2="30" stroke={c} strokeWidth="3" strokeLinecap="round" />
        {[0,120,240].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={i} x1="195" y1="30"
            x2={195 + Math.cos(rad - Math.PI / 2) * 32}
            y2={30 + Math.sin(rad - Math.PI / 2) * 32}
            stroke={c} strokeWidth="3" strokeLinecap="round" />;
        })}
        <circle cx="195" cy="30" r="4" fill={c} />
      </svg>
    ),

    "ai-robotics": (
      // Neural network layers
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {(() => {
          const layers = [
            { x: 30,  nodes: [20, 40, 60, 80] },
            { x: 100, nodes: [15, 35, 55, 75, 88] },
            { x: 170, nodes: [20, 42, 64, 80] },
            { x: 240, nodes: [32, 55, 72] },
          ];
          return (
            <>
              {layers.slice(0, -1).map((layer, li) =>
                layer.nodes.map((y1, ni) =>
                  layers[li + 1].nodes.map((y2, nj) => (
                    <line key={`${li}-${ni}-${nj}`}
                      x1={layer.x} y1={y1} x2={layers[li + 1].x} y2={y2}
                      stroke={c} strokeWidth="0.7" opacity="0.25" />
                  ))
                )
              )}
              {layers.map((layer, li) =>
                layer.nodes.map((y, ni) => (
                  <circle key={`${li}-${ni}`} cx={layer.x} cy={y} r="5"
                    fill={c50} stroke={c} strokeWidth="1.5" />
                ))
              )}
            </>
          );
        })()}
      </svg>
    ),

    fintech: (
      // Payment flow with circular nodes
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[
          { x: 30,  y: 50, label: "SQ" },
          { x: 90,  y: 25, label: "PYPL" },
          { x: 90,  y: 75, label: "COIN" },
          { x: 160, y: 50, label: "SOFI" },
          { x: 220, y: 25, label: "AFRM" },
          { x: 220, y: 75, label: "HUB" },
          { x: 255, y: 50, label: "PAY" },
        ].reduce((acc: React.ReactNode[], node, i, arr) => {
          const connections = i < arr.length - 1 ? [[i, i + 1]] : [];
          const edges: React.ReactNode[] = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6]].map(([a,b]) => (
            <line key={`e-${a}-${b}`} x1={arr[a].x} y1={arr[a].y} x2={arr[b].x} y2={arr[b].y}
              stroke={c} strokeWidth="1.2" opacity="0.35" markerEnd="url(#arrow)" />
          ));
          if (i === 0) acc.push(...edges);
          acc.push(
            <g key={node.label}>
              <circle cx={node.x} cy={node.y} r="12" fill={c50} stroke={c} strokeWidth="1.5" />
              <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize="6" fontWeight="700">{node.label}</text>
            </g>
          );
          return acc;
        }, [])}
      </svg>
    ),

    "gaming-esports": (
      // Pixel-art style rising chart + controller hint
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Pixel bars */}
        {[55,65,45,75,60,80,70,85,75,90,82,95].map((h, i) => (
          <rect key={i} x={10 + i * 22} y={98 - h} width={16} height={h}
            fill={i % 2 === 0 ? c : c80} rx="1" opacity="0.8" />
        ))}
        {/* Controller outline */}
        <path d="M195,35 Q185,30 183,45 Q185,65 195,70 Q205,75 220,70 Q235,75 245,70 Q255,65 257,45 Q255,30 245,35 Q235,25 220,30 Q205,25 195,35 Z"
          fill={c50} stroke={c} strokeWidth="1.5" />
        <line x1="210" y1="50" x2="218" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <line x1="214" y1="46" x2="214" y2="54" stroke={c} strokeWidth="2" strokeLinecap="round" />
        <circle cx="232" cy="48" r="3" fill={c} opacity="0.7" />
        <circle cx="238" cy="54" r="3" fill={c} opacity="0.7" />
      </svg>
    ),

    /* ── STRATEGIES ──────────────────────────────────────────── */

    momentum: (
      // Steep upward arrow chart
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <defs>
          <linearGradient id={`mg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.4" />
            <stop offset="100%" stopColor={c} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d="M15,90 L40,80 L65,72 L90,58 L115,48 L140,36 L165,28 L190,18 L215,12 L240,8 L265,5 L265,95 L15,95 Z"
          fill={`url(#mg-${color.replace('#','')})`} />
        <polyline points="15,90 40,80 65,72 90,58 115,48 140,36 165,28 190,18 215,12 240,8 265,5"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="265,5 255,10 258,18" fill={c} />
      </svg>
    ),

    "mean-reversion": (
      // Sine wave oscillating around a mean line
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <line x1="10" y1="50" x2="270" y2="50" stroke={c80} strokeWidth="1.5" strokeDasharray="6 4" />
        <path d="M10,50 C30,15 50,15 70,50 C90,85 110,85 130,50 C150,15 170,15 190,50 C210,85 230,85 250,50 C260,32 270,32 270,50"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        <text x="140" y="12" textAnchor="middle" fill={c80} fontSize="8">Mean</text>
        <circle cx="70" cy="50" r="4" fill={c} />
        <circle cx="130" cy="50" r="4" fill={c} />
        <circle cx="190" cy="50" r="4" fill={c} />
        <circle cx="250" cy="50" r="4" fill={c} />
      </svg>
    ),

    "risk-parity": (
      // Balanced pie chart with equal slices labeled
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[
          { start: -90, end: 30,  label: "Stocks",  col: c },
          { start: 30,  end: 150, label: "Bonds",   col: c80 },
          { start: 150, end: 270, label: "Commod.", col: c50 },
        ].map(({ start, end, label, col }) => {
          const a1 = (start * Math.PI) / 180, a2 = (end * Math.PI) / 180;
          const r = 38;
          const cx = 100, cy = 52;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const mid = (a1 + a2) / 2;
          const lx = cx + (r + 14) * Math.cos(mid), ly = cy + (r + 14) * Math.sin(mid);
          return (
            <g key={label}>
              <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z`}
                fill={col} stroke="none" opacity="0.85" />
              <text x={lx} y={ly + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">{label}</text>
            </g>
          );
        })}
        <circle cx="100" cy="52" r="14" fill={c30} stroke={c} strokeWidth="1" />
        {/* Legend / balance visual */}
        <text x="185" y="35" fill={c} fontSize="9" fontWeight="700">Equal Risk</text>
        <line x1="175" y1="52" x2="255" y2="52" stroke={c} strokeWidth="2" />
        <polygon points="175,52 182,46 182,58" fill={c} />
        <polygon points="255,52 248,46 248,58" fill={c} />
        <text x="215" y="68" textAnchor="middle" fill={c80} fontSize="8">Balanced</text>
      </svg>
    ),

    dca: (
      // Equal-height bars at regular intervals (dollar-cost averaging)
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[0,1,2,3,4,5,6,7,8,9].map((i) => (
          <g key={i}>
            <rect x={12 + i * 26} y={55} width={18} height={35} rx="2" fill={c50} stroke={c} strokeWidth="1" />
            <text x={21 + i * 26} y={50} textAnchor="middle" fill={c} fontSize="7" fontWeight="600">${(100).toFixed(0)}</text>
          </g>
        ))}
        <line x1="8" y1="55" x2="272" y2="55" stroke={c} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="140" y="15" textAnchor="middle" fill={c80} fontSize="9" fontWeight="600">$100 every week</text>
        {/* price line that wobbles */}
        <polyline points="12,38 38,28 64,42 90,22 116,35 142,18 168,30 194,15 220,28 246,12 272,22"
          fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
      </svg>
    ),

    "factor-value": (
      // Value histogram (P/E distribution) + magnifying glass
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {[30,50,72,58,42,28,18,12].map((h, i) => (
          <rect key={i} x={18 + i * 28} y={90 - h} width={20} height={h} rx="2"
            fill={i <= 2 ? c : `${c}40`} opacity="0.9" />
        ))}
        <text x="60" y={90 - 72 - 5} textAnchor="middle" fill="white" fontSize="7" fontWeight="700">BUY</text>
        <line x1="104" y1="90" x2="104" y2="10" stroke={c} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="104" y="8" textAnchor="middle" fill={c80} fontSize="7">Low P/E →</text>
        {/* Magnifying glass */}
        <circle cx="220" cy="48" r="24" fill="none" stroke={c} strokeWidth="2.5" />
        <circle cx="220" cy="48" r="14" fill={c30} />
        <line x1="238" y1="66" x2="255" y2="83" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <text x="220" y="52" textAnchor="middle" fill={c} fontSize="10" fontWeight="700">$</text>
      </svg>
    ),

    "pairs-trading": (
      // Two mirrored sine waves (spread)
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <path d="M10,50 C35,20 55,20 80,50 C105,80 125,80 150,50 C175,20 195,20 220,50 C245,80 265,80 270,50"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M10,50 C35,80 55,80 80,50 C105,20 125,20 150,50 C175,80 195,80 220,50 C245,20 265,20 270,50"
          fill="none" stroke={c80} strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" />
        <line x1="10" y1="50" x2="270" y2="50" stroke={c} strokeWidth="1" opacity="0.3" />
        <text x="30" y="22" fill={c} fontSize="8" fontWeight="600">Long</text>
        <text x="30" y="82" fill={c80} fontSize="8" fontWeight="600">Short</text>
      </svg>
    ),

    "stat-arb": (
      // Scatter plot of points converging toward zero
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <line x1="20" y1="50" x2="265" y2="50" stroke={c80} strokeWidth="1.5" strokeDasharray="5 3" />
        {[
          [30,18],[48,75],[65,28],[82,68],[100,38],[118,62],
          [135,44],[152,56],[170,48],[188,52],[205,50],[222,50],[240,50],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.5 - i * 0.18} fill={c} opacity={0.5 + i * 0.04} />
        ))}
        <text x="255" y="46" fill={c} fontSize="8" fontWeight="700">→0</text>
      </svg>
    ),

    "trend-following": (
      // Two moving averages crossing with signal zones
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Price line */}
        <polyline points="10,70 30,65 50,72 70,60 90,50 110,42 130,35 150,28 170,25 190,20 210,22 230,18 260,15"
          fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" />
        {/* Fast MA */}
        <polyline points="10,68 50,65 90,50 130,36 170,24 210,20 260,15"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        {/* Slow MA */}
        <polyline points="10,72 50,70 90,65 130,55 170,40 210,28 260,20"
          fill="none" stroke={c80} strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round" />
        {/* Cross signal */}
        <circle cx="130" cy="55" r="6" fill="none" stroke={c} strokeWidth="2" />
        <text x="140" y="80" fill={c80} fontSize="7">CROSS → BUY</text>
        <text x="15" y="15" fill={c} fontSize="7" fontWeight="600">Fast MA</text>
        <text x="15" y="25" fill={c80} fontSize="7">Slow MA</text>
      </svg>
    ),

    "volatility-harvesting": (
      // Bell curve (implied vol distribution) + premium bar
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <defs>
          <linearGradient id={`vg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.5" />
            <stop offset="100%" stopColor={c} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d="M10,90 Q40,88 70,70 Q90,55 110,30 Q130,10 140,8 Q150,10 160,30 Q180,55 200,70 Q230,88 260,90 Z"
          fill={`url(#vg-${color.replace('#','')})`} />
        <path d="M10,90 Q40,88 70,70 Q90,55 110,30 Q130,10 140,8 Q150,10 160,30 Q180,55 200,70 Q230,88 260,90"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="140" y1="8" x2="140" y2="92" stroke={c} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <text x="140" y="98" textAnchor="middle" fill={c80} fontSize="7">Sell Premium Here</text>
        <text x="50" y="65" fill={c} fontSize="7">IV</text>
        <text x="215" y="65" fill={c} fontSize="7">IV</text>
      </svg>
    ),

    "smart-beta": (
      // Spider/radar chart (5 factors)
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {(() => {
          const cx = 140, cy = 52, factors = ["Value","Momentum","Quality","Low Vol","Growth"];
          const angles = factors.map((_, i) => ((i * 72 - 90) * Math.PI) / 180);
          const scores = [0.8, 0.7, 0.9, 0.6, 0.75];
          const R = 38;
          const outerPts = angles.map((a) => [cx + R * Math.cos(a), cy + R * Math.sin(a)]);
          const innerPts = angles.map((a, i) => [cx + R * scores[i] * Math.cos(a), cy + R * scores[i] * Math.sin(a)]);
          return (
            <>
              {/* Grid rings */}
              {[0.33, 0.66, 1].map((frac) => (
                <polygon key={frac}
                  points={outerPts.map(([x, y]) => `${cx + (x - cx) * frac},${cy + (y - cy) * frac}`).join(" ")}
                  fill="none" stroke={c} strokeWidth="0.8" opacity="0.3" />
              ))}
              {/* Spokes */}
              {outerPts.map(([x, y], i) => (
                <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={c} strokeWidth="0.8" opacity="0.3" />
              ))}
              {/* Score area */}
              <polygon points={innerPts.map(([x, y]) => `${x},${y}`).join(" ")}
                fill={c50} stroke={c} strokeWidth="1.8" opacity="0.7" />
              {/* Labels */}
              {outerPts.map(([x, y], i) => (
                <text key={i} x={cx + (x - cx) * 1.22} y={cy + (y - cy) * 1.22 + 3}
                  textAnchor="middle" fill="white" fontSize="6" fontWeight="600">{factors[i]}</text>
              ))}
            </>
          );
        })()}
      </svg>
    ),

    "sector-rotation": (
      // Circular rotation diagram with sectors
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {["Recovery","Expansion","Peak","Contraction"].map((label, i) => {
          const a = ((i * 90 - 90) * Math.PI) / 180;
          const x = 100 + 38 * Math.cos(a), y = 50 + 38 * Math.sin(a);
          const a2 = ((i * 90 + 45 - 90) * Math.PI) / 180;
          const ax = 100 + 52 * Math.cos(a2), ay = 50 + 52 * Math.sin(a2);
          return (
            <g key={label}>
              <circle cx={x} cy={y} r="13" fill={c50} stroke={c} strokeWidth="1.5" />
              <text x={x} y={y + 3} textAnchor="middle" fill="white" fontSize="5.5" fontWeight="700">{label}</text>
              <path d={`M${ax - 4},${ay - 4} L${ax + 4},${ay} L${ax - 4},${ay + 4}`}
                fill={c} opacity="0.8" transform={`rotate(${i * 90}, ${ax}, ${ay})`} />
            </g>
          );
        })}
        <circle cx="100" cy="50" r="14" fill={c30} stroke={c} strokeWidth="1" />
        <text x="100" y="54" textAnchor="middle" fill={c} fontSize="7" fontWeight="700">CYCLE</text>
        {/* Sectors bar chart on right */}
        {[["Tech",65],["Def",42],["Fin",55],["Util",30]].map(([s,h], i) => (
          <g key={s as string}>
            <rect x={168 + i * 26} y={90 - (h as number)} width={18} height={h as number} rx="2" fill={c} opacity={0.5 + i * 0.1} />
            <text x={177 + i * 26} y={96} textAnchor="middle" fill="white" fontSize="6">{s as string}</text>
          </g>
        ))}
      </svg>
    ),

    "options-wheel": (
      // Wheel/circular flow diagram: Put → Assigned → Call → Expired
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Outer circle */}
        <circle cx="110" cy="50" r="40" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="6 3" />
        {/* Steps */}
        {[
          { angle: -90, label: "Sell Put", sub: "earn premium" },
          { angle: 0,   label: "Assigned", sub: "buy stock" },
          { angle: 90,  label: "Sell Call", sub: "earn premium" },
          { angle: 180, label: "Expired", sub: "keep premium" },
        ].map(({ angle, label, sub }) => {
          const a = (angle * Math.PI) / 180;
          const x = 110 + 40 * Math.cos(a), y = 50 + 40 * Math.sin(a);
          const arrowAngle = angle + 70;
          const aa = (arrowAngle * Math.PI) / 180;
          const ax = 110 + 40 * Math.cos(aa), ay = 50 + 40 * Math.sin(aa);
          return (
            <g key={label}>
              <circle cx={x} cy={y} r="10" fill={c50} stroke={c} strokeWidth="1.5" />
              <text x={x} y={y - 14} textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">{label}</text>
              <text x={x} y={y - 5} textAnchor="middle" fill={c80} fontSize="5.5">{sub}</text>
            </g>
          );
        })}
        {/* Income bars */}
        {[0,1,2,3,4].map((i) => (
          <rect key={i} x={185 + i * 16} y={70 - i * 8} width={10} height={22 + i * 8} rx="2" fill={c} opacity="0.7" />
        ))}
        <text x="215" y="98" textAnchor="middle" fill={c80} fontSize="7">Premium Income</text>
      </svg>
    ),

    "dividend-growth": (
      // Staircase chart + dividend arrows
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Stair bars */}
        {[15,22,29,36,43,47,53,58,63,68].map((h, i) => (
          <rect key={i} x={12 + i * 26} y={90 - h} width={22} height={h} rx="1"
            fill={c} opacity={0.5 + i * 0.05} />
        ))}
        {/* Dividend arrows */}
        {[1,3,5,7,9].map((i) => (
          <g key={i}>
            <line x1={23 + i * 26} y1={90 - [15,22,29,36,43,47,53,58,63,68][i] - 5}
              x2={23 + i * 26} y2={90 - [15,22,29,36,43,47,53,58,63,68][i] - 14}
              stroke={c} strokeWidth="1.5" />
            <polygon points={`${23 + i * 26},${90 - [15,22,29,36,43,47,53,58,63,68][i] - 5} ${19 + i * 26},${90 - [15,22,29,36,43,47,53,58,63,68][i] - 12} ${27 + i * 26},${90 - [15,22,29,36,43,47,53,58,63,68][i] - 12}`}
              fill={c} opacity="0.8" />
          </g>
        ))}
        <text x="140" y="10" textAnchor="middle" fill={c80} fontSize="8" fontWeight="600">Growing Dividends</text>
      </svg>
    ),

    "breakout-trading": (
      // Chart consolidating then breaking through resistance
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Resistance line */}
        <line x1="10" y1="45" x2="175" y2="45" stroke={c80} strokeWidth="1.5" strokeDasharray="5 3" />
        <text x="80" y="40" textAnchor="middle" fill={c80} fontSize="7">Resistance</text>
        {/* Consolidation */}
        <polyline points="10,70 30,65 50,68 70,62 90,66 110,60 130,63 150,58 170,61"
          fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
        {/* Breakout spike */}
        <polyline points="170,61 185,45 200,28 220,15 245,10 268,8"
          fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        {/* Volume bars */}
        {[12,8,14,10,12,9,11,10,9,28,35,30,25,20,15].map((h, i) => (
          <rect key={i} x={10 + i * 17} y={95 - h} width={12} height={h} rx="1"
            fill={i >= 9 ? c : `${c}40`} opacity="0.7" />
        ))}
        <polygon points="268,8 258,13 261,21" fill={c} />
      </svg>
    ),

    "market-neutral": (
      // Long line up, short line down, net = flat
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <line x1="15" y1="50" x2="265" y2="50" stroke={c80} strokeWidth="1" strokeDasharray="4 4" />
        {/* Long leg goes up */}
        <polyline points="15,60 50,52 85,44 120,36 155,28 190,22 225,16 260,12"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        {/* Short leg goes down */}
        <polyline points="15,40 50,48 85,56 120,64 155,72 190,78 225,84 260,88"
          fill="none" stroke={c80} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 3" />
        <text x="20" y="10" fill={c} fontSize="7" fontWeight="600">▲ Long</text>
        <text x="20" y="98" fill={c80} fontSize="7" fontWeight="600">▼ Short</text>
        <text x="140" y="50" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" dy="-4">Net ≈ 0</text>
      </svg>
    ),

    /* ── SAFETIES ─────────────────────────────────────────────── */

    treasury: (
      // Stars and stripes style + yield bar
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Stripes */}
        {[0,1,2,3,4,5,6].map((i) => (
          <rect key={i} x="10" y={12 + i * 12} width="120" height="10"
            fill={i % 2 === 0 ? c : c30} opacity="0.6" rx="1" />
        ))}
        {/* Star field */}
        <rect x="10" y="12" width="50" height="48" fill={c50} rx="1" />
        {[20,30,40,50].map((x) => [18,28,38,44,54].map((y) => (
          <text key={`${x}-${y}`} x={x} y={y} fill="white" fontSize="7" textAnchor="middle" opacity="0.9">★</text>
        )))}
        {/* Yield visualization */}
        <text x="195" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="900">4.8%</text>
        <text x="195" y="40" textAnchor="middle" fill={c80} fontSize="8">Annual Yield</text>
        <rect x="155" y="55" width="80" height="12" rx="3" fill={c30} />
        <rect x="155" y="55" width={80 * 0.85} height="12" rx="3" fill={c} opacity="0.8" />
        <text x="195" y="80" textAnchor="middle" fill={c80} fontSize="7">U.S. Government Backed</text>
      </svg>
    ),

    hysa: (
      // Savings jar filling up
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Jar */}
        <path d="M85,20 H125 V25 Q140,22 140,30 V85 Q140,92 120,92 H80 Q60,92 60,85 V30 Q60,22 75,25 V20 Z"
          fill={c30} stroke={c} strokeWidth="2" />
        {/* Water fill */}
        <path d="M61,65 Q100,58 139,65 V85 Q139,91 120,91 H80 Q61,91 61,85 Z"
          fill={c50} opacity="0.8" />
        {/* Fill level label */}
        <text x="100" y="80" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">5.1% APY</text>
        {/* Dollar signs rising */}
        {[75,95,115].map((x, i) => (
          <text key={x} x={x} y={55 - i * 8} fill={c} fontSize="12" fontWeight="700" opacity={0.4 + i * 0.3}>$</text>
        ))}
        {/* Legend */}
        <text x="185" y="45" textAnchor="middle" fill="white" fontSize="10" fontWeight="900">HYSA</text>
        <text x="185" y="62" textAnchor="middle" fill={c80} fontSize="8">High-Yield</text>
        <text x="185" y="74" textAnchor="middle" fill={c80} fontSize="8">Savings</text>
        <text x="185" y="88" textAnchor="middle" fill={c} fontSize="8" fontWeight="700">Fully Liquid</text>
      </svg>
    ),

    "low-vol": (
      // Smooth low-amplitude wave vs jagged high-vol wave
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* High vol (jagged, faded) */}
        <polyline points="10,50 30,20 50,75 70,15 90,70 110,22 130,68 150,18 170,72 190,20 210,65 230,25 250,60 270,30"
          fill="none" stroke={c} strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
        {/* Low vol (smooth) */}
        <path d="M10,50 C40,42 60,58 90,50 C120,42 140,58 170,50 C200,42 220,58 250,50 C260,47 265,50 270,50"
          fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <text x="140" y="18" textAnchor="middle" fill={c80} fontSize="7">High Vol</text>
        <text x="140" y="85" textAnchor="middle" fill={c} fontSize="8" fontWeight="700">Low Volatility ✓</text>
      </svg>
    ),

    cash: (
      // Coin stack + bills
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Bills fanned */}
        {[8,4,0].map((offset, i) => (
          <g key={i} transform={`translate(${offset}, ${-offset})`}>
            <rect x="30" y="50" width="100" height="40" rx="4"
              fill={i === 0 ? c50 : c30} stroke={c} strokeWidth="1.2" opacity={0.7 + i * 0.1} />
            {i === 0 && (
              <>
                <circle cx="80" cy="70" r="12" fill={c30} stroke={c} strokeWidth="1" />
                <text x="80" y="74" textAnchor="middle" fill={c} fontSize="13" fontWeight="900">$</text>
                <text x="38" y="62" fill={c80} fontSize="6">100</text>
                <text x="38" y="84" fill={c80} fontSize="6">100</text>
              </>
            )}
          </g>
        ))}
        {/* Coin stack */}
        {[0,1,2,3,4].map((i) => (
          <ellipse key={i} cx="195" cy={85 - i * 10} rx="28" ry="7"
            fill={i === 4 ? c50 : c} stroke={c80} strokeWidth="1" opacity={0.6 + i * 0.08} />
        ))}
        <text x="195" y="89" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">$</text>
      </svg>
    ),

    "money-market": (
      // Water flow / ripple effect
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Ripples */}
        {[15,28,42,56].map((r, i) => (
          <ellipse key={i} cx="140" cy="50" rx={r * 3.2} ry={r}
            fill="none" stroke={c} strokeWidth="1.5" opacity={1 - i * 0.2} />
        ))}
        <circle cx="140" cy="50" r="14" fill={c50} stroke={c} strokeWidth="2" />
        <text x="140" y="54" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">MM</text>
        <text x="140" y="90" textAnchor="middle" fill={c80} fontSize="8">Daily Liquidity · 5.3% APY</text>
        {/* Flow arrows */}
        {[40, 90].map((x) => (
          <g key={x}>
            <line x1={x} y1="20" x2={x + 15} y2="20" stroke={c} strokeWidth="1.5" />
            <polygon points={`${x + 15},17 ${x + 22},20 ${x + 15},23`} fill={c} opacity="0.7" />
          </g>
        ))}
        {[155, 205].map((x) => (
          <g key={x}>
            <line x1={x} y1="20" x2={x + 15} y2="20" stroke={c} strokeWidth="1.5" />
            <polygon points={`${x + 15},17 ${x + 22},20 ${x + 15},23`} fill={c} opacity="0.7" />
          </g>
        ))}
      </svg>
    ),

    "short-term-bonds": (
      // Short staircase with maturity dates
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Staircase */}
        <path d="M20,80 H80 V65 H140 V50 H200 V35 H260"
          fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Filled area */}
        <path d="M20,80 H80 V65 H140 V50 H200 V35 H260 V90 H20 Z"
          fill={c30} opacity="0.5" />
        <path d="M20,80 H80 V65 H140 V50 H200 V35 H260 V90 H20 Z"
          fill={c50} opacity="0.4" />
        {/* Maturity labels */}
        {[["6mo", 50],["1yr", 110],["2yr", 170],["3yr", 230]].map(([label, x]) => (
          <text key={label as string} x={x as number} y={96} textAnchor="middle" fill={c80} fontSize="7" fontWeight="600">{label}</text>
        ))}
        <text x="140" y="15" textAnchor="middle" fill={c} fontSize="9" fontWeight="700">4.5% APY · Low Duration Risk</text>
      </svg>
    ),

    tips: (
      // CPI chart + shield with checkmark
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* CPI bar chart */}
        {[3.2,4.1,5.5,7.0,8.3,6.5,4.9,3.8,3.1,2.9].map((h, i) => (
          <rect key={i} x={12 + i * 22} y={85 - h * 5} width={16} height={h * 5} rx="2"
            fill={h > 6 ? "#ef4444" : c} opacity="0.8" />
        ))}
        <text x="110" y="98" textAnchor="middle" fill={c80} fontSize="7">CPI Inflation</text>
        {/* Shield */}
        <path d="M210,12 L235,24 L235,55 Q235,70 210,82 Q185,70 185,55 L185,24 Z"
          fill={c50} stroke={c} strokeWidth="2" />
        <path d="M200,46 L207,53 L222,38" stroke="white" strokeWidth="3" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        <text x="210" y="92" textAnchor="middle" fill={c80} fontSize="7" fontWeight="600">Protected</text>
      </svg>
    ),

    "muni-bonds": (
      // Bridge arch
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Road */}
        <rect x="0" y="80" width="280" height="12" fill={c50} opacity="0.4" rx="2" />
        {/* Main arch */}
        <path d="M20,82 Q140,10 260,82" fill="none" stroke={c} strokeWidth="3" />
        {/* Suspension cables */}
        {[60,100,140,180,220].map((x) => {
          const t = (x - 20) / 240;
          const y = 82 - 72 * 4 * t * (1 - t);
          return (
            <g key={x}>
              <line x1={x} y1={y} x2={x} y2={82} stroke={c80} strokeWidth="1" opacity="0.6" />
            </g>
          );
        })}
        {/* Towers */}
        <rect x="95" y="40" width="8" height="42" fill={c} opacity="0.8" />
        <rect x="177" y="40" width="8" height="42" fill={c} opacity="0.8" />
        <text x="140" y="96" textAnchor="middle" fill={c80} fontSize="7" fontWeight="600">Tax-Exempt Income</text>
        <text x="140" y="38" textAnchor="middle" fill={c} fontSize="9" fontWeight="700">3.7% APY</text>
      </svg>
    ),

    "stable-value": (
      // Flat stable line with shield
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Comparison: volatile line */}
        <polyline points="10,55 35,25 60,70 85,18 110,60 135,22 160,65 185,20 210,55 235,30 260,50"
          fill="none" stroke={c} strokeWidth="1.5" opacity="0.2" />
        {/* Stable flat line */}
        <path d="M10,50 Q70,48 140,50 Q210,52 270,50"
          fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
        {/* Shield */}
        <path d="M118,20 L130,26 L130,44 Q130,53 118,60 Q106,53 106,44 L106,26 Z"
          fill={c50} stroke={c} strokeWidth="1.5" />
        <path d="M112,40 L117,45 L125,36" stroke="white" strokeWidth="2" fill="none"
          strokeLinecap="round" strokeLinejoin="round" />
        <text x="168" y="40" fill={c} fontSize="9" fontWeight="700">4.2% APY</text>
        <text x="168" y="55" fill={c80} fontSize="7">Principal</text>
        <text x="168" y="65" fill={c80} fontSize="7">Guaranteed</text>
      </svg>
    ),

    "cd-ladder": (
      // Ladder with rungs at different heights
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        {/* Ladder rails */}
        <line x1="60" y1="10" x2="60" y2="92" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <line x1="160" y1="10" x2="160" y2="92" stroke={c} strokeWidth="3" strokeLinecap="round" />
        {/* Rungs with maturity labels */}
        {[["3 mo",85,"5.1%"],["6 mo",70,"5.0%"],["1 yr",55,"4.9%"],["2 yr",40,"4.8%"],["3 yr",25,"4.7%"]].map(([label, y, rate]) => (
          <g key={label as string}>
            <line x1="60" y1={y as number} x2="160" y2={y as number} stroke={c} strokeWidth="2.5" strokeLinecap="round" />
            <text x="50" y={(y as number) + 4} textAnchor="end" fill={c80} fontSize="7">{label as string}</text>
            <text x="170" y={(y as number) + 4} fill={c} fontSize="7" fontWeight="600">{rate as string}</text>
          </g>
        ))}
        {/* Maturing arrow */}
        <path d="M110,92 L110,80 M106,84 L110,80 L114,84" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        <text x="195" y="92" fill="white" fontSize="7" fontWeight="700">Matures →</text>
        <text x="195" y="78" fill={c80} fontSize="7">Stagger dates</text>
        <text x="195" y="66" fill={c80} fontSize="7">for liquidity</text>
      </svg>
    ),
  };

  const visual = visuals[id];
  if (!visual) {
    // Fallback: generic sparkline
    return (
      <svg viewBox="0 0 280 100" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        <rect width="280" height="100" fill={c30} />
        <polyline
          points="10,70 50,55 90,60 130,40 170,45 210,30 250,25 270,20"
          fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    );
  }

  return <>{visual}</>;
}
