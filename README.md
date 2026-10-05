# Smart Escape - Interactive Evacuation Route Simulator
**AI DevFest 2026 | Solo Vibe-Coding Contest**

An interactive, browser-based emergency evacuation simulator that models buildings as undirected weighted graphs, visualizes corridors and room layouts, handles dynamic hazards (blocked rooms, blocked corridors, closed exits), and calculates the lowest-cost evacuation path to safety in real time using an exact tie-breaking Dijkstra algorithm.

---

## 1. Participant Identity & Submission Metadata
- **Participant Name:** Mafinur Rashid
- **Registration Number:** 253-15-840
- **Repository Name:** `devfest-[registration-number]`
- **Public Live Website Link:** [https://your-username.github.io/devfest-[registration-number]/](https://your-username.github.io/devfest-[registration-number]/) *(Deployable to GitHub Pages, Vercel, Netlify, or Cloudflare Pages)*
- **Contest Date:** 6 October 2026
- **License:** MIT License (`LICENSE`)

---

## 2. How to Run the App

### Option A: Direct Browser Execution (Zero Setup / Offline)
The application is built with vanilla HTML5, CSS3, and modern ES6+ JavaScript with zero build steps or package manager dependencies.
1. Simply double-click `index.html` or open it in any modern browser (e.g., Google Chrome):
   ```
   file:///path/to/smart-escape/index.html
   ```
2. The bundled `building.json` dataset loads automatically.

### Option B: Local Web Server
You can also serve the directory using any lightweight HTTP server:
```bash
# Using Python
python -m http.server 8000

# Using Node / npx
npx serve .

# Using PHP
php -S localhost:8000
```
Then navigate to `http://localhost:8000` in Google Chrome.

### Option C: Instant Deployment to GitHub Pages / Vercel / Netlify
1. **GitHub Pages**:
   - Push repository to GitHub.
   - Go to **Settings > Pages > Branch: `main` / `root` > Save**.
   - Your app is instantly live on HTTPS!
2. **Vercel / Netlify**:
   - Drag and drop the folder into Netlify Drop, or connect the GitHub repository to Vercel (Preset: `Other` / static).

---

## 3. Main Features Implemented (Mandatory Tasks)

### 3.1 Input Import and Strict Validation
- **Custom JSON Importer**: Drag-and-drop or select any unseen building JSON file.
- **Strict Schema Validation**:
  - Enforces 2–60 nodes, 1–150 undirected edges.
  - Requires at least one room/junction and at least one exit.
  - Validates positive integer edge costs.
  - Detects and rejects self-loops (`from === to`) and repeated node pairs (`A-B` duplicate).
  - Validates `initial_state` references and ensures category integrity (blocked nodes are rooms/junctions; closed exits are exits).
  - Displays user-friendly, descriptive error notices in both English and Bangla.

### 3.2 Interactive Map Display
- **SVG Canvas Engine**: Responsive coordinate mapping at exact `(x, y)` locations.
- **Distinct Visual Nodes**:
  - **Room**: Blue rounded rectangle card with room ID and readable label.
  - **Junction**: Purple circular hub with junction ID and label.
  - **Exit**: Emerald shield card with exit ID and label.
  - **Start Node**: Pulsating magenta halo ring with distinct highlight.
  - **Destination Exit**: Glowing emerald target boundary.
- **Visible Corridor Costs**: Pill badges centered on every edge showing cost weights.
- **Pan & Zoom Controls**: Mouse drag-to-pan, mouse wheel zoom, plus on-screen Zoom In (`+`), Zoom Out (`-`), and Fit to Screen (`⛶`) buttons.

### 3.3 Dynamic Routing Algorithm & Exact Tie-Breaking
- **Dijkstra Shortest Path Search**: Calculates route cost as the exact sum of edge weights. Coordinates and hop counts are never used as a proxy.
- **Tie-Breaking Protocol (Section 3.3 Compliant)**:
  1. Primary: Minimum total edge cost to an open exit.
  2. Secondary: If multiple exits tie on cost, selects the lexicographically smallest exit ID (`exitA.id < exitB.id`).
  3. Tertiary: If multiple paths to that same exit tie on cost, selects the lexicographically smallest sequence of node IDs.
- **Failure State Handling**:
  - Displays exact string: `"No route available"` (EN) / `"কোনো পথ উপলব্ধ নেই"` (BN) when no exit is reachable.
  - Displays exact string: `"Starting location blocked"` (EN) / `"শুরুর স্থানটি অবরুদ্ধ"` (BN) if the selected starting room/junction is or becomes blocked.

### 3.4 Dynamic Hazard Management
- **Immediate Recalculation**: Reroutes instantly on every node, edge, or exit hazard toggle without re-importing data.
- **Interactive Toggles**:
  - Click on any room or junction to toggle blocked hazard state.
  - Click on any exit to toggle open/closed state.
  - Click on any corridor or cost badge to toggle blocked state.
  - Quick-action toggle buttons in the sidebar for every node, corridor, and exit.
- **Reset Button**: Restores the building file's original `initial_state` with a single click.

### 3.5 Bilingual Support (English & Bangla)
- Full bilingual switch (`EN` / `বাংলা`) in header.
- Translates all interface labels, status alerts, error notices, button text, and legend descriptions.
- Preserves dataset IDs and labels intact.

---

## 4. Bonus & Optional Features Implemented (Section 4.2)
1. **Alternative Routes Engine**:
   - Calculates and displays ranked alternative evacuation routes (Rank 2 and Rank 3) with path sequence and costs.
   - Hovering over an alternative route card dynamically previews that path on the map.
2. **Step-by-Step Walkthrough Simulator**:
   - "Start Walkthrough" button animates an evacuation marker progressing node-by-node along the computed path to safety.
3. **Automated Test Suite Modal (Section 4.1 Verification)**:
   - Built-in test harness verifying all 5 official contest scenarios in real time.
   - Displays live `PASSED` / `FAILED` badges for contest judges with one click.
4. **High-Contrast Accessibility Mode (WCAG AAA)**:
   - Dedicated toggle applying high-contrast palettes, increased stroke borders, and dark backgrounds for emergency visibility.
5. **High-Resolution PNG Map Export**:
   - One-click export that rasterizes the current SVG canvas with highlighted routes and hazards into a high-DPI downloadable PNG image (`smart-escape-[timestamp].png`).

---

## 5. Verification: Official Test Cases (Section 4.1)

| Scenario | Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Baseline** | Select `R1` | `R1 - C1 - C2 - E1; cost 7` | `R1 - C1 - C2 - E1; cost 7` | **PASSED** |
| **Blocked Junction** | Select `R1`; block `C2` | `R1 - C1 - C3 - C4 - E2; cost 11` | `R1 - C1 - C3 - C4 - E2; cost 11` | **PASSED** |
| **Exits Closed** | Select `R1`; close `E1` and `E2` | `No route available` | `No route available` | **PASSED** |
| **Different Start** | Select `R2` | `R2 - C3 - C4 - E2; cost 7` | `R2 - C3 - C4 - E2; cost 7` | **PASSED** |
| **Blocked Start** | Select `R1`; then block `R1` | `Starting location blocked` | `Starting location blocked` | **PASSED** |

---

## 6. Screenshots

Screenshots demonstrating the mandatory scenarios are included in the [`screenshots/`](screenshots/) directory:

| Baseline Route (`R1 -> E1; cost 7`) | Rerouting after `C2` is Blocked (`R1 -> E2; cost 11`) |
| :---: | :---: |
| ![Baseline](screenshots/baseline.png) | ![Rerouting after C2 Blocked](screenshots/rerouting_blocked_c2.png) |

| Automated Test Suite Verification | Bilingual Mode (বাংলা) |
| :---: | :---: |
| ![Test Verification](screenshots/test_verification_modal.png) | ![Bangla Interface](screenshots/bangla_interface.png) |

| Failure Case: No Route Available | Failure Case: Starting Location Blocked |
| :---: | :---: |
| ![No Route](screenshots/failure_no_route.png) | ![Blocked Start](screenshots/failure_blocked_start.png) |

---

## 7. Known Issues & Limitations
- **External API Dependency**: None. The routing engine is completely self-contained and operates 100% offline without external servers or internet connection.
- **Node Overlap in User Datasets**: If an uploaded custom dataset contains overlapping display coordinates `(x, y)` for two different nodes, the SVG badges will visually overlap. The zoom and pan tools mitigate this, but valid JSONs are assumed to have distinct visual coordinates.

---

## 8. AI Tools Used & Most Useful Prompt

- **AI Tools Used**: Google Gemini 3.8 / Antigravity Agentic Assistant.
- **Most Useful AI Prompt**:
  > *"Implement a robust Dijkstra evacuation router for an undirected weighted building graph in JavaScript that strictly follows the tie-breaking rules: choose the reachable open exit with minimum cost; on equal cost, choose the lexicographically smallest exit ID; if paths to that exit also tie, choose the lexicographically smallest sequence of node IDs. Include failure handling for 'No route available' and 'Starting location blocked', and verify all 5 test scenarios from Section 4.1."*

---

## 9. Recommended Commit History Log (Section 8.4 Compliant)

| Commit # | Summary | Commit Message & Prompt (Section 8.4) |
| :--- | :--- | :--- |
| **Commit 1** | Initial setup & graph data | `feat: setup project structure, MIT license, building.json dataset and test runner`<br>*Prompt: "Initialize project structure with building.json dataset, MIT license, and automated test suite verifying sample scenarios."* |
| **Commit 2** | UI & Dijkstra Routing | `feat: implement interactive SVG canvas, Dijkstra routing with tie-breakers, and hazard management`<br>*Prompt: "Create interactive SVG map rendering nodes and corridors, real-time Dijkstra routing with exact tie-breaking rules, and clickable hazard controls."* |
| **Commit 3** | Bilingual & Bonus Extensions | `feat: add English/Bangla i18n, high-contrast mode, walkthrough animation, and PNG export`<br>*Prompt: "Add bilingual toggle for English and Bangla, step-by-step evacuation walkthrough, high-contrast theme, and high-DPI PNG export."* |
