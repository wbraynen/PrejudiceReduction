// NetLogo-matching JS implementation
// - Strategy ids: 0..7 are reactive bit strategies; 8 is PTFT
// - Ethnicity: 0 = red, 1 = green
// - World: torus wrapping
// - Scoring: exact NetLogo payoff table (closed-form)
// - Interaction: each patch plays each of 8 neighbors directionally (double-counted)
// - Evolution: max-one-of (random tie-break) in-radius imitation_radius; adopt only if strictly higher

// ----- NetLogo strategy ids (as in the NetLogo plot) -----
const STRATEGY = {
  ALL_D: 0,      // 000
  SUSP_PERV: 1,  // 001
  STFT: 2,       // 010 (Suspicious TFT)
  S011: 3,       // 011
  C_THEN_ALL_D: 4, // 100
  S101: 5,       // 101
  TFT: 6,        // 110
  ALL_C: 7,      // 111
  PTFT: 8        // PTFT
};

// Reactive bits for strategies 0..7 (000..111)
const STRATEGY_BITS = {
  0: [0, 0, 0],
  1: [0, 0, 1],
  2: [0, 1, 0],
  3: [0, 1, 1],
  4: [1, 0, 0],
  5: [1, 0, 1],
  6: [1, 1, 0],
  7: [1, 1, 1]
};

// ----- NetLogo colors -----
// NetLogo strategy-to-color:
// 0 green, 1 cyan, 2 red, 3 magenta, 4 yellow, 5 dark gray, 6 light gray, 7 blue, 8 light orange
const STRATEGY_COLOR = {
  0: "#00C000", // green
  1: "#00FFFF", // cyan
  2: "#FF0000", // red
  3: "#FF00FF", // magenta
  4: "#FFFF00", // yellow
  5: "#4D4D4D", // dark gray (approx NetLogo 7)
  6: "#B3B3B3", // light gray (approx NetLogo 3)
  7: "#0000FF", // blue
  8: "#FFB366"  // light orange (approx NetLogo 27)
};

// NetLogo ethnicity-to-color: 0 red, 1 green
const ETHNICITY_COLOR = {
  0: "#FF0000",
  1: "#00C000"
};

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function shufflePickOne(arr) {
  return arr[randInt(arr.length)];
}

class Cell {
  constructor(x, y, ethnicity, strategy) {
    this.x = x;
    this.y = y;
    this.ethnicity = ethnicity; // 0 or 1
    this.strategy = strategy;   // 0..8
    this.newStrategy = strategy;

    this.score = 0;
    this.cooperated = 0;
    this.defected = 0;
  }

  resetCounters() {
    this.score = 0;
    this.cooperated = 0;
    this.defected = 0;
  }
}

class Simulation {
  constructor() {
    // NetLogo world is 64x64 by default
    this.gridSize = 64;

    // UI state that matches NetLogo defaults:
    this.isShowEthnicities = false; // show strategies by default
    this.isSegregated = true;       // segregated by default

    this.running = false;
    this.generation = 0; // NetLogo ticks

    // Canvas
    this.canvas = document.getElementById("worldCanvas");
    this.ctx = this.canvas.getContext("2d", { alpha: false });

    // Data
    this.grid = [];
    this.totalCooperated = 0;
    this.totalDefected = 0;

    // Optional: chart/history (keep if you want)
    this.history = [];

    this.setupEventListeners();
    this.reset();
  }

  // ---- Parameters from sliders (match NetLogo widgets) ----
  get roundsToPlay() {
    return parseInt(document.getElementById("rounds_to_play").value, 10);
  }
  get imitationRadius() {
    return parseFloat(document.getElementById("imitation_radius").value);
  }
  get payoffs() {
    return {
      cc: parseInt(document.getElementById("payoffs_cc").value, 10),
      cd: parseInt(document.getElementById("payoffs_cd").value, 10),
      dc: parseInt(document.getElementById("payoffs_dc").value, 10),
      dd: parseInt(document.getElementById("payoffs_dd").value, 10)
    };
  }

  setupEventListeners() {
    document.getElementById("startBtn").addEventListener("click", () => this.start());
    document.getElementById("pauseBtn").addEventListener("click", () => this.pause());
    document.getElementById("resetBtn").addEventListener("click", () => this.reset());

    document.getElementById("toggleDisplayBtn").addEventListener("click", () => {
      this.isShowEthnicities = !this.isShowEthnicities;
      this.draw();
    });

    document.getElementById("desegregateBtn").addEventListener("click", () => {
      this.isSegregated = !this.isSegregated;
      this.initEthnicities(); // like NetLogo: ask patches [ init_ethnicity ]
      this.draw();
    });

    // If these sliders change, NetLogo doesn't auto-reset; but web sims often do.
    // We'll keep simulation state and just affect next steps.
    // If you prefer, call this.reset() on changes.
  }

  reset() {
    this.running = false;
    this.generation = 0;
    this.history = [];

    // Canvas sizing: draw scaled pixels, but logical grid = gridSize
    // We'll make canvas a fixed display size via CSS; logical size stays gridSize.
    this.canvas.width = this.gridSize;
    this.canvas.height = this.gridSize;

    this.grid = [];
    for (let x = 0; x < this.gridSize; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.gridSize; y++) {
        // strategy = random 9 (0..8)
        const s = randInt(9);

        // ethnicity from init-patch: segregated by default, pxcor < 0 => ethnicity 0
        // With x in [0..gridSize-1], "pxcor < 0" corresponds to left half.
        const ethnicity = (x < this.gridSize / 2) ? 0 : 1;

        this.grid[x][y] = new Cell(x, y, ethnicity, s);
      }
    }

    this.totalCooperated = 0;
    this.totalDefected = 0;

    this.draw();
    this.updateStatsUI();
  }

  initEthnicities() {
    // NetLogo init_ethnicity:
    // if segregated: left half ethnicity 0, right half 1
    // else random 2
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const c = this.grid[x][y];
        if (this.isSegregated) {
          c.ethnicity = (x < this.gridSize / 2) ? 0 : 1;
        } else {
          c.ethnicity = randInt(2);
        }
      }
    }
  }

  wrap(v) {
    const n = this.gridSize;
    return (v % n + n) % n;
  }

  cellAt(x, y) {
    return this.grid[this.wrap(x)][this.wrap(y)];
  }

  // NetLogo neighborhood: 8 neighbors for play_with_neighbors (fixed)
  getEightNeighborOffsets() {
    return [
      [ 0,  1],
      [ 1,  1],
      [ 1,  0],
      [ 1, -1],
      [ 0, -1],
      [-1, -1],
      [-1,  0],
      [-1,  1]
    ];
  }

  // NetLogo in-radius (Euclidean) for evolve; torus wrapping
  getCellsInRadius(cx, cy, r) {
    const res = [];
    const R = Math.ceil(r);
    for (let dx = -R; dx <= R; dx++) {
      for (let dy = -R; dy <= R; dy++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r) {
          res.push(this.cellAt(cx + dx, cy + dy)); // includes self (dx=0,dy=0)
        }
      }
    }
    return res;
  }

  // ----- PTFT resolution exactly like NetLogo my-strategy / neighbor-strategy -----
  resolveMyStrategyAgainst(me, other) {
    if (me.strategy !== STRATEGY.PTFT) return me.strategy;
    return (me.ethnicity === other.ethnicity) ? STRATEGY.TFT : STRATEGY.ALL_D;
  }

  resolveNeighborStrategyAgainst(other, me) {
    // "neighbor-strategy": what is the neighbor's strategy when they play me?
    if (other.strategy !== STRATEGY.PTFT) return other.strategy;
    return (other.ethnicity === me.ethnicity) ? STRATEGY.TFT : STRATEGY.ALL_D;
  }

  // ----- NetLogo increment_cooperated -----
  incrementCooperated(cell, inc) {
    const rounds = this.roundsToPlay;
    cell.cooperated += inc;
    cell.defected += (rounds - inc);
  }

  // ----- Exact translation of NetLogo payoff reporter -----
  payoff(s1, s2, cell) {
    const rounds = this.roundsToPlay;
    const { cc, cd, dc, dd } = this.payoffs;

    // Helper constants used in multiple cases
    const quarterMix = (cc + cd + dc + dd);

    // 000
    if (s1 === 0) this.incrementCooperated(cell, 0);
    if (s1 === 0 && s2 === 0) return rounds * dd;
    if (s1 === 0 && s2 === 1) return dd + (rounds - 1) * dc;
    if (s1 === 0 && s2 === 2) return rounds * dd;
    if (s1 === 0 && s2 === 3) return dd + (rounds - 1) * dc;
    if (s1 === 0 && s2 === 4) return dc + (rounds - 1) * dd;
    if (s1 === 0 && s2 === 5) return rounds * dc;
    if (s1 === 0 && s2 === 6) return dc + (rounds - 1) * dd;
    if (s1 === 0 && s2 === 7) return rounds * dc;

    // 001
    if (s1 === 1 && s2 === 0) { this.incrementCooperated(cell, rounds - 2); return dd + (rounds - 1) * cd; }
    if (s1 === 1 && s2 === 1) { this.incrementCooperated(cell, rounds / 2); return (rounds / 2) * dd + (rounds / 2) * cc; }
    if (s1 === 1 && s2 === 2) { this.incrementCooperated(cell, rounds / 2); return (rounds / 4) * quarterMix; }
    if (s1 === 1 && s2 === 3) { this.incrementCooperated(cell, 1); return dd + cc + (rounds - 2) * dc; }
    if (s1 === 1 && s2 === 4) { this.incrementCooperated(cell, rounds - 2); return dc + dd + (rounds - 2) * cd; }
    if (s1 === 1 && s2 === 5) { this.incrementCooperated(cell, 0); return rounds * dc; }
    if (s1 === 1 && s2 === 6) { this.incrementCooperated(cell, rounds / 2); return (rounds / 4) * quarterMix; }
    if (s1 === 1 && s2 === 7) { this.incrementCooperated(cell, 0); return rounds * dc; }

    // 010
    if (s1 === 2 && s2 === 0) { this.incrementCooperated(cell, 0); return rounds * dd; }
    if (s1 === 2 && s2 === 1) { this.incrementCooperated(cell, rounds / 2); return (rounds / 4) * quarterMix; }
    if (s1 === 2 && s2 === 2) { this.incrementCooperated(cell, 0); return rounds * dd; }
    if (s1 === 2 && s2 === 3) { this.incrementCooperated(cell, rounds - 2); return dd + dc + (rounds - 2) * cc; }
    if (s1 === 2 && s2 === 4) { this.incrementCooperated(cell, 1); return dc + cd + (rounds - 2) * dd; }
    if (s1 === 2 && s2 === 5) { this.incrementCooperated(cell, rounds / 2); return (rounds / 4) * quarterMix; }
    if (s1 === 2 && s2 === 6) { this.incrementCooperated(cell, rounds / 2); return (rounds / 2) * dc + (rounds / 2) * cd; }
    if (s1 === 2 && s2 === 7) { this.incrementCooperated(cell, rounds - 2); return dc + (rounds - 1) * cc; }

    // 011
    if (s1 === 3) this.incrementCooperated(cell, rounds - 1);
    if (s1 === 3 && s2 === 0) return dd + (rounds - 1) * cd;
    if (s1 === 3 && s2 === 1) return dd + cc + (rounds - 2) * cd;
    if (s1 === 3 && s2 === 2) return dd + cd + (rounds - 2) * cc;
    if (s1 === 3 && s2 === 3) return dd + (rounds - 1) * cc;
    if (s1 === 3 && s2 === 4) return dc + (rounds - 1) * cd;
    if (s1 === 3 && s2 === 5) return dc + cc + (rounds - 2) * cd;
    if (s1 === 3 && s2 === 6) return dc + cd + (rounds - 2) * cc;
    if (s1 === 3 && s2 === 7) return dc + (rounds - 1) * cc;

    // 100
    if (s1 === 4) this.incrementCooperated(cell, 1);
    if (s1 === 4 && s2 === 0) return cd + (rounds - 1) * dd;
    if (s1 === 4 && s2 === 1) return cd + dd + (rounds - 2) * dc;
    if (s1 === 4 && s2 === 2) return cd + dc + (rounds - 2) * dd;
    if (s1 === 4 && s2 === 3) return cd + (rounds - 1) * dc;
    if (s1 === 4 && s2 === 4) return cc + (rounds - 1) * dd;
    if (s1 === 4 && s2 === 5) return cc + dd + (rounds - 2) * dc;
    if (s1 === 4 && s2 === 6) return cc + dc + (rounds - 2) * dd;
    if (s1 === 4 && s2 === 7) return cc + (rounds - 1) * dc;

    // 101
    if (s1 === 5 && s2 === 0) { this.incrementCooperated(cell, rounds); return rounds * cd; }
    if (s1 === 5 && s2 === 1) { this.incrementCooperated(cell, rounds); return rounds * cd; }
    if (s1 === 5 && s2 === 2) { this.incrementCooperated(cell, rounds / 2); return 50 * quarterMix; } // NetLogo hardcodes 50 because rounds=200 default; keep literal translation
    if (s1 === 5 && s2 === 3) { this.incrementCooperated(cell, 2); return cd + cc + (rounds - 2) * dc; }
    if (s1 === 5 && s2 === 4) { this.incrementCooperated(cell, rounds - 2); return cc + dd + (rounds - 2) * cd; }
    if (s1 === 5 && s2 === 5) { this.incrementCooperated(cell, rounds / 2); return (rounds / 2) * cc + (rounds / 2) * dd; }
    if (s1 === 5 && s2 === 6) { this.incrementCooperated(cell, rounds / 2); return 50 * quarterMix; }
    if (s1 === 5 && s2 === 7) { this.incrementCooperated(cell, 1); return cc + (rounds - 1) * dc; }

    // 110
    if (s1 === 6 && s2 === 0) { this.incrementCooperated(cell, 1); return cd + (rounds - 1) * dd; }
    if (s1 === 6 && s2 === 1) { this.incrementCooperated(cell, rounds / 2); return 50 * quarterMix; }
    if (s1 === 6 && s2 === 2) { this.incrementCooperated(cell, rounds / 2); return (rounds / 2) * cd + (rounds / 2) * dc; }
    if (s1 === 6 && s2 === 3) { this.incrementCooperated(cell, rounds - 1); return cd + dc + (rounds - 2) * cc; }
    if (s1 === 6 && s2 === 4) { this.incrementCooperated(cell, 2); return cc + cd + (rounds - 2) * dd; }
    if (s1 === 6 && s2 === 5) { this.incrementCooperated(cell, rounds / 2); return 50 * quarterMix; }
    if (s1 === 6 && s2 === 6) { this.incrementCooperated(cell, rounds); return rounds * cc; }
    if (s1 === 6 && s2 === 7) { this.incrementCooperated(cell, rounds); return rounds * cc; }

    // 111
    if (s1 === 7) this.incrementCooperated(cell, rounds);
    if (s1 === 7 && s2 === 0) return rounds * cd;
    if (s1 === 7 && s2 === 1) return rounds * cd;
    if (s1 === 7 && s2 === 2) return cd + (rounds - 1) * cc;
    if (s1 === 7 && s2 === 3) return cd + (rounds - 1) * cc;
    if (s1 === 7 && s2 === 4) return cc + (rounds - 1) * cd;
    if (s1 === 7 && s2 === 5) return cc + (rounds - 1) * cd;
    if (s1 === 7 && s2 === 6) return rounds * cc;
    if (s1 === 7 && s2 === 7) return rounds * cc;

    // Should never happen because PTFT is resolved before payoff
    return 0;
  }

  // One directional interaction: "me plays neighbor"
  playWithNeighbor(me, neighbor) {
    const s1 = this.resolveMyStrategyAgainst(me, neighbor);
    const s2 = this.resolveNeighborStrategyAgainst(neighbor, me);
    return this.payoff(s1, s2, me);
  }

  step() {
    // NetLogo: ask patches [ play_with_neighbors ]
    // Each patch resets its counters and sums payoff vs 8 neighbors
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        this.grid[x][y].resetCounters();
      }
    }

    const offsets = this.getEightNeighborOffsets();
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const me = this.grid[x][y];
        let sum = 0;
        for (const [dx, dy] of offsets) {
          const nb = this.cellAt(x + dx, y + dy);
          sum += this.playWithNeighbor(me, nb);
        }
        me.score = sum;
      }
    }

    // NetLogo: ask patches [ evolve ]
    // fittest-neighbor = max-one-of (patches in-radius imitation_radius) [score]
    // if score < [score] of fittest-neighbor -> copy its strategy else keep own
    const r = this.imitationRadius;
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const me = this.grid[x][y];
        const neighborhood = this.getCellsInRadius(x, y, r);

        let maxScore = -Infinity;
        for (const c of neighborhood) maxScore = Math.max(maxScore, c.score);

        // random tie-break like NetLogo max-one-of
        const best = shufflePickOne(neighborhood.filter(c => c.score === maxScore));

        me.newStrategy = (me.score < best.score) ? best.strategy : me.strategy;
      }
    }

    // NetLogo: ask patches [ set strategy new_strategy ]
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        this.grid[x][y].strategy = this.grid[x][y].newStrategy;
      }
    }

    // NetLogo: init-global-counters + ask patches [ count-total-cooperated ]
    this.totalCooperated = 0;
    this.totalDefected = 0;
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const c = this.grid[x][y];
        this.totalCooperated += c.cooperated;
        this.totalDefected += c.defected;
      }
    }

    this.generation++;
    this.draw();
    this.updateStatsUI();
    this.updateHistory(); // optional chart
  }

  draw() {
    // Draw either strategies or ethnicities, like NetLogo display-agents
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const c = this.grid[x][y];
        const fill = this.isShowEthnicities
          ? ETHNICITY_COLOR[c.ethnicity]
          : STRATEGY_COLOR[c.strategy];

        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  updateStatsUI() {
    // Match NetLogo’s semantics: plots show COUNTS, behavior shows totals
    const counts = new Array(9).fill(0);
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        counts[this.grid[x][y].strategy]++;
      }
    }

    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };

    setText("ticks", this.generation);

    // Strategy counts (like NetLogo plot pens)
    setText("count_s0", counts[0]);
    setText("count_s1", counts[1]);
    setText("count_s2", counts[2]);
    setText("count_s3", counts[3]);
    setText("count_s4", counts[4]);
    setText("count_s5", counts[5]);
    setText("count_s6", counts[6]);
    setText("count_s7", counts[7]);
    setText("count_s8", counts[8]);

    // Behavior totals (like NetLogo Behavior plot)
    setText("total_cooperated", this.totalCooperated);
    setText("total_defected", this.totalDefected);
  }

  updateHistory() {
    // Optional: keep history in counts like NetLogo plots (not percents)
    const counts = new Array(9).fill(0);
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        counts[this.grid[x][y].strategy]++;
      }
    }

    this.history.push({
      tick: this.generation,
      strategies: counts,
      cooperated: this.totalCooperated,
      defected: this.totalDefected
    });
  }

  start() {
    this.running = true;
    this.runLoop();
  }

  pause() {
    this.running = false;
  }

  runLoop() {
    if (!this.running) return;
    this.step();

    const speedEl = document.getElementById("speed");
    const delay = speedEl ? parseInt(speedEl.value, 10) : 50;
    setTimeout(() => this.runLoop(), delay);
  }
}

// Initialize
const sim = new Simulation();