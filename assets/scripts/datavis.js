// Modified under ISC from https://observablehq.com/@d3/tree

import * as d3 from "https://cdn.skypack.dev/d3@7";

export function createTree(data) {
  const getLabel = (d, n) => d?.label || d?.title || n.id.split('/').pop().replace(/-/g, ' ').replace(/./, c => c.toUpperCase());

  const getLink = (d, n) => d?.url;

  //const root = d3.hierarchy(data, children);
  const root = d3.stratify().path(d => d.url)(data);

  // Sort the nodes.
  //sort, // how to sort nodes prior to layout (e.g., (a, b) => d3.descending(a.height, b.height))
  //if (sort != null) root.sort(sort);

  // Compute the layout.
  // TODO: compute width based on sum of max title char length of each level
  const dx = 30;
  const dy = 300;
  d3.tree().nodeSize([dx, dy])(root);

  // Center the tree.
  let minY = Infinity;
  let maxY = -minY;
  let minX = Infinity;
  let maxX = -minY;
  root.each(d => {
    if (d.x > maxY) maxY = d.x;
    if (d.x < minY) minY = d.x;
    if (d.y > maxX) maxX = d.y;
    if (d.y < minX) minX = d.y;
  });

  // Compute the default dims
  const width = maxX - minX;
  const height = maxY - minY;

  const svg = d3.create("svg")
    .attr("viewBox", [minX - dy, minY - dx, width + 2 * dy, height + 2 * dx])
    .attr("width", width + 2 * dy)
    .attr("height", height + 2 * dx)
    .style("height", "100%")
    .style("width", "auto")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .style("margin", "2rem 1rem");

  svg.append("g")
    .attr("fill", "none")
    .attr("stroke", 'var(--text-main)')
    .attr("stroke-opacity", 0.4)
    //.attr("stroke-linecap", strokeLinecap)
    //.attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  const node = svg.append("g")
    .selectAll("a")
    .data(root.descendants())
    .join("a")
    .attr("xlink:href", d => getLink(d.data, d))
    .attr("target", "_blank")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("fill", d => d.data ? 'var(--links)' : 'var(--text-main)')
    //.attr("opacity", d => d.data ? 1 : 0);
    .attr("r", 3)

  //if (title != null) node.append("title")
  //    .text(d => title(d.data, d));

  // Compute labels and titles.
  const descendants = root.descendants();
  const L = descendants.map(d => getLabel(d.data, d));

  node.append("text")
    .attr("dy", "0.32em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .attr("paint-order", "stroke")
    .attr("fill", d => d.data ? 'var(--links)' : 'var(--text-main)')
    .attr("stroke", "var(--background-body)")
    .attr("stroke-width", "8px")
    .style("font-size", "1rem")
    .text((d, i) => L[i]);

  return svg.node();
}

export function createCircles(data) {
  const getLabel = (d, n) => {
    return d?.data?.label || d?.data?.title || d.id.split('/').pop().replace(/-/g, ' ').replace(/./, c => c.toUpperCase());
  };
  const getLink = (d, n) => {

    return d?.data?.url;
  };

  //const root = d3.hierarchy(data, children);
  let root = d3.stratify().path(d => d.url)(data);
  root = d3.hierarchy(root, d => d.children);

  // Sort the nodes.
  //sort, // how to sort nodes prior to layout (e.g., (a, b) => d3.descending(a.height, b.height))
  //if (sort != null) root.sort(sort);

  // Modified under ISC from https://observablehq.com/@d3/pack
  const id = Array.isArray(data) ? d => d.id : null; // if tabular data, given a d in data, returns a unique identifier (string)
  const parentId = Array.isArray(data) ? d => d.parentId : null; // if tabular data, given a node d, returns its parent’s identifier
  //const value = d => d.size; // given a node d, returns a quantitative value (for area encoding; null for count)
  const sort = (a, b) => d3.descending(a.value, b.value); // how to sort nodes prior to layout
  const stroke = 'var(--text-main)'; // stroke for internal circles
  const strokeWidth = 100; // stroke width for internal circles
  const strokeOpacity = 1; // stroke opacity for internal circles

  // Compute the values of internal nodes by aggregating from the leaves.
  //{# value == null ? root.count() : root.sum(d => Math.max(0, value(d))); #}
  //root.count();
  root.sum(d => {
    return Math.max(0, 0.01 * (d.data?.characterCount || 1))
  });

  //root.each(d => {
  //  d.opacity = 0.5;
  //  //console.log(d, d.data.id);
  //});

  // Compute labels and titles.
  const descendants = root.descendants().reverse();
  const leaves = descendants.filter(d => !d.children);
  const parents = descendants.filter(d => d.children);
  leaves.forEach((d, i) => d.index = i);
  const L = leaves.map(d => getLabel(d.data, d));
  const T = descendants.map(d => getLabel(d.data, d));

  // Sort the leaves (typically by descending value for a pleasing layout).
  if (sort != null) root.sort(sort);

  // Compute the layout.
  // TODO: compute width based on sum of max title char length of each level

  const width = 1000;//root.r * 2 + 100;
  const height = 1000;//root.r * 2 + 100;

  const scale = 100;

  d3.pack()
    .size([width * scale, height * scale])
    .padding(d => d.r * scale)
    (root);

  const zoom = d3.zoom()
    .on('zoom', (e) => {
      //console.log(e.transform.k);
      descendants.forEach(d => {
        //console.log(d.r * e.transform.k);
        if (d.r * e.transform.k > 0.5 * scale * 1000) {
          d.opacity = 0;
        } else
          d.opacity = 1;
      });

      const t = d3.transition()
        .duration(100)
        .ease(d3.easeLinear);

      cover.transition(t).attr("opacity", d => d.children ? d.opacity : 1)
      cover.attr("pointer-events", d => !d.children || d.opacity ? "all" : "none")

      g.attr('transform', e.transform);
    });

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width * scale, height * scale])
    .attr("width", width)
    .attr("height", height)
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .style("width", "100%")
    .style("height", "68vh")
    .call(zoom);

  const g = svg.append("g");

  const node = g.selectAll("g")
    .data(descendants)
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);


  const cover = node
    .append('g')
    .attr("opacity", 1);

  cover
    .append("circle")
    .attr("fill", d => d.children ? 'var(--background-body)' : 'var(--background)')
    .attr("fill-opacity", d => d.children ? 0.9 : 1)
    .attr("r", d => d.r);

  cover
    .append("a")
    .attr("xlink:href", d => getLink(d.data, d))
    .attr("target", '_blank')
    .style("text-decoration", "none")
    .append("text")
    .attr("dy", d => "0.32em")
    .attr("text-anchor", "middle")
    .attr("paint-order", "stroke")
    .attr("fill", d => d.data?.data?.url ? 'var(--links)' : 'var(--text-main)')
    .attr("font-size", (d, i) => ((scale / 50) * d.r / T[i].length) + 'px')
    .attr("cursor", d => d.data?.data?.url ? "inherit" : "default")
    .text((d, i) => T[i]);

  // permanent border
  node.append("circle")
    .attr("stroke", d => d.children ? stroke : null)
    .attr("stroke-width", d => d.children ? strokeWidth : null)
    .attr("stroke-opacity", d => d.children ? strokeOpacity : null)
    .attr("fill", "transparent")
    .attr("pointer-events", "none")
    .attr("r", d => d.r);

  return svg.node();
}