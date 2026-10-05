// Automated Test Suite for Smart Escape
// Verifies Section 4.1 Sample Checks and Edge Cases

class EvacuationRouter {
  static validate(data) {
    if (!data || typeof data !== "object") {
      return { valid: false, error: "Root must be a JSON object" };
    }
    if (typeof data.building !== "string" || data.building.trim().length === 0) {
      return { valid: false, error: "Missing or empty 'building' name" };
    }
    if (!Array.isArray(data.nodes) || data.nodes.length < 2 || data.nodes.length > 60) {
      return { valid: false, error: "nodes must be an array with 2 to 60 elements" };
    }
    if (!Array.isArray(data.edges) || data.edges.length < 1 || data.edges.length > 150) {
      return { valid: false, error: "edges must be an array with 1 to 150 elements" };
    }

    const nodeIds = new Set();
    let hasRoomOrJunction = false;
    let hasExit = false;

    for (const node of data.nodes) {
      if (!node.id || typeof node.id !== "string" || node.id.trim() === "") {
        return { valid: false, error: `Node id is invalid or missing: ${JSON.stringify(node)}` };
      }
      if (nodeIds.has(node.id)) {
        return { valid: false, error: `Duplicate node ID: ${node.id}` };
      }
      nodeIds.add(node.id);

      if (typeof node.label !== "string" || node.label.trim() === "") {
        return { valid: false, error: `Node ${node.id} has invalid or empty label` };
      }
      if (!["room", "junction", "exit"].includes(node.type)) {
        return { valid: false, error: `Node ${node.id} has invalid type '${node.type}'. Must be room, junction, or exit.` };
      }
      if (typeof node.x !== "number" || typeof node.y !== "number" || isNaN(node.x) || isNaN(node.y)) {
        return { valid: false, error: `Node ${node.id} has invalid numeric coordinates (x: ${node.x}, y: ${node.y})` };
      }

      if (node.type === "room" || node.type === "junction") hasRoomOrJunction = true;
      if (node.type === "exit") hasExit = true;
    }

    if (!hasRoomOrJunction) {
      return { valid: false, error: "Graph must contain at least one room or junction" };
    }
    if (!hasExit) {
      return { valid: false, error: "Graph must contain at least one exit" };
    }

    const edgeIds = new Set();
    const nodePairs = new Set();

    for (const edge of data.edges) {
      if (!edge.id || typeof edge.id !== "string" || edge.id.trim() === "") {
        return { valid: false, error: `Edge id is invalid: ${JSON.stringify(edge)}` };
      }
      if (edgeIds.has(edge.id)) {
        return { valid: false, error: `Duplicate edge ID: ${edge.id}` };
      }
      edgeIds.add(edge.id);

      if (!nodeIds.has(edge.from)) {
        return { valid: false, error: `Edge ${edge.id} references non-existent 'from' node: ${edge.from}` };
      }
      if (!nodeIds.has(edge.to)) {
        return { valid: false, error: `Edge ${edge.id} references non-existent 'to' node: ${edge.to}` };
      }
      if (edge.from === edge.to) {
        return { valid: false, error: `Edge ${edge.id} has self-loop from ${edge.from} to ${edge.to}` };
      }

      // Check repeated node pair (undirected)
      const pairKey = edge.from < edge.to ? `${edge.from}___${edge.to}` : `${edge.to}___${edge.from}`;
      if (nodePairs.has(pairKey)) {
        return { valid: false, error: `Repeated edge between nodes ${edge.from} and ${edge.to}` };
      }
      nodePairs.add(pairKey);

      if (!Number.isInteger(edge.cost) || edge.cost <= 0) {
        return { valid: false, error: `Edge ${edge.id} has non-positive integer cost: ${edge.cost}` };
      }
    }

    // initial_state validation
    if (!data.initial_state || typeof data.initial_state !== "object") {
      return { valid: false, error: "initial_state must be an object" };
    }
    const { blocked_nodes = [], blocked_edges = [], closed_exits = [] } = data.initial_state;
    if (!Array.isArray(blocked_nodes) || !Array.isArray(blocked_edges) || !Array.isArray(closed_exits)) {
      return { valid: false, error: "initial_state properties must be arrays" };
    }

    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
    for (const id of blocked_nodes) {
      const node = nodeMap.get(id);
      if (!node) {
        return { valid: false, error: `Blocked node '${id}' does not exist` };
      }
      if (node.type === "exit") {
        return { valid: false, error: `Exit '${id}' cannot be in blocked_nodes; must be in closed_exits` };
      }
    }

    for (const id of closed_exits) {
      const node = nodeMap.get(id);
      if (!node) {
        return { valid: false, error: `Closed exit '${id}' does not exist` };
      }
      if (node.type !== "exit") {
        return { valid: false, error: `Node '${id}' is not an exit and cannot be in closed_exits` };
      }
    }

    for (const id of blocked_edges) {
      if (!edgeIds.has(id)) {
        return { valid: false, error: `Blocked edge '${id}' does not exist` };
      }
    }

    return { valid: true };
  }

  static comparePaths(pathA, pathB) {
    const len = Math.min(pathA.length, pathB.length);
    for (let i = 0; i < len; i++) {
      if (pathA[i] < pathB[i]) return -1;
      if (pathA[i] > pathB[i]) return 1;
    }
    return pathA.length - pathB.length;
  }

  static findLowestCostRoute(data, startNodeId, hazards = {}) {
    const blockedNodes = new Set(hazards.blocked_nodes || []);
    const blockedEdges = new Set(hazards.blocked_edges || []);
    const closedExits = new Set(hazards.closed_exits || []);

    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
    const startNode = nodeMap.get(startNodeId);

    if (!startNode) {
      return { status: "error", message: `Start node ${startNodeId} not found` };
    }

    // Check if start location itself is blocked
    if (blockedNodes.has(startNodeId)) {
      return {
        status: "Starting location blocked",
        code: "START_BLOCKED",
        route: null,
        cost: null,
        exit: null
      };
    }

    // Closed exits cannot even be used as start or intermediate nodes
    if (closedExits.has(startNodeId)) {
      return {
        status: "Starting location blocked",
        code: "START_BLOCKED",
        route: null,
        cost: null,
        exit: null
      };
    }

    // Build adjacency list for available nodes and edges
    // Undirected graph: exclude blocked edges and edges incident to blocked nodes or closed exits
    const adj = new Map();
    for (const node of data.nodes) {
      adj.set(node.id, []);
    }

    for (const edge of data.edges) {
      if (blockedEdges.has(edge.id)) continue;
      // Cannot traverse if either end node is in blockedNodes
      if (blockedNodes.has(edge.from) || blockedNodes.has(edge.to)) continue;
      
      // Closed exits cannot be traversed as intermediate nodes either
      if (closedExits.has(edge.from) || closedExits.has(edge.to)) {
        // If an exit is closed, it cannot be traversed into or out of
        continue;
      }

      adj.get(edge.from).push({ to: edge.to, cost: edge.cost, edgeId: edge.id });
      adj.get(edge.to).push({ to: edge.from, cost: edge.cost, edgeId: edge.id });
    }

    // Open exits
    const openExitIds = data.nodes
      .filter(n => n.type === "exit" && !closedExits.has(n.id))
      .map(n => n.id);

    if (openExitIds.length === 0) {
      return {
        status: "No route available",
        code: "NO_ROUTE",
        route: null,
        cost: null,
        exit: null
      };
    }

    // Dijkstra's Algorithm with lexicographical tie-breaking
    const dist = new Map();
    const bestPath = new Map();

    for (const node of data.nodes) {
      dist.set(node.id, Infinity);
      bestPath.set(node.id, null);
    }

    dist.set(startNodeId, 0);
    bestPath.set(startNodeId, [startNodeId]);

    // Priority queue simulation
    const queue = [{ id: startNodeId, cost: 0, path: [startNodeId] }];

    while (queue.length > 0) {
      // Find min cost item
      let minIdx = 0;
      for (let i = 1; i < queue.length; i++) {
        if (queue[i].cost < queue[minIdx].cost) {
          minIdx = i;
        } else if (queue[i].cost === queue[minIdx].cost) {
          if (this.comparePaths(queue[i].path, queue[minIdx].path) < 0) {
            minIdx = i;
          }
        }
      }

      const current = queue.splice(minIdx, 1)[0];

      // If cost is worse than recorded best cost, skip
      if (current.cost > dist.get(current.id)) continue;
      if (current.cost === dist.get(current.id) && 
          this.comparePaths(current.path, bestPath.get(current.id)) > 0) {
        continue;
      }

      // If current node is an exit, we don't need to traverse further through it
      // as exits are terminal evacuation destinations
      if (nodeMap.get(current.id).type === "exit") {
        continue;
      }

      for (const neighbor of adj.get(current.id)) {
        const nextId = neighbor.to;
        const newCost = current.cost + neighbor.cost;
        const newPath = [...current.path, nextId];

        const oldCost = dist.get(nextId);
        const oldPath = bestPath.get(nextId);

        let isBetter = false;
        if (newCost < oldCost) {
          isBetter = true;
        } else if (newCost === oldCost) {
          if (oldPath === null || this.comparePaths(newPath, oldPath) < 0) {
            isBetter = true;
          }
        }

        if (isBetter) {
          dist.set(nextId, newCost);
          bestPath.set(nextId, newPath);
          queue.push({ id: nextId, cost: newCost, path: newPath });
        }
      }
    }

    // Now evaluate reachable open exits
    const reachableExits = [];
    for (const exitId of openExitIds) {
      const exitCost = dist.get(exitId);
      if (exitCost !== Infinity) {
        reachableExits.push({
          id: exitId,
          cost: exitCost,
          path: bestPath.get(exitId)
        });
      }
    }

    if (reachableExits.length === 0) {
      return {
        status: "No route available",
        code: "NO_ROUTE",
        route: null,
        cost: null,
        exit: null
      };
    }

    // Find minimum cost among reachable exits
    let minCost = Math.min(...reachableExits.map(e => e.cost));
    const tiedExits = reachableExits.filter(e => e.cost === minCost);

    // On equal cost, choose lexicographically smallest exit ID
    tiedExits.sort((a, b) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return this.comparePaths(a.path, b.path);
    });

    const chosen = tiedExits[0];

    return {
      status: "OK",
      code: "SUCCESS",
      route: chosen.path,
      cost: chosen.cost,
      exit: chosen.id,
      formattedResult: `${chosen.path.join(" - ")}; cost ${chosen.cost}`
    };
  }

  // Find up to K alternative routes for bonus extension
  static findAlternativeRoutes(data, startNodeId, hazards = {}, k = 3) {
    const optimal = this.lowestCostRoute = this.findLowestCostRoute(data, startNodeId, hazards);
    if (optimal.code !== "SUCCESS") return [];

    const blockedNodes = new Set(hazards.blocked_nodes || []);
    const blockedEdges = new Set(hazards.blocked_edges || []);
    const closedExits = new Set(hazards.closed_exits || []);
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    const openExitIds = new Set(
      data.nodes.filter(n => n.type === "exit" && !closedExits.has(n.id)).map(n => n.id)
    );

    const adj = new Map();
    for (const node of data.nodes) adj.set(node.id, []);
    for (const edge of data.edges) {
      if (blockedEdges.has(edge.id)) continue;
      if (blockedNodes.has(edge.from) || blockedNodes.has(edge.to)) continue;
      if (closedExits.has(edge.from) || closedExits.has(edge.to)) continue;
      adj.get(edge.from).push({ to: edge.to, cost: edge.cost, id: edge.id });
      adj.get(edge.to).push({ to: edge.from, cost: edge.cost, id: edge.id });
    }

    // Simple path exploration (bounded DFS for alternative routes)
    const allPaths = [];
    const visited = new Set([startNodeId]);

    function dfs(curr, path, cost) {
      if (allPaths.length >= 100) return; // bound exploration
      if (openExitIds.has(curr)) {
        allPaths.push({ path: [...path], cost, exit: curr });
        return;
      }
      for (const edge of adj.get(curr) || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          dfs(edge.to, [...path, edge.to], cost + edge.cost);
          visited.delete(edge.to);
        }
      }
    }

    dfs(startNodeId, [startNodeId], 0);

    // Sort paths by cost, then lexicographical order
    allPaths.sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      if (a.exit !== b.exit) return a.exit < b.exit ? -1 : 1;
      return EvacuationRouter.comparePaths(a.path, b.path);
    });

    // Remove duplicates based on path signature
    const unique = [];
    const seen = new Set();
    for (const p of allPaths) {
      const key = p.path.join("->");
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
      if (unique.length >= k) break;
    }

    return unique;
  }
}

// Verification runner for Section 4.1 Sample Checks
function runContestVerification(buildingData) {
  const results = [];

  // Scenario 1: Baseline: Select R1 -> Expected: R1 - C1 - C2 - E1; cost 7
  const r1 = EvacuationRouter.findLowestCostRoute(buildingData, "R1", {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  });
  const pass1 = r1.code === "SUCCESS" && r1.formattedResult === "R1 - C1 - C2 - E1; cost 7";
  results.push({
    scenario: "Baseline",
    action: "Select R1",
    expected: "R1 - C1 - C2 - E1; cost 7",
    actual: r1.formattedResult || r1.status,
    passed: pass1
  });

  // Scenario 2: Blocked junction: Select R1; block C2 -> Expected: R1 - C1 - C3 - C4 - E2; cost 11
  const r2 = EvacuationRouter.findLowestCostRoute(buildingData, "R1", {
    blocked_nodes: ["C2"],
    blocked_edges: [],
    closed_exits: []
  });
  const pass2 = r2.code === "SUCCESS" && r2.formattedResult === "R1 - C1 - C3 - C4 - E2; cost 11";
  results.push({
    scenario: "Blocked junction",
    action: "Select R1; block C2",
    expected: "R1 - C1 - C3 - C4 - E2; cost 11",
    actual: r2.formattedResult || r2.status,
    passed: pass2
  });

  // Scenario 3: Exits closed: Select R1; close E1 and E2 -> Expected: No route available
  const r3 = EvacuationRouter.findLowestCostRoute(buildingData, "R1", {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: ["E1", "E2"]
  });
  const pass3 = r3.status === "No route available";
  results.push({
    scenario: "Exits closed",
    action: "Select R1; close E1 and E2",
    expected: "No route available",
    actual: r3.status,
    passed: pass3
  });

  // Scenario 4: Different start: Select R2 -> Expected: R2 - C3 - C4 - E2; cost 7
  const r4 = EvacuationRouter.findLowestCostRoute(buildingData, "R2", {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: []
  });
  const pass4 = r4.code === "SUCCESS" && r4.formattedResult === "R2 - C3 - C4 - E2; cost 7";
  results.push({
    scenario: "Different start",
    action: "Select R2",
    expected: "R2 - C3 - C4 - E2; cost 7",
    actual: r4.formattedResult || r4.status,
    passed: pass4
  });

  // Scenario 5: Blocked start: Select R1; then block R1 -> Expected: Starting location blocked
  const r5 = EvacuationRouter.findLowestCostRoute(buildingData, "R1", {
    blocked_nodes: ["R1"],
    blocked_edges: [],
    closed_exits: []
  });
  const pass5 = r5.status === "Starting location blocked";
  results.push({
    scenario: "Blocked start",
    action: "Select R1; then block R1",
    expected: "Starting location blocked",
    actual: r5.status,
    passed: pass5
  });

  return results;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { EvacuationRouter, runContestVerification };
}
