import React from 'react';

const _cache = {}; // name -> svg markup string (module-level, shared across instances)
const _listeners = {}; // name -> Set of setState callbacks waiting on a pending fetch

function loadIcon(name, onReady) {
  if (_cache[name]) { onReady(_cache[name]); return; }
  if (!_listeners[name]) {
    _listeners[name] = new Set();
    fetch(`https://unpkg.com/lucide-static@0.469.0/icons/${name}.svg`)
      .then(r => r.text())
      .then(svg => {
        svg = svg.replace('width="24"', 'width="100%"').replace('height="24"', 'height="100%"');
        _cache[name] = svg;
        _listeners[name].forEach(fn => fn(svg));
        _listeners[name] = null;
      })
      .catch(() => {});
  }
  if (_listeners[name]) _listeners[name].add(onReady);
}

/**
 * Icon — thin wrapper around the Lucide icon set (CDN-hosted `lucide-static`).
 * No SVG markup is committed to this design system; icons are fetched by name
 * at runtime and inlined, so Lucide's built-in `stroke="currentColor"` picks
 * up the wrapper's `color` — same mental model as a webfont glyph.
 */
export function Icon({ name, size = 18, color = 'currentColor', style, ...rest }) {
  const [svg, setSvg] = React.useState(_cache[name] || null);
  React.useEffect(() => {
    let alive = true;
    loadIcon(name, s => { if (alive) setSvg(s); });
    return () => { alive = false; };
  }, [name]);

  return (
    <span
      role="img"
      aria-label={name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        flexShrink: 0,
        lineHeight: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      {...rest}
    />
  );
}
