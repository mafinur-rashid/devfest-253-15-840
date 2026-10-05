/**
 * Smart Escape - Core Application Controller
 * Handles graph rendering, interactive hazards, Dijkstra routing with tie-breakers,
 * SVG pan/zoom, bilingual updates, walkthrough simulation, and PNG export.
 */

// Embedded default sample dataset to guarantee instant offline execution
// even when opening index.html via file:// protocol
const DEFAULT_DATASET = {
  "building": "East Annex - Practice Building",
  "nodes": [
    { "id": "R1", "label": "Room 101", "type": "room", "x": 60, "y": 65 },
    { "id": "R2", "label": "Room 102", "type": "room", "x": 60, "y": 185 },
    { "id": "C1", "label": "Junction A", "type": "junction", "x": 190, "y": 65 },
    { "id": "C2", "label": "Junction B", "type": "junction", "x": 325, "y": 65 },
    { "id": "C3", "label": "Junction C", "type": "junction", "x": 190, "y": 185 },
    { "id": "C4", "label": "Junction D", "type": "junction", "x": 325, "y": 185 },
    { "id": "E1", "label": "North Exit", "type": "exit", "x": 445, "y": 65 },
    { "id": "E2", "label": "South Exit", "type": "exit", "x": 445, "y": 185 }
  ],
  "edges": [
    { "id": "L01", "from": "R1", "to": "C1", "cost": 2 },
    { "id": "L02", "from": "C1", "to": "C2", "cost": 3 },
    { "id": "L03", "from": "C2", "to": "E1", "cost": 2 },
    { "id": "L04", "from": "R1", "to": "R2", "cost": 4 },
    { "id": "L05", "from": "R2", "to": "C3", "cost": 2 },
    { "id": "L06", "from": "C3", "to": "C4", "cost": 3 },
    { "id": "L07", "from": "C4", "to": "E2", "cost": 2 },
    { "id": "L08", "from": "C1", "to": "C3", "cost": 4 },
    { "id": "L09", "from": "C2", "to": "C4", "cost": 3 }
  ],
  "initial_state": {
    "blocked_nodes": [],
    "blocked_edges": [],
    "closed_exits": []
  }
};

class SmartEscapeApp {
  constructor() {
    this.dataset = JSON.parse(JSON.stringify(DEFAULT_DATASET));
    this.initialState = JSON.parse(JSON.stringify(DEFAULT_DATASET.initial_state));
    
    // Hazards state
    this.hazards = {
      blocked_nodes: new Set(this.initialState.blocked_nodes || []),
      blocked_edges: new Set(this.initialState.blocked_edges || []),
      closed_exits: new Set(this.initialState.closed_exits || [])
    };

    // User selected start node (defaults to R1)
    this.selectedStartNode = "R1";
    this.currentMode = "start"; // 'start' or 'hazard'
    this.latestRouteResult = null;
    this.alternativeRoutes = [];

    // SVG Pan & Zoom State
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Walkthrough simulation timer
    this.walkthroughInterval = null;
    this.walkthroughStepIndex = 0;

    this.initDOM();
    this.attachEventListeners();
    this.loadInitialData();
  }

  initDOM() {
    this.svg = document.getElementById("svgCanvas");
    this.viewportGroup = document.getElementById("viewportGroup");
    this.edgesLayer = document.getElementById("edgesLayer");
    this.routeHighlightLayer = document.getElementById("routeHighlightLayer");
    this.nodesLayer = document.getElementById("nodesLayer");
    this.walkthroughLayer = document.getElementById("walkthroughLayer");

    this.statusBanner = document.getElementById("statusBanner");
    this.statusIcon = document.getElementById("statusIcon");
    this.statusText = document.getElementById("statusText");

    this.startNodeDisplay = document.getElementById("startNodeDisplay");
    this.targetExitDisplay = document.getElementById("targetExitDisplay");
    this.totalCostDisplay = document.getElementById("totalCostDisplay");
    this.routeSequenceDisplay = document.getElementById("routeSequenceDisplay");
    this.buildingNameTag = document.getElementById("buildingNameTag");
    this.altRoutesList = document.getElementById("altRoutesList");

    this.hazardNodesToggleList = document.getElementById("hazardNodesToggleList");
    this.hazardEdgesToggleList = document.getElementById("hazardEdgesToggleList");
    this.hazardExitsToggleList = document.getElementById("hazardExitsToggleList");

    // Modal elements
    this.uploadModal = document.getElementById("uploadModal");
    this.testModal = document.getElementById("testModal");
    this.dropzoneArea = document.getElementById("dropzoneArea");
    this.fileInput = document.getElementById("fileInput");
    this.uploadErrorNotice = document.getElementById("uploadErrorNotice");
  }

  attachEventListeners() {
    // Mode toggles
    const modeStartBtn = document.getElementById("modeSelectStart");
    const modeHazardBtn = document.getElementById("modeToggleHazard");
    
    modeStartBtn.addEventListener("click", () => {
      this.currentMode = "start";
      modeStartBtn.classList.add("active");
      modeHazardBtn.classList.remove("active");
    });

    modeHazardBtn.addEventListener("click", () => {
      this.currentMode = "hazard";
      modeHazardBtn.classList.add("active");
      modeStartBtn.classList.remove("active");
    });

    // Reset Hazards button
    document.getElementById("btnResetHazards").addEventListener("click", () => {
      this.resetToInitialState();
    });

    // Language Toggle Button
    document.getElementById("langToggleBtn").addEventListener("click", () => {
      const nextLang = currentLang === "en" ? "bn" : "en";
      setLanguage(nextLang);
    });

    // High Contrast Button
    document.getElementById("btnHighContrast").addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
    });

    // Export PNG
    document.getElementById("btnExportPng").addEventListener("click", () => {
      this.exportMapToPNG();
    });

    // Walkthrough button
    document.getElementById("btnWalkthrough").addEventListener("click", () => {
      this.toggleWalkthrough();
    });

    // Zoom Buttons
    document.getElementById("btnZoomIn").addEventListener("click", () => this.applyZoom(1.2));
    document.getElementById("btnZoomOut").addEventListener("click", () => this.applyZoom(0.8));
    document.getElementById("btnZoomFit").addEventListener("click", () => this.fitViewToContent());

    // SVG Pan & Zoom (Mouse drag & Wheel)
    this.svg.addEventListener("mousedown", (e) => {
      if (e.target.closest(".graph-node") || e.target.closest(".edge-badge") || e.target.closest(".edge-line")) {
        return; // Node/edge click handled separately
      }
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      this.svg.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      this.updateViewportTransform();
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
      this.svg.style.cursor = "grab";
    });

    this.svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.applyZoom(zoomFactor, e.clientX, e.clientY);
    }, { passive: false });

    // Modals
    document.getElementById("btnUploadModal").addEventListener("click", () => {
      this.uploadModal.classList.add("active");
      this.uploadErrorNotice.style.display = "none";
    });

    document.getElementById("btnCloseUploadModal").addEventListener("click", () => {
      this.uploadModal.classList.remove("active");
    });

    document.getElementById("btnLoadDefaultSample").addEventListener("click", () => {
      this.loadDataset(DEFAULT_DATASET);
      this.uploadModal.classList.remove("active");
    });

    document.getElementById("btnTestModal").addEventListener("click", () => {
      this.openTestModal();
    });

    document.getElementById("btnCloseTestModal").addEventListener("click", () => {
      this.testModal.classList.remove("active");
    });

    document.getElementById("btnRerunTests").addEventListener("click", () => {
      this.renderTestResults();
    });

    // File Drag & Drop
    this.dropzoneArea.addEventListener("click", () => this.fileInput.click());
    this.dropzoneArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.dropzoneArea.classList.add("dragover");
    });
    this.dropzoneArea.addEventListener("dragleave", () => {
      this.dropzoneArea.classList.remove("dragover");
    });
    this.dropzoneArea.addEventListener("drop", (e) => {
      e.preventDefault();
      this.dropzoneArea.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    this.fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });
  }

  loadInitialData() {
    // Try to fetch building.json if on a web server, otherwise use default
    fetch("building.json")
      .then(res => res.json())
      .then(json => {
        const val = EvacuationRouter.validate(json);
        if (val.valid) {
          this.loadDataset(json);
        } else {
          this.loadDataset(DEFAULT_DATASET);
        }
      })
      .catch(() => {
        // Fallback for file:// or offline
        this.loadDataset(DEFAULT_DATASET);
      });
  }

  loadDataset(data) {
    const validation = EvacuationRouter.validate(data);
    if (!validation.valid) {
      this.showUploadError(validation.error);
      return false;
    }

    this.dataset = JSON.parse(JSON.stringify(data));
    this.initialState = JSON.parse(JSON.stringify(data.initial_state || {}));
    this.buildingNameTag.textContent = this.dataset.building;

    // Reset hazards to initial state
    this.hazards = {
      blocked_nodes: new Set(this.initialState.blocked_nodes || []),
      blocked_edges: new Set(this.initialState.blocked_edges || []),
      closed_exits: new Set(this.initialState.closed_exits || [])
    };

    // Pick first available room or junction as default start
    const firstRoom = this.dataset.nodes.find(n => n.type === "room" || n.type === "junction");
    this.selectedStartNode = firstRoom ? firstRoom.id : this.dataset.nodes[0].id;

    // Check URL parameters for quick scenario loading (e.g. ?start=R1&block=C2&lang=bn)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("lang")) {
      setLanguage(urlParams.get("lang"));
    }
    if (urlParams.has("start")) {
      this.selectedStartNode = urlParams.get("start");
    }
    if (urlParams.has("block")) {
      const toBlock = urlParams.get("block").split(",");
      toBlock.forEach(id => {
        if (this.dataset.nodes.some(n => n.id === id && n.type === "exit")) {
          this.hazards.closed_exits.add(id);
        } else if (this.dataset.nodes.some(n => n.id === id)) {
          this.hazards.blocked_nodes.add(id);
        } else if (this.dataset.edges.some(e => e.id === id)) {
          this.hazards.blocked_edges.add(id);
        }
      });
    }

    this.stopWalkthrough();
    this.renderGraph();
    this.renderHazardToggles();
    this.fitViewToContent();
    this.calculateAndRenderRoute();
    this.renderTestResults();

    if (urlParams.get("view") === "tests") {
      this.openTestModal();
    }
    return true;
  }

  handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (this.loadDataset(parsed)) {
          this.uploadModal.classList.remove("active");
        }
      } catch (err) {
        this.showUploadError("Malformed JSON file: " + err.message);
      }
    };
    reader.onerror = () => {
      this.showUploadError("Error reading uploaded file.");
    };
    reader.readAsText(file);
  }

  showUploadError(msg) {
    this.uploadErrorNotice.textContent = t("jsonInvalid") + msg;
    this.uploadErrorNotice.style.display = "block";
  }

  resetToInitialState() {
    this.hazards = {
      blocked_nodes: new Set(this.initialState.blocked_nodes || []),
      blocked_edges: new Set(this.initialState.blocked_edges || []),
      closed_exits: new Set(this.initialState.closed_exits || [])
    };
    this.stopWalkthrough();
    this.updateGraphVisualStates();
    this.renderHazardToggles();
    this.calculateAndRenderRoute();
  }

  // Visual graph rendering in SVG
  renderGraph() {
    this.edgesLayer.innerHTML = "";
    this.nodesLayer.innerHTML = "";
    this.routeHighlightLayer.innerHTML = "";

    const nodeMap = new Map(this.dataset.nodes.map(n => [n.id, n]));

    // 1. Render Edges (Corridors)
    for (const edge of this.dataset.edges) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) continue;

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "edge-group");
      g.setAttribute("data-edge-id", edge.id);

      // Line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);
      line.setAttribute("class", "edge-line");
      line.setAttribute("id", `edge-line-${edge.id}`);

      // Corridor click toggles hazard
      line.addEventListener("click", () => this.toggleEdgeHazard(edge.id));

      // Edge Cost Badge Pill at midpoint
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;

      const badge = document.createElementNS("http://www.w3.org/2000/svg", "g");
      badge.setAttribute("class", "edge-badge");
      badge.setAttribute("id", `edge-badge-${edge.id}`);
      badge.setAttribute("transform", `translate(${midX}, ${midY})`);

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", "-14");
      rect.setAttribute("y", "-10");
      rect.setAttribute("width", "28");
      rect.setAttribute("height", "20");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = edge.cost;

      badge.appendChild(rect);
      badge.appendChild(text);
      badge.addEventListener("click", () => this.toggleEdgeHazard(edge.id));

      g.appendChild(line);
      g.appendChild(badge);
      this.edgesLayer.appendChild(g);
    }

    // 2. Render Nodes
    for (const node of this.dataset.nodes) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `graph-node node-${node.type}`);
      g.setAttribute("id", `node-elem-${node.id}`);
      g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

      if (node.type === "room") {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "-32");
        rect.setAttribute("y", "-22");
        rect.setAttribute("width", "64");
        rect.setAttribute("height", "44");
        g.appendChild(rect);
      } else if (node.type === "junction") {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "24");
        g.appendChild(circle);
      } else if (node.type === "exit") {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "-32");
        rect.setAttribute("y", "-22");
        rect.setAttribute("width", "64");
        rect.setAttribute("height", "44");
        g.appendChild(rect);
      }

      // Main ID text
      const idText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      idText.setAttribute("class", "node-label");
      idText.setAttribute("y", node.type === "junction" ? "-2" : "-5");
      idText.textContent = node.id;
      g.appendChild(idText);

      // Label text
      const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelText.setAttribute("class", "node-sublabel");
      labelText.setAttribute("y", node.type === "junction" ? "10" : "10");
      labelText.textContent = node.label.length > 10 ? node.label.substring(0, 9) + "…" : node.label;
      g.appendChild(labelText);

      // Node Click behavior based on current mode
      g.addEventListener("click", () => this.handleNodeClick(node));

      this.nodesLayer.appendChild(g);
    }

    this.updateGraphVisualStates();
  }

  handleNodeClick(node) {
    if (this.currentMode === "hazard") {
      // Toggle hazard directly
      if (node.type === "exit") {
        this.toggleExitHazard(node.id);
      } else {
        this.toggleNodeHazard(node.id);
      }
    } else {
      // Start Select Mode:
      if (node.type === "exit") {
        // Exits cannot be starting locations; clicking an exit toggles its open/closed state
        this.toggleExitHazard(node.id);
      } else {
        // Set as Start Node
        this.selectedStartNode = node.id;
        this.calculateAndRenderRoute();
      }
    }
  }

  toggleNodeHazard(nodeId) {
    if (this.hazards.blocked_nodes.has(nodeId)) {
      this.hazards.blocked_nodes.delete(nodeId);
    } else {
      this.hazards.blocked_nodes.add(nodeId);
    }
    this.onHazardsChanged();
  }

  toggleExitHazard(exitId) {
    if (this.hazards.closed_exits.has(exitId)) {
      this.hazards.closed_exits.delete(exitId);
    } else {
      this.hazards.closed_exits.add(exitId);
    }
    this.onHazardsChanged();
  }

  toggleEdgeHazard(edgeId) {
    if (this.hazards.blocked_edges.has(edgeId)) {
      this.hazards.blocked_edges.delete(edgeId);
    } else {
      this.hazards.blocked_edges.add(edgeId);
    }
    this.onHazardsChanged();
  }

  onHazardsChanged() {
    this.stopWalkthrough();
    this.updateGraphVisualStates();
    this.renderHazardToggles();
    this.calculateAndRenderRoute();
  }

  updateGraphVisualStates() {
    // 1. Nodes state
    for (const node of this.dataset.nodes) {
      const el = document.getElementById(`node-elem-${node.id}`);
      if (!el) continue;

      const isBlocked = this.hazards.blocked_nodes.has(node.id);
      const isClosed = this.hazards.closed_exits.has(node.id);
      const isStart = this.selectedStartNode === node.id;
      const isTarget = this.latestRouteResult && this.latestRouteResult.exit === node.id;

      el.classList.toggle("is-blocked", isBlocked || isClosed);
      el.classList.toggle("is-start", isStart);
      el.classList.toggle("is-target", isTarget);
    }

    // 2. Edges state
    for (const edge of this.dataset.edges) {
      const line = document.getElementById(`edge-line-${edge.id}`);
      const badge = document.getElementById(`edge-badge-${edge.id}`);
      if (!line) continue;

      const isBlocked = this.hazards.blocked_edges.has(edge.id) ||
                        this.hazards.blocked_nodes.has(edge.from) ||
                        this.hazards.blocked_nodes.has(edge.to) ||
                        this.hazards.closed_exits.has(edge.from) ||
                        this.hazards.closed_exits.has(edge.to);

      line.classList.toggle("blocked-edge", isBlocked);
      if (badge) badge.classList.toggle("blocked", isBlocked);
    }
  }

  calculateAndRenderRoute() {
    if (!this.selectedStartNode) {
      this.showStatusBanner("info", t("selectStartPrompt"));
      this.clearRouteHighlight();
      return;
    }

    const hazardsPayload = {
      blocked_nodes: Array.from(this.hazards.blocked_nodes),
      blocked_edges: Array.from(this.hazards.blocked_edges),
      closed_exits: Array.from(this.hazards.closed_exits)
    };

    const result = EvacuationRouter.findLowestCostRoute(this.dataset, this.selectedStartNode, hazardsPayload);
    this.latestRouteResult = result;

    this.startNodeDisplay.textContent = this.selectedStartNode;

    if (result.code === "START_BLOCKED") {
      this.showStatusBanner("danger", t("startingLocationBlocked"));
      this.targetExitDisplay.textContent = "—";
      this.totalCostDisplay.textContent = "—";
      this.routeSequenceDisplay.innerHTML = `<span style="color: var(--accent-red); font-weight:600;">${t("startingLocationBlocked")}</span>`;
      this.clearRouteHighlight();
      this.updateGraphVisualStates();
      this.renderAlternativeRoutes([]);
      return;
    }

    if (result.code === "NO_ROUTE") {
      this.showStatusBanner("danger", t("noRouteAvailable"));
      this.targetExitDisplay.textContent = "—";
      this.totalCostDisplay.textContent = "—";
      this.routeSequenceDisplay.innerHTML = `<span style="color: var(--accent-red); font-weight:600;">${t("noRouteAvailable")}</span>`;
      this.clearRouteHighlight();
      this.updateGraphVisualStates();
      this.renderAlternativeRoutes([]);
      return;
    }

    // Success: Route found
    this.showStatusBanner("success", `${t("routeFound")} (${result.exit})`);
    this.targetExitDisplay.textContent = result.exit;
    this.totalCostDisplay.textContent = result.cost;

    // Render sequence pills
    this.renderRouteSequencePills(result.route);

    // Highlight route in SVG
    this.highlightRouteOnMap(result.route);
    this.updateGraphVisualStates();

    // Fetch alternative routes for bonus extension
    const altRoutes = EvacuationRouter.findAlternativeRoutes(this.dataset, this.selectedStartNode, hazardsPayload, 3);
    this.renderAlternativeRoutes(altRoutes);
  }

  renderRouteSequencePills(path) {
    const nodeMap = new Map(this.dataset.nodes.map(n => [n.id, n]));
    this.routeSequenceDisplay.innerHTML = "";

    path.forEach((nodeId, idx) => {
      const node = nodeMap.get(nodeId);
      const pill = document.createElement("span");
      pill.className = `node-pill ${node ? node.type : "junction"}`;
      pill.textContent = nodeId;

      this.routeSequenceDisplay.appendChild(pill);

      if (idx < path.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "arrow-separator";
        arrow.textContent = "→";
        this.routeSequenceDisplay.appendChild(arrow);
      }
    });
  }

  highlightRouteOnMap(path) {
    this.clearRouteHighlight();
    if (!path || path.length < 2) return;

    const pathEdges = new Set();
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const edge = this.dataset.edges.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
      if (edge) {
        pathEdges.add(edge.id);
        const line = document.getElementById(`edge-line-${edge.id}`);
        const badge = document.getElementById(`edge-badge-${edge.id}`);
        if (line) line.classList.add("active-route");
        if (badge) badge.classList.add("active-route");
      }
    }
  }

  clearRouteHighlight() {
    this.svg.querySelectorAll(".edge-line.active-route").forEach(el => el.classList.remove("active-route"));
    this.svg.querySelectorAll(".edge-badge.active-route").forEach(el => el.classList.remove("active-route"));
  }

  renderAlternativeRoutes(routes) {
    this.altRoutesList.innerHTML = "";
    // Filter out the primary optimal route
    const alts = routes.filter((r, idx) => idx > 0);

    if (alts.length === 0) {
      this.altRoutesList.innerHTML = `<span style="font-size: 0.78rem; color: var(--text-muted);">${t("noAltRoutes")}</span>`;
      return;
    }

    alts.forEach((alt, idx) => {
      const item = document.createElement("div");
      item.className = "alt-route-item";
      item.innerHTML = `
        <div>
          <strong>Alt #${idx + 1} &bull; ${alt.exit}</strong>: 
          <span style="font-family: monospace;">${alt.path.join(" → ")}</span>
        </div>
        <div style="font-weight: 700; color: var(--accent-amber);">${t("costLabel")}: ${alt.cost}</div>
      `;
      // Preview on hover
      item.addEventListener("mouseenter", () => this.highlightRouteOnMap(alt.path));
      item.addEventListener("mouseleave", () => {
        if (this.latestRouteResult && this.latestRouteResult.route) {
          this.highlightRouteOnMap(this.latestRouteResult.route);
        }
      });
      this.altRoutesList.appendChild(item);
    });
  }

  showStatusBanner(type, message) {
    this.statusBanner.className = `status-banner ${type}`;
    if (type === "success") {
      this.statusIcon.textContent = "✓";
    } else if (type === "danger") {
      this.statusIcon.textContent = "⚠";
    } else {
      this.statusIcon.textContent = "ℹ";
    }
    this.statusText.textContent = message;
  }

  renderHazardToggles() {
    this.hazardNodesToggleList.innerHTML = "";
    this.hazardEdgesToggleList.innerHTML = "";
    this.hazardExitsToggleList.innerHTML = "";

    // Nodes (rooms & junctions)
    const nonExits = this.dataset.nodes.filter(n => n.type !== "exit");
    nonExits.forEach(node => {
      const btn = document.createElement("button");
      const isBlocked = this.hazards.blocked_nodes.has(node.id);
      btn.className = `hazard-btn ${isBlocked ? "is-blocked" : ""}`;
      btn.textContent = `${node.id} (${node.label})`;
      btn.addEventListener("click", () => this.toggleNodeHazard(node.id));
      this.hazardNodesToggleList.appendChild(btn);
    });

    // Edges
    this.dataset.edges.forEach(edge => {
      const btn = document.createElement("button");
      const isBlocked = this.hazards.blocked_edges.has(edge.id);
      btn.className = `hazard-btn ${isBlocked ? "is-blocked" : ""}`;
      btn.textContent = `${edge.id} (${edge.from}-${edge.to})`;
      btn.addEventListener("click", () => this.toggleEdgeHazard(edge.id));
      this.hazardEdgesToggleList.appendChild(btn);
    });

    // Exits
    const exits = this.dataset.nodes.filter(n => n.type === "exit");
    exits.forEach(exit => {
      const btn = document.createElement("button");
      const isClosed = this.hazards.closed_exits.has(exit.id);
      btn.className = `hazard-btn ${isClosed ? "is-blocked" : ""}`;
      btn.textContent = `${exit.id} (${exit.label})`;
      btn.addEventListener("click", () => this.toggleExitHazard(exit.id));
      this.hazardExitsToggleList.appendChild(btn);
    });
  }

  // Walkthrough Simulator (Bonus Extension 4.2)
  toggleWalkthrough() {
    if (this.walkthroughInterval) {
      this.stopWalkthrough();
    } else {
      this.startWalkthrough();
    }
  }

  startWalkthrough() {
    if (!this.latestRouteResult || this.latestRouteResult.code !== "SUCCESS") return;
    const path = this.latestRouteResult.route;
    if (!path || path.length < 2) return;

    this.walkthroughStepIndex = 0;
    const btn = document.getElementById("btnWalkthrough");
    btn.textContent = t("navWalkthroughStop");
    btn.classList.add("btn-danger");
    btn.classList.remove("btn-primary");

    const nodeMap = new Map(this.dataset.nodes.map(n => [n.id, n]));

    this.walkthroughLayer.innerHTML = "";
    const avatar = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    avatar.setAttribute("r", "10");
    avatar.setAttribute("fill", "#ffff00");
    avatar.setAttribute("stroke", "#ffffff");
    avatar.setAttribute("stroke-width", "2");
    avatar.setAttribute("id", "walkthroughAvatar");
    this.walkthroughLayer.appendChild(avatar);

    const updateStep = () => {
      if (this.walkthroughStepIndex >= path.length) {
        this.stopWalkthrough();
        return;
      }
      const currNodeId = path[this.walkthroughStepIndex];
      const node = nodeMap.get(currNodeId);
      if (node) {
        avatar.setAttribute("cx", node.x);
        avatar.setAttribute("cy", node.y);
      }
      this.walkthroughStepIndex++;
    };

    updateStep();
    this.walkthroughInterval = setInterval(updateStep, 700);
  }

  stopWalkthrough() {
    if (this.walkthroughInterval) {
      clearInterval(this.walkthroughInterval);
      this.walkthroughInterval = null;
    }
    this.walkthroughLayer.innerHTML = "";
    const btn = document.getElementById("btnWalkthrough");
    if (btn) {
      btn.textContent = t("navWalkthrough");
      btn.classList.remove("btn-danger");
      btn.classList.add("btn-primary");
    }
  }

  // Fit View / Pan & Zoom
  fitViewToContent() {
    if (!this.dataset.nodes || this.dataset.nodes.length === 0) return;
    const xs = this.dataset.nodes.map(n => n.x);
    const ys = this.dataset.nodes.map(n => n.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const contentWidth = maxX - minX + 160;
    const contentHeight = maxY - minY + 160;

    const svgRect = this.svg.getBoundingClientRect();
    const scaleX = svgRect.width / contentWidth;
    const scaleY = svgRect.height / contentHeight;

    this.zoom = Math.min(scaleX, scaleY, 1.8);
    this.panX = (svgRect.width - (maxX + minX) * this.zoom) / 2;
    this.panY = (svgRect.height - (maxY + minY) * this.zoom) / 2;

    this.updateViewportTransform();
  }

  applyZoom(factor, clientX, clientY) {
    const newZoom = Math.max(0.3, Math.min(3.5, this.zoom * factor));
    if (clientX !== undefined && clientY !== undefined) {
      const svgRect = this.svg.getBoundingClientRect();
      const mouseX = clientX - svgRect.left;
      const mouseY = clientY - svgRect.top;
      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
    }
    this.zoom = newZoom;
    this.updateViewportTransform();
  }

  updateViewportTransform() {
    this.viewportGroup.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`
    );
  }

  // PNG Export
  exportMapToPNG() {
    const svgRect = this.svg.getBoundingClientRect();
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(this.svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgRect.width * 2; // High-DPI export
      canvas.height = svgRect.height * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.download = `smart-escape-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }

  // Official Contest Test Suite Modal
  openTestModal() {
    this.renderTestResults();
    this.testModal.classList.add("active");
  }

  renderTestResults() {
    const results = runContestVerification(this.dataset);
    const tbody = document.getElementById("testResultsBody");
    tbody.innerHTML = "";

    results.forEach(res => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${res.scenario}</strong></td>
        <td><code>${res.action}</code></td>
        <td><code>${res.expected}</code></td>
        <td><code>${res.actual}</code></td>
        <td>
          <span class="${res.passed ? "badge-pass" : "badge-fail"}">
            ${res.passed ? t("testPassed") : t("testFailed")}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  refreshUI() {
    this.calculateAndRenderRoute();
  }
}

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.app = new SmartEscapeApp();
});
