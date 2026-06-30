import { useMemo, useRef, useEffect } from 'react';
import { getUserById } from '../data/users';
import './FamilyTree.css';

const RELATION_COLORS = {
  father: { stroke: '#00aaff', fill: 'rgba(0,170,255,0.12)', label: '#00aaff' },
  mother: { stroke: '#ff70b0', fill: 'rgba(255,112,176,0.12)', label: '#ff70b0' },
  sibling: { stroke: '#00f5ff', fill: 'rgba(0,245,255,0.08)', label: '#00f5ff' },
  self: { stroke: '#39ff14', fill: 'rgba(57,255,20,0.1)', label: '#39ff14' },
  child: { stroke: '#ffaa00', fill: 'rgba(255,170,0,0.1)', label: '#ffaa00' },
};

function NodeCard({ node, cx, cy, isCenter }) {
  const rc = RELATION_COLORS[isCenter ? 'self' : node.relation] || RELATION_COLORS.sibling;
  const initials = node.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <g
      transform={`translate(${cx - 68}, ${cy - 48})`}
      className={`tree-node ${isCenter ? 'tree-node--center' : ''}`}
    >
      {/* Card background */}
      <rect
        width="136"
        height="96"
        rx="10"
        fill={rc.fill}
        stroke={rc.stroke}
        strokeWidth={isCenter ? 2 : 1}
        filter={isCenter ? 'url(#glow-center)' : 'url(#glow-node)'}
      />

      {/* Avatar circle */}
      <circle
        cx="40"
        cy="48"
        r="26"
        fill="rgba(0,0,0,0.5)"
        stroke={rc.stroke}
        strokeWidth="1.5"
      />
      {isCenter && (
        <circle
          cx="40"
          cy="48"
          r="32"
          fill="none"
          stroke={rc.stroke}
          strokeWidth="0.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />
      )}

      {/* Initials */}
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fill={rc.label}
        fontFamily="'Orbitron', monospace"
        fontSize={isCenter ? '13' : '11'}
        fontWeight="700"
        letterSpacing="1"
      >
        {initials}
      </text>

      {/* Name */}
      <text
        x="80"
        y="36"
        fill="#e8f9ff"
        fontFamily="'Share Tech Mono', monospace"
        fontSize="10"
        fontWeight="500"
      >
        {node.name.split(' ')[0].toUpperCase()}
      </text>
      <text
        x="80"
        y="50"
        fill="rgba(232,249,255,0.65)"
        fontFamily="'Share Tech Mono', monospace"
        fontSize="9"
      >
        {node.name.split(' ').slice(1).join(' ').toUpperCase()}
      </text>

      {/* Relation badge */}
      <rect x="80" y="58" width={node.relation?.length * 6.5 + 10 || 52} height="16" rx="4"
        fill={`${rc.stroke}22`} stroke={rc.stroke} strokeWidth="0.8" />
      <text
        x={80 + (node.relation?.length * 6.5 + 10) / 2 || 106}
        y="70"
        textAnchor="middle"
        fill={rc.label}
        fontFamily="'Share Tech Mono', monospace"
        fontSize="8"
        letterSpacing="0.8"
      >
        {(isCenter ? 'SUBJECT' : node.relation?.toUpperCase()) || 'UNKNOWN'}
      </text>

      {/* Age */}
      {node.age && (
        <text x="80" y="88" fill="rgba(232,249,255,0.4)" fontFamily="'Share Tech Mono', monospace" fontSize="8">
          AGE: {node.age}
        </text>
      )}
    </g>
  );
}

export default function FamilyTree({ user }) {
  const svgRef = useRef(null);

  // Build node layout
  const { nodes, edges, svgWidth, svgHeight } = useMemo(() => {
    const centerX = 460;
    const centerY = 200;
    const nodeW = 140;
    const nodeH = 100;

    const familyMembers = user.family
      .map(f => {
        const u = getUserById(f.user_id);
        return u ? { ...u, relation: f.relation } : null;
      })
      .filter(Boolean);

    // Group by relation
    const fathers = familyMembers.filter(m => m.relation === 'father');
    const mothers = familyMembers.filter(m => m.relation === 'mother');
    const siblings = familyMembers.filter(m => m.relation === 'sibling');
    const children = familyMembers.filter(m => m.relation === 'child');
    const parents = [...fathers, ...mothers];

    const positions = {};
    const nodesArr = [];
    const edgesArr = [];

    // Center node (subject)
    positions[user.id] = { x: centerX, y: centerY };
    nodesArr.push({ ...user, relation: 'self', x: centerX, y: centerY, isCenter: true });

    // Parents — above center
    const parentY = centerY - 200;
    const parentSpacing = Math.max(nodeW + 60, 220);
    const parentStartX = centerX - ((parents.length - 1) * parentSpacing) / 2;
    parents.forEach((p, i) => {
      const px = parentStartX + i * parentSpacing;
      positions[p.id] = { x: px, y: parentY };
      nodesArr.push({ ...p, x: px, y: parentY });
      edgesArr.push({ from: p.id, to: user.id, relation: p.relation });
    });

    // Siblings — right side, vertically stacked
    const siblingX = centerX + 280;
    const siblingSpacing = nodeH + 28;
    const siblingStartY = centerY - ((siblings.length - 1) * siblingSpacing) / 2;
    siblings.forEach((s, i) => {
      const sy = siblingStartY + i * siblingSpacing;
      positions[s.id] = { x: siblingX, y: sy };
      nodesArr.push({ ...s, x: siblingX, y: sy });
      edgesArr.push({ from: user.id, to: s.id, relation: 'sibling' });
    });

    // Children — below center
    const childY = centerY + 200;
    const childSpacing = nodeW + 50;
    const childStartX = centerX - ((children.length - 1) * childSpacing) / 2;
    children.forEach((c, i) => {
      const cx2 = childStartX + i * childSpacing;
      positions[c.id] = { x: cx2, y: childY };
      nodesArr.push({ ...c, x: cx2, y: childY });
      edgesArr.push({ from: user.id, to: c.id, relation: 'child' });
    });

    // Compute SVG bounds
    const allX = nodesArr.map(n => n.x);
    const allY = nodesArr.map(n => n.y);
    const minX = Math.min(...allX) - 90;
    const maxX = Math.max(...allX) + 90;
    const minY = Math.min(...allY) - 70;
    const maxY = Math.max(...allY) + 70;
    const W = Math.max(maxX - minX, 700);
    const H = Math.max(maxY - minY, 420);

    // Shift all nodes so they fit
    const offsetX = -minX;
    const offsetY = -minY;
    nodesArr.forEach(n => { n.x += offsetX; n.y += offsetY; });
    const posAdjusted = {};
    Object.keys(positions).forEach(k => {
      posAdjusted[k] = { x: positions[k].x + offsetX, y: positions[k].y + offsetY };
    });

    return { nodes: nodesArr, edges: edgesArr, positions: posAdjusted, svgWidth: W, svgHeight: H, positionsMap: posAdjusted };
  }, [user]);

  // Re-derive positions for edges from nodes
  const posMap = useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = { x: n.x, y: n.y }; });
    return m;
  }, [nodes]);

  if (!user.family || user.family.length === 0) {
    return (
      <div className="family-tree glass-card animate-fade-in-up delay-3">
        <div className="family-tree__header">
          <span className="font-mono family-tree__title-label">// FAMILY NETWORK</span>
          <span className="badge badge-warning"><span className="badge-dot" />No Relations Found</span>
        </div>
        <div className="family-tree__empty">
          <p className="font-mono text-muted" style={{ textAlign: 'center', padding: '32px' }}>
            No family linkages registered for this identity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-tree glass-card animate-fade-in-up delay-3">
      {/* Header */}
      <div className="family-tree__header">
        <div className="family-tree__title-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
            <circle cx="12" cy="5" r="3" /><circle cx="5" cy="20" r="3" /><circle cx="19" cy="20" r="3" />
            <line x1="12" y1="8" x2="5" y2="17" /><line x1="12" y1="8" x2="19" y2="17" />
          </svg>
          <span className="font-mono family-tree__title-label">FAMILY RETRIEVAL — LINK NODE DIAGRAM</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-cyan"><span className="badge-dot" />{nodes.length} nodes</span>
          <span className="badge badge-green"><span className="badge-dot" />{edges.length} links</span>
        </div>
      </div>

      {/* Legend */}
      <div className="family-tree__legend">
        {Object.entries(RELATION_COLORS).filter(([k]) => k !== 'self').map(([rel, col]) => (
          <div key={rel} className="legend-item">
            <div className="legend-dot" style={{ background: col.stroke, boxShadow: `0 0 8px ${col.stroke}` }} />
            <span className="font-mono legend-label">{rel.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* SVG Tree */}
      <div className="family-tree__canvas">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="family-tree__svg"
          aria-label="Family relationship diagram"
          role="img"
        >
          <defs>
            {/* Glow filters */}
            <filter id="glow-center" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-node" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Arrow markers */}
            {Object.entries(RELATION_COLORS).map(([rel, col]) => (
              <marker
                key={rel}
                id={`arrow-${rel}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={col.stroke} opacity="0.8" />
              </marker>
            ))}

            {/* Gradient for edges */}
            <linearGradient id="edge-grad-parent" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00aaff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="edge-grad-sibling" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid overlay */}
          <g opacity="0.04">
            {Array.from({ length: Math.ceil(svgWidth / 40) }, (_, i) => (
              <line key={`vg${i}`} x1={i * 40} y1={0} x2={i * 40} y2={svgHeight} stroke="#00f5ff" strokeWidth="0.5" />
            ))}
            {Array.from({ length: Math.ceil(svgHeight / 40) }, (_, i) => (
              <line key={`hg${i}`} x1={0} y1={i * 40} x2={svgWidth} y2={i * 40} stroke="#00f5ff" strokeWidth="0.5" />
            ))}
          </g>

          {/* Edges / connections */}
          {edges.map((edge, i) => {
            const from = posMap[edge.from];
            const to = posMap[edge.to];
            if (!from || !to) return null;
            const col = RELATION_COLORS[edge.relation] || RELATION_COLORS.sibling;

            // Bezier control points
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            // Perpendicular offset for curve
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const norm = { x: -dy / len, y: dx / len };
            const curvature = 0.2;
            const cx = midX + norm.x * len * curvature;
            const cy = midY + norm.y * len * curvature;

            return (
              <g key={i}>
                {/* Glow path */}
                <path
                  d={`M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`}
                  stroke={col.stroke}
                  strokeWidth="6"
                  fill="none"
                  opacity="0.06"
                />
                {/* Main path */}
                <path
                  d={`M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`}
                  stroke={col.stroke}
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="6 3"
                  opacity="0.7"
                  markerEnd={`url(#arrow-${edge.relation})`}
                  className="tree-edge"
                />
                {/* Relation label on edge midpoint */}
                <g transform={`translate(${cx}, ${cy})`}>
                  <rect x="-22" y="-9" width="44" height="18" rx="4"
                    fill="rgba(2,8,17,0.85)" stroke={col.stroke} strokeWidth="0.6" opacity="0.9" />
                  <text
                    x="0" y="5"
                    textAnchor="middle"
                    fill={col.label}
                    fontFamily="'Share Tech Mono', monospace"
                    fontSize="7.5"
                    letterSpacing="0.5"
                  >
                    {edge.relation.toUpperCase()}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              cx={node.x}
              cy={node.y}
              isCenter={node.isCenter}
            />
          ))}
        </svg>
      </div>

      {/* Relation count summary */}
      <div className="family-tree__summary">
        {['father', 'mother', 'sibling', 'child'].map(rel => {
          const count = user.family.filter(f => f.relation === rel).length;
          if (count === 0) return null;
          const col = RELATION_COLORS[rel];
          return (
            <div key={rel} className="relation-chip" style={{ borderColor: col.stroke, color: col.label }}>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                {count} {rel.toUpperCase()}{count > 1 ? 'S' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
