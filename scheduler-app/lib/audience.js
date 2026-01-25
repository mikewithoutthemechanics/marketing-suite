const fs = require('fs');

// Lightweight CSV reader and K-means clustering for audience segmentation.
function parseCSV(path) {
  const src = fs.readFileSync(path, 'utf8');
  const lines = src.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h=>h.trim());
  const rows = lines.slice(1).map(l => l.split(',').map(c=>c.trim()));
  return { headers, rows };
}

function numericize(rows) {
  return rows.map(r => r.map(v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; }));
}

function distance(a,b){ let s=0; for(let i=0;i<a.length;i++){ const d=a[i]-b[i]; s+=d*d;} return Math.sqrt(s); }

function centroid(points) {
  if (!points.length) return [];
  const dim = points[0].length; const c = new Array(dim).fill(0);
  for (const p of points) for (let i=0;i<dim;i++) c[i]+=p[i];
  for(let i=0;i<dim;i++) c[i]/=points.length;
  return c;
}

function kmeans(points, k=3, maxIter=50) {
  if (!points.length) return { centers: [], assignments: [] };
  const dim = points[0].length;
  const centers = [];
  for (let i=0;i<k;i++) centers.push(points[i % points.length].slice());
  let assignments = new Array(points.length).fill(0);
  for (let iter=0; iter<maxIter; iter++) {
    let moved = false;
    for (let i=0;i<points.length;i++) {
      const p = points[i];
      let best = 0; let bestD = distance(p, centers[0]);
      for (let c=1;c<centers.length;c++) { const d = distance(p, centers[c]); if (d<bestD) { bestD=d; best=c; } }
      if (assignments[i] !== best) { assignments[i] = best; moved = true; }
    }
    if (!moved) break;
    for (let c=0;c<k;c++) {
      const pts = points.filter((_,idx)=>assignments[idx]===c);
      centers[c] = pts.length ? centroid(pts) : centers[c];
    }
  }
  return { centers, assignments };
}

async function segmentFromCSV(path, k=3) {
  const { headers, rows } = parseCSV(path);
  const num = numericize(rows);
  const { centers, assignments } = kmeans(num, Math.min(k, Math.max(1, Math.floor(num.length/10) || k)));
  // group rows per assignment
  const groups = {};
  for (let i=0;i<assignments.length;i++) {
    const a = assignments[i]; if (!groups[a]) groups[a]=[];
    groups[a].push({ raw: rows[i], numeric: num[i] });
  }
  return { headers, centers, groups };
}

module.exports = { parseCSV, segmentFromCSV, kmeans };
