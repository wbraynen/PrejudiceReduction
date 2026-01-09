// Extracted JS from model.html
// Strategy definitions
const STRATEGIES = {
    ALL_D: [0, 0, 0],        // All-Defect
    SUSP_PERV: [0, 0, 1],    // Suspicious Perverse
    SUSP_TFT: [0, 1, 0],     // Suspicious TFT
    D_ALL_C: [0, 1, 1],      // D-then-All-C
    C_ALL_D: [1, 0, 0],      // C-then-All-D
    PERVERSE: [1, 0, 1],     // Perverse
    TFT: [1, 1, 0],          // Tit for Tat
    ALL_C: [1, 1, 1],        // All-Cooperate
    PTFT: [9, 9, 9]          // Prejudicial TFT (special marker)
};

const STRATEGY_COLORS = {
    '0,0,0': '#4444FF',     // All-D - Blue
    '0,0,1': '#FF8800',     // Suspicious Perverse - Orange
    '0,1,0': '#FFFF44',     // Suspicious TFT - Yellow
    '0,1,1': '#00FF00',     // D-then-All-C - Green
    '1,0,0': '#FF44FF',     // C-then-All-D - Magenta
    '1,0,1': '#44FFFF',     // Perverse - Cyan
    '1,1,0': '#000000',     // TFT - Black (as specified)
    '1,1,1': '#44FF44',     // All-C - Light Green
    '9,9,9': '#FF4444'      // PTFT - Red
};

class Cell {
    constructor(x, y, color, strategy) {
        this.x = x;
        this.y = y;
        this.color = color; // 'red' or 'green'
        this.strategy = strategy;
        this.score = 0;
        this.nextStrategy = strategy;
    }

    playGame(opponent, socialBonus) {
        let rounds = 200;
        let myScore = 0;
        let oppScore = 0;
        let myLastMove = null;
        let oppLastMove = null;

        for (let i = 0; i < rounds; i++) {
            let myMove, oppMove;

            // Determine moves based on strategies
            if (this.isPTFT()) {
                if (this.color === opponent.color) {
                    // Play TFT with same color
                    myMove = (i === 0) ? 1 : (oppLastMove === 1 ? 1 : 0);
                } else {
                    // Play All-D with different color
                    myMove = 0;
                }
            } else {
                // Regular strategy
                if (i === 0) {
                    myMove = this.strategy[0];
                } else {
                    myMove = oppLastMove === 1 ? this.strategy[1] : this.strategy[2];
                }
            }

            if (opponent.isPTFT()) {
                if (opponent.color === this.color) {
                    oppMove = (i === 0) ? 1 : (myLastMove === 1 ? 1 : 0);
                } else {
                    oppMove = 0;
                }
            } else {
                if (i === 0) {
                    oppMove = opponent.strategy[0];
                } else {
                    oppMove = myLastMove === 1 ? opponent.strategy[1] : opponent.strategy[2];
                }
            }

            // Calculate scores based on Prisoner's Dilemma matrix
            if (myMove === 1 && oppMove === 1) {
                myScore += 3; // Both cooperate
                oppScore += 3;
            } else if (myMove === 1 && oppMove === 0) {
                myScore += 0; // I cooperate, they defect
                oppScore += 5;
            } else if (myMove === 0 && oppMove === 1) {
                myScore += 5; // I defect, they cooperate
                oppScore += 0;
            } else {
                myScore += 1; // Both defect
                oppScore += 1;
            }

            myLastMove = myMove;
            oppLastMove = oppMove;
        }

        // Add social identification bonus for PTFT playing with same color
        // NOTE: apply bonus symmetrically where appropriate so each agent's
        // payoff reflects their own PTFT extra benefit when interacting
        // with same-group partners (enforces paper assumption: bonus
        // applies to PTFT only in same-group interactions).
        if (this.isPTFT() && this.color === opponent.color && socialBonus > 0) {
            myScore += socialBonus;
        }
        if (opponent.isPTFT() && opponent.color === this.color && socialBonus > 0) {
            oppScore += socialBonus;
        }

        // Return both players' scores so caller can accumulate them symmetrically
        return [myScore, oppScore];
    }

    isPTFT() {
        return this.strategy[0] === 9;
    }
}

class Simulation {
    constructor() {
        this.gridSize = 64;
        this.grid = [];
        this.generation = 0;
        this.running = false;
        this.strategyCanvas = document.getElementById('strategyCanvas');
        this.colorCanvas = document.getElementById('colorCanvas');
        this.chartCanvas = document.getElementById('chartCanvas');
        this.strategyCtx = this.strategyCanvas.getContext('2d');
        this.colorCtx = this.colorCanvas.getContext('2d');
        this.chartCtx = this.chartCanvas.getContext('2d');
        this.history = [];
        this.socialBonus = 0;

        this.setupEventListeners();
        this.reset();
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('environment').addEventListener('change', () => this.reset());
        document.getElementById('gridSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.reset();
        });
        document.getElementById('speed').addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value;
        });
        document.getElementById('socialBonus').addEventListener('input', (e) => {
            this.socialBonus = parseInt(e.target.value);
            document.getElementById('bonusValue').textContent = e.target.value;
        });
    }

    reset() {
        this.generation = 0;
        this.history = [];
        this.grid = [];
        const environment = document.getElementById('environment').value;

        // Set canvas sizes
        this.strategyCanvas.width = this.gridSize;
        this.strategyCanvas.height = this.gridSize;
        this.colorCanvas.width = this.gridSize;
        this.colorCanvas.height = this.gridSize;

        // Initialize grid
        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridSize; y++) {
                let color;

                // Determine color based on environment type
                if (environment === 'segregated') {
                    color = x < this.gridSize / 2 ? 'green' : 'red';
                } else if (environment === 'checkerboard') {
                    color = (x + y) % 2 === 0 ? 'green' : 'red';
                } else { // mixed
                    color = Math.random() < 0.5 ? 'green' : 'red';
                }

                // Random strategy including PTFT
                const strategies = Object.values(STRATEGIES);
                const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];

                this.grid[x][y] = new Cell(x, y, color, randomStrategy);
            }
        }

        this.draw();
        this.updateStats();
    }

    getNeighbors(x, y) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = (x + dx + this.gridSize) % this.gridSize;
                const ny = (y + dy + this.gridSize) % this.gridSize;
                neighbors.push(this.grid[nx][ny]);
            }
        }
        return neighbors;
    }

    step() {
        // Play games and calculate scores
        // First zero all scores
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.grid[x][y].score = 0;
            }
        }

        // Compute each unordered pair of neighbors once and add payoffs
        // symmetrically to both agents (enforces paper assumption: each
        // agent's total score is the sum of its own PD payoffs).
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.grid[x][y];
                const neighbors = this.getNeighbors(x, y);

                for (const neighbor of neighbors) {
                    // Ensure each unordered pair is processed only once by using
                    // a simple lexicographic ordering on coordinates. This avoids
                    // double-counting interactions.
                    if (neighbor.x < x) continue;
                    if (neighbor.x === x && neighbor.y <= y) continue;

                    const [s1, s2] = cell.playGame(neighbor, this.socialBonus);
                    cell.score += s1;
                    neighbor.score += s2;
                }
            }
        }

        // Update strategies based on most successful neighbor
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.grid[x][y];
                const neighbors = this.getNeighbors(x, y);

                // Per paper: identify the maximum score among neighbors (exclude
                // the focal agent), collect all neighbors with that maximum,
                // randomly select one, and copy its strategy. This implements
                // stochastic tie-breaking among top-scoring neighbors rather than
                // defaulting to keeping one's own strategy.
                let maxScore = -Infinity;
                for (const neighbor of neighbors) {
                    if (neighbor.score > maxScore) maxScore = neighbor.score;
                }

                const topNeighbors = neighbors.filter(n => n.score === maxScore);
                // Randomly break ties among top neighbors
                const chosen = topNeighbors[Math.floor(Math.random() * topNeighbors.length)];
                cell.nextStrategy = chosen.strategy;
            }
        }

        // Apply strategy updates
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.grid[x][y].strategy = this.grid[x][y].nextStrategy;
            }
        }

        this.generation++;
        this.draw();
        this.updateStats();
        this.updateChart();
    }

    draw() {
        // Clear canvases
        this.strategyCtx.clearRect(0, 0, this.gridSize, this.gridSize);
        this.colorCtx.clearRect(0, 0, this.gridSize, this.gridSize);

        // Draw cells
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const cell = this.grid[x][y];

                // Draw strategy
                this.strategyCtx.fillStyle = STRATEGY_COLORS[cell.strategy.toString()];
                this.strategyCtx.fillRect(x, y, 1, 1);

                // Draw color
                this.colorCtx.fillStyle = cell.color === 'green' ? '#44FF44' : '#FF4444';
                this.colorCtx.fillRect(x, y, 1, 1);
            }
        }
    }

    updateStats() {
        let counts = {};
        let total = this.gridSize * this.gridSize;

        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const strategy = this.grid[x][y].strategy.toString();
                counts[strategy] = (counts[strategy] || 0) + 1;
            }
        }

        document.getElementById('generation').textContent = this.generation;
        document.getElementById('tftPercent').textContent = 
            ((counts['1,1,0'] || 0) / total * 100).toFixed(1) + '%';
        document.getElementById('ptftPercent').textContent = 
            ((counts['9,9,9'] || 0) / total * 100).toFixed(1) + '%';
        document.getElementById('allDPercent').textContent = 
            ((counts['0,0,0'] || 0) / total * 100).toFixed(1) + '%';

        // Store history for chart
        this.history.push({
            generation: this.generation,
            tft: (counts['1,1,0'] || 0) / total * 100,
            ptft: (counts['9,9,9'] || 0) / total * 100,
            allD: (counts['0,0,0'] || 0) / total * 100,
            allC: (counts['1,1,1'] || 0) / total * 100
        });
    }

    updateChart() {
        const width = this.chartCanvas.width = this.chartCanvas.offsetWidth;
        const height = this.chartCanvas.height = this.chartCanvas.offsetHeight;
        const padding = 40;

        this.chartCtx.clearRect(0, 0, width, height);

        if (this.history.length < 2) return;

        // Draw axes
        this.chartCtx.strokeStyle = '#ddd';
        this.chartCtx.lineWidth = 1;
        this.chartCtx.beginPath();
        this.chartCtx.moveTo(padding, padding);
        this.chartCtx.lineTo(padding, height - padding);
        this.chartCtx.lineTo(width - padding, height - padding);
        this.chartCtx.stroke();

        // Draw grid lines
        for (let i = 0; i <= 10; i++) {
            const y = padding + (height - 2 * padding) * i / 10;
            this.chartCtx.beginPath();
            this.chartCtx.moveTo(padding, y);
            this.chartCtx.lineTo(width - padding, y);
            this.chartCtx.strokeStyle = '#f0f0f0';
            this.chartCtx.stroke();

            // Y-axis labels
            this.chartCtx.fillStyle = '#666';
            this.chartCtx.font = '10px Arial';
            this.chartCtx.textAlign = 'right';
            this.chartCtx.fillText((100 - i * 10) + '%', padding - 5, y + 3);
        }

        // Plot lines
        const xScale = (width - 2 * padding) / Math.max(50, this.history.length - 1);

        const drawLine = (data, color, lineWidth = 2) => {
            this.chartCtx.strokeStyle = color;
            this.chartCtx.lineWidth = lineWidth;
            this.chartCtx.beginPath();

            for (let i = 0; i < this.history.length; i++) {
                const x = padding + i * xScale;
                const y = padding + (height - 2 * padding) * (1 - data[i] / 100);

                if (i === 0) {
                    this.chartCtx.moveTo(x, y);
                } else {
                    this.chartCtx.lineTo(x, y);
                }
            }
            this.chartCtx.stroke();
        };

        // Draw lines for each strategy
        drawLine(this.history.map(h => h.tft), '#000000', 3); // TFT in black
        drawLine(this.history.map(h => h.ptft), '#FF4444', 2); // PTFT in red
        drawLine(this.history.map(h => h.allD), '#4444FF', 2); // All-D in blue
        drawLine(this.history.map(h => h.allC), '#44FF44', 2); // All-C in green

        // X-axis labels
        this.chartCtx.fillStyle = '#666';
        this.chartCtx.font = '10px Arial';
        this.chartCtx.textAlign = 'center';
        for (let i = 0; i <= Math.min(this.generation, 50); i += 10) {
            const x = padding + i * xScale;
            this.chartCtx.fillText(i, x, height - padding + 15);
        }

        // Title
        this.chartCtx.fillStyle = '#333';
        this.chartCtx.font = 'bold 14px Arial';
        this.chartCtx.textAlign = 'center';
        this.chartCtx.fillText('Strategy Evolution Over Time', width / 2, 20);
    }

    start() {
        this.running = true;
        this.run();
    }

    pause() {
        this.running = false;
    }

    run() {
        if (!this.running) return;

        this.step();

        const speed = parseInt(document.getElementById('speed').value);
        setTimeout(() => this.run(), speed);
    }
}

// Initialize simulation
const sim = new Simulation();
