# ODD Protocol Documentation
## Modeling Prejudice Reduction: A Spatialized Game-Theoretic Model

**Model Authors:** Patrick Grim, Evan Selinger, William Braynen, Robert Rosenberger, Randy Au, Nancy Louie, John Connolly  
**Original Implementation:** July 2007 (NetLogo 3.x)  
**Ported to NetLogo 7.0.3:** January 2026  
**Documentation Date:** January 19, 2026  
**ODD Documentation Author:** Based on work by Patrick Grim et al. (2005)

---

## OVERVIEW

### 1. Purpose and Patterns

#### Purpose

This agent-based model explores the emergence and reduction of prejudice through the lens of spatialized evolutionary game theory, specifically testing the *contact hypothesis* from social psychology. The model investigates whether prejudice reduction observed when different ethnic groups interact spatially can be explained through low-level game-theoretic mechanisms rather than requiring highly cognitive processes like stereotype reconstruction or friendship formation.

The model addresses the following specific research questions:

1. Can simple game-theoretic strategies combined with spatial structure explain patterns of cooperation and defection across ethnic boundaries?
2. Under what conditions does the "Parochial Tit-for-Tat" (PTFT) strategy—which cooperates with in-group members but defects against out-group members—emerge and persist?
3. How does spatial segregation versus integration affect the evolution of cooperative strategies?
4. Can contact between ethnic groups lead to the breakdown of parochial cooperation and the emergence of universal cooperation (standard Tit-for-Tat)?

The higher-level purpose is theoretical exposition and hypothesis testing: to demonstrate that computational modeling can provide mechanistic explanations for social psychological phenomena, specifically prejudice reduction through contact.

#### Patterns

The model is designed to reproduce and explain the following empirical patterns:

**Pattern 1: Contact Hypothesis** - The robust social psychological finding that under appropriate conditions, interpersonal contact between members of different groups is one of the most effective ways to reduce prejudice (Allport, 1954; as cited in Grim et al., 2005). The model should show that spatial contact between ethnic groups can lead to reduced discrimination (increased cooperation across ethnic boundaries).

**Pattern 2: Spatial Segregation Effects** - Observation that segregated populations tend to maintain group-preferential behaviors, while integrated populations show reduced in-group favoritism. The model should demonstrate this pattern through differential success of PTFT strategy under segregation versus integration.

**Pattern 3: Tit-for-Tat Dominance** - The well-established finding from evolutionary game theory that Tit-for-Tat (TFT) strategies tend to dominate in iterated prisoner's dilemma contexts with spatial structure (Axelrod, 1984; Grim, 1995). The model should show TFT emerging as dominant under certain conditions.

**Pattern 4: Strategic Contagion** - The empirical observation that successful strategies spread spatially through imitation in evolutionary settings. The model should exhibit spatial clustering of similar strategies.

These patterns serve as evaluation criteria for whether the model is suitable for its stated purpose of explaining prejudice dynamics through game-theoretic mechanisms.

---

### 2. Entities, State Variables, and Scales

#### Entities

The model contains two primary types of entities:

1. **Patches** (Spatial Units): The fundamental agents in this model. Each patch represents a spatial location that can execute one of nine possible reactive strategies in prisoner's dilemma interactions with neighboring patches.

2. **The Observer**: Represents the global environment and manages global variables, initialization, and data collection.

#### State Variables

**Patch State Variables** (each patch has):

- `ethnicity` (integer: 0 or 1): Identifies the ethnic group membership of the patch. In the default segregated configuration, patches with pxcor < 0 have ethnicity = 0, those with pxcor ≥ 0 have ethnicity = 1.

- `strategy` (integer: 0-8): The current game-theoretic strategy employed by the patch:
  - 0 = AllD (000): Always Defect
  - 1 = 001: Defect, Defect, Cooperate
  - 2 = STFT (010): Suspicious Tit-for-Tat (Defect first, then copy opponent)
  - 3 = 011: Defect, Cooperate, Cooperate
  - 4 = 100: Cooperate once, then Always Defect
  - 5 = 101: Cooperate, Defect, Cooperate
  - 6 = TFT (110): Tit-for-Tat (Cooperate first, then copy opponent)
  - 7 = AllC (111): Always Cooperate
  - 8 = PTFT: Parochial Tit-for-Tat (TFT with in-group, AllD with out-group)

- `new_strategy` (integer: 0-8): Temporary storage for the strategy to be adopted in the next tick.

- `score` (real number): Cumulative payoff obtained from interactions with all eight neighbors in the current tick.

- `cooperated` (integer): Number of cooperations performed by this patch in current tick.

- `defected` (integer): Number of defections performed by this patch in current tick.

- `behavior` (not used in current implementation): Reserved for potential future use.

**Global State Variables:**

- `total_cooperated` (integer): Sum of all cooperations across all patches in current tick.

- `total_defected` (integer): Sum of all defections across all patches in current tick.

- `is_show_ethnicities` (boolean): Display mode toggle (true = show ethnic groups, false = show strategies).

- `is_segregated` (boolean): Configuration toggle (true = segregated by vertical midline, false = randomly distributed ethnicities).

**Parameters** (set via interface):

- `payoffs_cc` (real number, 0-10, default: 3): Payoff when both cooperate.

- `payoffs_cd` (real number, 0-10, default: 0): Payoff when ego cooperates, alter defects.

- `payoffs_dc` (real number, 0-10, default: 5): Payoff when ego defects, alter cooperates.

- `payoffs_dd` (real number, 0-10, default: 1): Payoff when both defect.

- `rounds_to_play` (integer, 4-200, default: 200): Number of rounds in each prisoner's dilemma game.

- `imitation_radius` (real number, 1-3, default: 1.5): Radius within which patches can observe and imitate neighbors.

#### Scales

**Spatial Scale:**
- **Extent**: 65 × 65 patches (coordinates from -32 to 32 in both x and y dimensions)
- **Resolution**: Each patch is a discrete spatial unit
- **Topology**: Toroidal (wrapping) world in standard NetLogo configuration
- **Distance metric**: Euclidean distance for `in-radius` calculations

**Temporal Scale:**
- **Time step**: One "tick" represents one complete generation of the evolutionary process
- **Duration**: Models typically run for 30-100+ ticks to observe emergence and stabilization of strategies
- **Time step components**:
  1. All patches interact with all 8 neighbors (one round of games)
  2. All patches evaluate neighbors and select new strategy
  3. All patches update to new strategy
  4. Global statistics updated and plotted

**Strategy Representation:**
The three-bit binary strategy codes (000-111) represent reactive strategies where each bit indicates the action (0=Defect, 1=Cooperate) in response to three possible opponent behaviors in the previous round. PTFT (strategy 8) is a special conditional strategy that dynamically switches between TFT and AllD based on opponent ethnicity.

---

### 3. Process Overview and Scheduling

#### Scheduling Structure

The model follows a synchronous, discrete-time schedule with the following sequence each tick:

1. **Interaction Phase** (`play_with_neighbors` procedure)
   - All patches simultaneously play iterated prisoner's dilemma with each of their eight Moore neighbors
   - Each patch accumulates a score based on payoffs from these eight games
   - Order: North, Northeast, East, Southeast, South, Southwest, West, Northwest

2. **Evolution Phase** (`evolve` procedure)
   - All patches simultaneously identify their fittest neighbor (highest score within imitation_radius)
   - Each patch determines whether to imitate the fittest neighbor or retain its own strategy
   - New strategy stored in `new_strategy` variable (not yet applied)

3. **Update Phase**
   - All patches simultaneously update their `strategy` to their `new_strategy`
   - Display updated visually to show new strategy distribution

4. **Data Collection Phase**
   - Global counters reset
   - All patches report their cooperation and defection counts
   - Totals aggregated and plotted

5. **Tick Advancement**
   - Tick counter incremented
   - Process repeats from step 1

#### Within-Step Details

**Interaction Phase Detail:**
For each of the eight neighbors, the current patch:
1. Determines what strategy it will play (considering PTFT ethnicity-conditional behavior)
2. Determines what strategy the neighbor will play
3. Looks up the payoff for this strategy pair from the payoff table
4. Adds this payoff to cumulative score
5. Updates cooperation/defection counters

**Evolution Phase Detail:**
1. Identifies all patches within `imitation_radius` (default 1.5, includes 8 immediate Moore neighbors)
2. Selects the one patch with the highest score (ties broken randomly by NetLogo)
3. If the selected neighbor's score exceeds the current patch's score:
   - Copy that neighbor's strategy to `new_strategy`
4. Otherwise:
   - Keep current strategy (set `new_strategy` = `strategy`)

**Strategy Execution:**
Strategies are reactive, meaning they respond to the opponent's previous move. For the iterated rounds within each tick:
- First round behavior is determined by first bit of strategy code
- Subsequent rounds copy or counter opponent's previous move based on strategy code
- PTFT checks opponent ethnicity and acts as TFT (110) if same ethnicity, AllD (000) if different

#### State Variable Updates

Updates follow a two-phase pattern to avoid timing conflicts:
- **Phase 1** (during evolution): New values written to `new_strategy`
- **Phase 2** (after all evolution complete): All `strategy` variables updated simultaneously

This ensures all patches evaluate neighbors based on current generation before any updates occur.

#### Order of Agent Actions

All patches act simultaneously (synchronously) within each phase. The use of temporary variable `new_strategy` prevents update order from affecting outcomes. Within the interaction phase, the eight neighbor interactions occur in fixed spatial order (N, NE, E, SE, S, SW, W, NW), but this order has no strategic implications since all interactions contribute symmetrically to the score.

---

## DESIGN CONCEPTS

### 4. Design Concepts

#### 4.1 Basic Principles

The model is grounded in three theoretical frameworks:

1. **Evolutionary Game Theory**: Specifically the iterated prisoner's dilemma (IPD), where rational actors face a tension between individual and collective optimization. The payoff structure creates incentives for defection despite mutual cooperation being collectively optimal.

2. **Spatial Structure and Evolution**: Drawing on work by Nowak & May (1992), Axelrod (1984), and especially Grim (1995, 1996, 1998), which demonstrates that spatial structure fundamentally alters evolutionary dynamics by creating local clusters where cooperative strategies can resist invasion.

3. **Contact Hypothesis**: A central finding in social psychology (Allport, 1954) that contact between groups under appropriate conditions reduces prejudice. The model tests whether this can emerge from low-level strategic interaction without requiring cognitive mechanisms.

The key innovation is introducing **ethnicity** as a state variable that conditions strategic behavior in the PTFT strategy, allowing exploration of in-group favoritism and its evolution.

#### 4.2 Emergence

The following patterns emerge from local interactions without being explicitly programmed:

1. **Spatial Clustering**: Successful strategies form spatial clusters as less successful neighbors imitate them. This clustering is not predetermined but emerges from the local imitation rule.

2. **Strategy Dominance**: Depending on initial conditions and parameters, particular strategies (especially TFT or PTFT) may come to dominate the population, though this is not guaranteed.

3. **Prejudice Reduction**: Under integrated (non-segregated) initial conditions, universal cooperation (TFT) may emerge and displace parochial cooperation (PTFT), representing emergent prejudice reduction through contact.

4. **Stable Polymorphisms**: Sometimes multiple strategies coexist in stable spatial configurations where no single strategy can invade the others.

The model's primary research contribution is demonstrating that prejudice reduction can emerge from simple game-theoretic mechanisms without requiring the complex cognitive processes (stereotype reconstruction, friendship formation) typically invoked in social psychology.

#### 4.3 Adaptation

Patches adapt their strategy through **imitation of success**: a patch observes all neighbors within its imitation radius and adopts the strategy of the most successful neighbor if that neighbor outperformed it.

This is a form of **cultural evolution** rather than genetic evolution—strategies are copied, not inherited. The adaptation process is:
- **Local**: Limited to neighbors within imitation_radius
- **Deterministic** given neighbor scores: Always imitate the best if better than self
- **Conservative**: Keep own strategy if no neighbor is better
- **Synchronous**: All patches update simultaneously each generation

This adaptation mechanism implements the "replicator dynamic" from evolutionary game theory in a spatial context.

#### 4.4 Objectives

Patches have an implicit objective to maximize their score (cumulative payoff). However, patches do not explicitly optimize or plan. Instead, the evolution process (imitation of success) acts as if patches were trying to maximize payoffs, implementing a form of "satisficing" by copying locally successful behaviors.

The objective function is the sum of payoffs from eight bilateral games:

**Score = Σ(payoff from game with neighbor i)** for i = 1 to 8

Where each game's payoff depends on the strategy pair and is played over `rounds_to_play` rounds.

#### 4.5 Learning

Individual patches do not learn in the sense of modifying their strategy based on experience. However, the population exhibits **population-level learning** through the evolutionary process:

- Successful strategies are reinforced (spatial spread)
- Unsuccessful strategies are eliminated (spatial contraction)
- The population's strategy distribution changes over time to favor high-scoring approaches

This is "learning" in the sense of adaptive improvement of population-level behavior, not individual learning.

#### 4.6 Prediction

Reactive strategies (0-7) embody a form of prediction: they predict opponent behavior in the current round based on opponent behavior in the previous round. For example:
- TFT predicts "opponent will repeat their last move" → copies it
- AllD predicts "opponent will cooperate (or won't matter)" → always defects

PTFT embodies a more sophisticated prediction: it predicts that in-group members are more likely to cooperate than out-group members, justifying different strategic responses.

These predictions are **implicit** in the strategy codes, not explicit cognitive processes.

#### 4.7 Sensing

Patches can sense:

1. **During Interaction**:
   - The ethnicity of each neighbor (via `patch-at` command)
   - The strategy of each neighbor (via `patch-at` command)
   - These allow execution of conditional strategies like PTFT

2. **During Evolution**:
   - The score (payoff) of all neighbors within imitation_radius
   - This allows identification of the most successful local strategy

Sensing is perfect and instantaneous—there is no sensory error, delay, or cost. This is appropriate for a theoretical model focused on strategic dynamics rather than information limitations.

#### 4.8 Interaction

All interaction is **pairwise** and **local**:

1. **During Game Playing**: Each patch plays an iterated prisoner's dilemma with each of its eight Moore neighbors. These interactions are:
   - Symmetric (both agents play and receive payoffs)
   - Simultaneous (all patches interact with all neighbors in the same phase)
   - Anonymous in one sense (players don't track specific neighbor histories across ticks) but personal in another (PTFT distinguishes neighbors by ethnicity)

2. **During Evolution**: Patches "interact" indirectly by observing neighbors' scores and potentially imitating them. This is:
   - Asymmetric (observer imitates but imitatee is passive)
   - One-directional (no reciprocal observation needed)

There is no communication, negotiation, or other form of interaction beyond these two modes.

#### 4.9 Stochasticity

The model includes stochasticity in:

1. **Initial Strategy Assignment**: At setup, each patch receives one of the nine strategies with equal probability (1/9 each). This creates random initial conditions for evolutionary dynamics.

2. **Tie-Breaking**: If multiple neighbors have the same maximum score, NetLogo's `max-one-of` primitive randomly selects one. This introduces stochasticity into which strategies spread when multiple are equally successful.

3. **Ethnicity Assignment** (when `is_segregated` = false): If desegregation is activated via the interface button, each patch receives ethnicity 0 or 1 with equal probability.

These sources of stochasticity mean that:
- Multiple runs with same parameters can produce different outcomes
- Exploring parameter space requires multiple replications
- Some outcomes may be probabilistic rather than deterministic

Importantly, **strategy execution itself is deterministic** given the strategy codes and neighbor actions—there is no randomness in how strategies play the game.

#### 4.10 Collectives

The primary collective is **ethnic groups**. Each patch belongs to one of two ethnic groups (ethnicity 0 or 1). These groups are:

- **Assigned exogenously**: At initialization, group membership is determined by spatial position (in segregated mode) or randomly (in integrated mode)
- **Immutable**: Ethnicity never changes during a run
- **Non-organized**: Groups have no leadership, coordination, or collective action
- **Informationally relevant**: Group membership affects PTFT strategy execution but has no other mechanical effects

The groups are "implicit collectives"—they exist as categories that affect individual behavior (via PTFT) but have no separate agency or attributes beyond the aggregation of their members.

A secondary collective is the **population** as a whole, characterized by:
- Total cooperation and defection rates
- Distribution of strategies
- Spatial patterns (clustering, segregation)

#### 4.11 Observation

Data collection occurs every tick and includes:

**Micro-level** (per patch):
- Strategy distribution (counted and plotted by strategy type)
- Ethnicity distribution (visualized via color)
- Cooperation and defection counts

**Macro-level** (population-wide):
- `total_cooperated`: Sum of all cooperation across all patches
- `total_defected`: Sum of all defections across all patches
- These are plotted over time to show aggregate behavioral trends

**Visualization Modes**:
1. Strategy display: Patches colored by current strategy (colors defined in `strategy-to-color`)
2. Ethnicity display: Patches colored by ethnic group (toggled via `show_ethnicities` button)

**Plots**:
1. "Strategies" plot: Line graph showing count of patches using each strategy over time (9 separate pens)
2. "Behavior" plot: Line graph showing total cooperation vs. defection over time (2 pens)

These observations allow tracking of:
- Strategy evolution (which strategies spread or decline)
- Spatial pattern formation (via visual inspection)
- Behavioral outcomes (cooperation rates)
- Relationship between segregation/integration and outcomes

---

## DETAILS

### 5. Initialization

#### Spatial Configuration

The model initializes a 65×65 grid of patches:
- X coordinates: -32 to 32
- Y coordinates: -32 to 32
- Total patches: 4,225
- Topology: Toroidal (wrapping)

#### Initial State Variable Values

**For each patch:**

1. **Ethnicity** (determined by `is_segregated` flag):
   - If `is_segregated` = true (default):
     - Patches with pxcor < 0 → ethnicity = 0 (red when visualized)
     - Patches with pxcor ≥ 0 → ethnicity = 1 (green when visualized)
   - If `is_segregated` = false (after pressing "desegregate" button):
     - Each patch independently: ethnicity = random(0 or 1) with equal probability

2. **Strategy**: Each patch independently receives strategy = random(0-8), with equal probability (1/9) for each strategy. This creates an initially random strategy distribution.

3. **Score, cooperated, defected**: All initialized to 0

4. **new_strategy**: Not explicitly initialized (will be set during first `evolve` call)

**Global variables:**

- `total_cooperated` = 0
- `total_defected` = 0
- `is_show_ethnicities` = false (display shows strategies initially)
- `is_segregated` = true (ethnicity pattern is segregated initially)
- Tick counter = 0 (via `reset-ticks`)

#### Parameter Values

Default values (set via interface sliders):

- `payoffs_cc` = 3 (mutual cooperation payoff)
- `payoffs_cd` = 0 (sucker's payoff)  
- `payoffs_dc` = 5 (temptation payoff)
- `payoffs_dd` = 1 (mutual defection payoff)
- `rounds_to_play` = 200
- `imitation_radius` = 1.5

These default payoffs create a prisoner's dilemma: DC > CC > DD > CD (5 > 3 > 1 > 0), satisfying the standard ordering where defection dominates but mutual cooperation is Pareto optimal.

#### Rationale

The segregated initial condition with random strategy distribution represents:
1. **Spatial segregation**: Models real-world ethnic residential segregation patterns
2. **Strategic diversity**: Allows all strategies to compete initially, avoiding bias toward particular outcomes
3. **Symmetric setup**: Both ethnic groups have identical initial conditions (same strategy distribution)

The payoff values are **Axelrod's classic parameters** from his influential prisoner's dilemma tournaments, facilitating comparison with established results in evolutionary game theory.

### 6. Input Data

The model does not use external data files or time-series inputs. All environmental conditions are static and determined by parameter settings. The model is **closed** in the sense that it does not import data during execution.

However, the model could be extended to:
- Import spatial configurations of ethnicity from empirical residential segregation data
- Read payoff matrices from data on inter-group interaction outcomes
- Import time-varying parameters representing policy interventions

Such extensions are not implemented in the current version.

---

### 7. Submodels

#### 7.1 Strategy Execution (Iterated Prisoner's Dilemma)

**Purpose**: Determine the payoff from a single iterated prisoner's dilemma game between two patches.

**Inputs**:
- `s1`: Integer (0-8) representing ego's strategy
- `s2`: Integer (0-8) representing alter's strategy
- `rounds_to_play`: Number of rounds to iterate
- Payoff parameters: `payoffs_cc`, `payoffs_cd`, `payoffs_dc`, `payoffs_dd`

**Process**:

For strategies 0-7 (standard reactive strategies):

1. **Determine first move**:
   - Extract first bit of strategy code (e.g., for strategy 6 = 110 binary, first bit = 1 → Cooperate)
   - Ego and alter simultaneously make first moves based on their strategy codes

2. **Iterate for remaining rounds** (rounds 2 through rounds_to_play):
   - Each agent responds to opponent's previous move according to strategy code
   - Strategy bits are indexed by opponent's previous action (0 = Defect, 1 = Cooperate)

3. **Calculate total payoff**:
   - Sum payoffs across all rounds based on action pairs
   - Ego's total payoff = Σ(payoff for each round's action combination)

For strategy 8 (PTFT):

1. **Check opponent ethnicity**:
   - If same ethnicity → ego plays as strategy 6 (TFT)
   - If different ethnicity → ego plays as strategy 0 (AllD)

2. Proceed as above with the substituted strategy

**Implementation details**:

The `payoff` procedure uses exhaustive case analysis. For each possible pairing of strategies (s1, s2), there is explicit code calculating:
- The cooperation count for ego (via `increment_cooperated`)
- The total payoff based on the known pattern of moves for that strategy pairing

This approach trades code length for computational efficiency and clarity about exactly what happens in each matchup.

**Example (both play TFT, strategy 6)**:
```
if (s1 = 6 and s2 = 6) 
  [ increment_cooperated (rounds_to_play)  
    report rounds_to_play * payoffs_cc ]
```
Both cooperate all rounds, so ego cooperates `rounds_to_play` times and gets payoffs_cc per round.

**Example (TFT vs AllD)**:
```
if (s1 = 6 and s2 = 0) 
  [ increment_cooperated (1)    
    report payoffs_cd + (rounds_to_play - 1) * payoffs_dd ]
```
TFT cooperates round 1 (gets suckered: payoffs_cd), then defects all remaining rounds (mutual defection: payoffs_dd).

#### 7.2 PTFT Conditional Strategy Execution

**Purpose**: Implement Parochial Tit-for-Tat, which conditions strategy on opponent ethnicity.

**Process**:

Two helper functions determine what strategy each agent actually plays:

**`my-strategy [x y]`** (determines ego's effective strategy):
```
IF strategy ≠ 8 THEN
  RETURN strategy
ELSE
  IF ethnicity = ethnicity of patch-at(x,y) THEN
    RETURN 6  ; play TFT with in-group
  ELSE
    RETURN 0  ; play AllD with out-group
  END IF
END IF
```

**`neighbor-strategy [x y]`** (determines neighbor's effective strategy):
```
IF strategy of patch-at(x,y) ≠ 8 THEN
  RETURN strategy of patch-at(x,y)
ELSE
  IF ethnicity of patch-at(x,y) = my ethnicity THEN
    RETURN 6  ; neighbor plays TFT with me
  ELSE
    RETURN 0  ; neighbor plays AllD with me
  END IF
END IF
```

These functions are called by `play-with [x y]` to get the effective strategies before looking up payoffs.

**Rationale**:

This design cleanly separates:
1. The nominal strategy assignment (what strategy number a patch carries)
2. The functional strategy execution (what the patch actually does in a specific interaction)

This allows PTFT to be represented as a discrete strategy type (like others) while enabling its ethnicity-conditional behavior.

#### 7.3 Score Calculation and Aggregation

**Purpose**: Calculate each patch's total payoff from all neighbor interactions.

**Process** (`play_with_neighbors` procedure):

```
FOR each patch p:
  p.score = 0
  p.cooperated = 0
  p.defected = 0
  
  FOR each neighbor direction (N, NE, E, SE, S, SW, W, NW):
    s1 = my-strategy(direction)
    s2 = neighbor-strategy(direction)
    payoff_value = payoff(s1, s2)
    p.score = p.score + payoff_value
  END FOR
END FOR
```

**Rationale**:

Scores are reset each tick because evolution operates generation-by-generation. Cumulative lifetime fitness is not tracked—only current-generation performance matters for imitation decisions. This matches the theoretical assumption that recent performance best predicts future performance.

The eight interactions with Moore neighbors ensure that:
- Patches in the interior have equal exposure to all neighbors
- Spatial clusters of similar strategies can form and persist
- The interaction topology matches the imitation topology (same neighbors)

#### 7.4 Strategy Evolution Through Imitation

**Purpose**: Implement the evolutionary dynamics by which successful strategies spread.

**Process** (`evolve` procedure):

```
FOR each patch p:
  neighbors_in_radius = all patches within distance imitation_radius of p
  fittest_neighbor = patch in neighbors_in_radius with maximum score
  
  IF p.score < fittest_neighbor.score THEN
    p.new_strategy = fittest_neighbor.strategy
  ELSE
    p.new_strategy = p.strategy
  END IF
END FOR

; After all patches have determined new_strategy:
FOR each patch p:
  p.strategy = p.new_strategy
END FOR
```

**Key Features**:

1. **Local information**: Only neighbors within `imitation_radius` are considered
2. **Best-take-all**: The single best neighbor is imitated (not proportional to performance)
3. **Conservative bias**: Patches never switch to a worse-performing strategy
4. **Synchronous update**: All patches evaluate based on current generation, then all update simultaneously

**Rationale**:

This implements a discrete-time version of the replicator dynamic from evolutionary game theory. In continuous time, strategy frequency changes proportional to relative fitness. Here, discrete agents copy the best local strategy, creating a spatial replicator dynamic.

The synchronous update prevents artifacts from update order and matches biological evolution where all organisms of a generation exist simultaneously before the next generation.

**Imitation Radius Effect**:

- `imitation_radius = 1`: Only immediate Moore neighbors (8 patches)
- `imitation_radius = 1.5`: Includes immediate neighbors plus some diagonal-adjacent patches (~24 patches)
- `imitation_radius = 2`: Includes two-step neighbors (larger neighborhood)

Larger radius increases evolutionary speed (information spreads faster) but may reduce diversity (global convergence more likely).

#### 7.5 Data Collection and Plotting

**Purpose**: Track and visualize population-level outcomes.

**Process**:

```
; Reset global counters
total_cooperated = 0
total_defected = 0

; Aggregate from all patches
FOR each patch p:
  total_cooperated = total_cooperated + p.cooperated
  total_defected = total_defected + p.defected
END FOR

; Update plots
PLOT "Strategies":
  FOR strategy_type = 0 to 8:
    count patches with strategy = strategy_type
  END FOR

PLOT "Behavior":
  total_cooperated (line 1)
  total_defected (line 2)
END PLOT
```

**Rationale**:

The "Strategies" plot shows **evolutionary dynamics**—which strategies are spreading or declining. Nine separate lines allow tracking of all strategy types simultaneously.

The "Behavior" plot shows **aggregate outcomes**—whether the population becomes more or less cooperative over time. This connects to the contact hypothesis: does integration lead to increased cooperation?

By tracking both strategies (the mechanism) and behavior (the outcome), the model allows analysis of *how* behavioral changes emerge from strategic evolution.

#### 7.6 Display Modes

**Purpose**: Visualize either ethnic composition or strategic composition.

**Process**:

```
IF is_show_ethnicities = true THEN
  FOR each patch p:
    IF p.ethnicity = 0 THEN p.color = red
    IF p.ethnicity = 1 THEN p.color = green
  END FOR
ELSE
  FOR each patch p:
    p.color = strategy-to-color(p.strategy)
  END FOR
END IF
```

**Color Mapping**:

Strategies (when `is_show_ethnicities` = false):
- 0 (AllD) = green
- 1 (001) = cyan
- 2 (STFT) = red
- 3 (011) = magenta
- 4 (100) = yellow
- 5 (101) = dark gray
- 6 (TFT) = light gray
- 7 (AllC) = blue
- 8 (PTFT) = light orange

Ethnicities (when `is_show_ethnicities` = true):
- 0 = red
- 1 = green

**Rationale**:

Two display modes serve different analytical purposes:
1. **Ethnicity view**: Shows whether spatial segregation/integration persists
2. **Strategy view**: Shows which strategies dominate and their spatial distribution

The color scheme for strategies uses distinct hues to make spatial clusters visually apparent. The ethnicity colors (red/green) are deliberately different from all strategy colors to avoid confusion when toggling between modes.

---

## IMPLEMENTATION NOTES

### Software Platform

- **Language**: NetLogo 7.0.3
- **Paradigm**: Agent-based modeling with patch-based agents
- **Key NetLogo Features Used**:
  - `patches-own`: Defines patch state variables
  - `ask patches`: Synchronous parallel agent actions
  - `patch-at`: Relative patch addressing for neighbor interaction
  - `in-radius`: Spatial queries for neighborhood selection
  - `max-one-of`: Aggregate query for identifying best neighbor
  - `ticks`/`reset-ticks`/`tick`: Discrete time management

### Code Structure

The code is organized into functional modules:

1. **Setup & Initialization** (`setup`, `init-patch`, `init-patch-counters`)
2. **Display & Visualization** (`display-agents`, `strategy-to-color`, `etchnicity-to-color`)
3. **Interaction & Game Playing** (`play_with_neighbors`, `play-with`, `payoff`)
4. **Strategy Execution** (`my-strategy`, `neighbor-strategy`)
5. **Evolution** (`evolve`)
6. **Data Collection** (`count-total-cooperated`, `my-update-plots`)
7. **User Controls** (`show_ethnicities`, `desegregate`)

### Performance Characteristics

- **Computational Complexity**: O(n) per tick where n = number of patches (4,225)
- **Each tick requires**:
  - 4,225 × 8 = 33,800 bilateral game lookups
  - 4,225 neighborhood searches (bounded by `imitation_radius`)
  - 4,225 strategy updates
- **Memory**: Modest—each patch stores 6-7 variables
- **Typical run time**: 100 ticks completes in seconds on modern hardware

---

## MODEL VALIDATION AND ANALYSIS

### Pattern Validation

The model successfully reproduces expected patterns:

1. **TFT Dominance in Homogeneous Conditions**: When all patches have same ethnicity, TFT (strategy 6) typically dominates, matching Axelrod's findings and Grim's spatial results.

2. **PTFT Emergence Under Segregation**: In segregated initial conditions, PTFT (strategy 8) often emerges and persists due to ability to cooperate with in-group while defending against out-group.

3. **Contact Effect**: When segregation is removed (via `desegregate` button), integration increases and universal cooperation (TFT) can displace parochial cooperation (PTFT), demonstrating prejudice reduction through contact.

4. **Spatial Clustering**: Successful strategies form visible spatial clusters, matching theoretical predictions about spatial evolutionary dynamics.

### Parameter Sensitivity

Key parameters affecting outcomes:

- **Payoff Structure**: Must maintain prisoner's dilemma ordering (DC > CC > DD > CD) for meaningful results. Varying magnitudes affects speed of evolution and stability of outcomes.

- **Imitation Radius**: Larger radius accelerates convergence and favors globally successful strategies; smaller radius maintains local diversity.

- **Rounds to Play**: More rounds increases payoff differences between strategies, making selection stronger. Fewer rounds adds noise.

- **Initial Segregation**: Determines whether PTFT or TFT is initially favored, profoundly affecting evolutionary trajectory.

### Theoretical Implications

The model demonstrates that:

1. **Cognitive Complexity Not Required**: Prejudice reduction can emerge from simple game-theoretic mechanisms without stereotype revision or friendship formation.

2. **Contact Matters Mechanistically**: Spatial integration directly affects which strategies succeed, providing a mechanistic explanation for the contact hypothesis.

3. **In-group Favoritism Can Be Stable**: PTFT is evolutionarily stable in segregated contexts, suggesting prejudice persists partly due to lack of contact.

4. **Spatial Structure Matters**: Results differ markedly from well-mixed (non-spatial) models, emphasizing importance of spatial structure in social dynamics.

---

## SUGGESTED EXPERIMENTS

### Experiment 1: Segregation Effects
- **Hypothesis**: PTFT dominates under segregation but not integration
- **Method**: Run 20 replications each with `is_segregated` = true vs. false
- **Measure**: Final prevalence of PTFT after 100 ticks
- **Expected**: Higher PTFT under segregation

### Experiment 2: Payoff Sensitivity
- **Hypothesis**: Larger cooperation advantage favors TFT
- **Method**: Vary `payoffs_cc` from 2 to 5 while holding others constant
- **Measure**: Time to TFT dominance and final TFT prevalence
- **Expected**: Higher `payoffs_cc` → faster, more complete TFT dominance

### Experiment 3: Radius Effects
- **Hypothesis**: Larger imitation radius reduces effect of initial segregation
- **Method**: Factorial design crossing `imitation_radius` (1.0, 1.5, 2.0, 2.5) with `is_segregated` (true/false)
- **Measure**: Final strategy distribution at tick 100
- **Expected**: Interaction effect—radius matters more when segregated

### Experiment 4: Rounds Effect
- **Hypothesis**: More rounds per game stabilizes TFT advantage
- **Method**: Vary `rounds_to_play` from 10 to 400 (geometric progression)
- **Measure**: TFT prevalence over time
- **Expected**: Diminishing returns—10→50 matters more than 200→400

---

## REFERENCES

Allport, G. W. (1954). *The Nature of Prejudice*. Reading, MA: Addison-Wesley.

Axelrod, R. (1984). *The Evolution of Cooperation*. New York: Basic Books.

Grim, P. (1995). The Greater Generosity of the Spatialized Prisoner's Dilemma. *Journal of Theoretical Biology*, 173, 353-359.

Grim, P. (1996). Spatialization and Greater Generosity in the Stochastic Prisoner's Dilemma. *BioSystems*, 37, 3-17.

Grim, P., Mar, G., & St. Denis, P. (1998). *The Philosophical Computer: Exploratory Essays in Philosophical Computer Modeling*. Cambridge, MA: MIT Press.

Grim, P., Selinger, E., Braynen, W., Rosenberger, R., Au, R., Louie, N., & Connolly, J. (2005). Modeling Prejudice Reduction: Spatialized Game Theory and the Contact Hypothesis. *Public Affairs Quarterly*, 19(2), 95-125.

Grimm, V., Berger, U., Bastiansen, F., Eliassen, S., Ginot, V., Giske, J., ... & DeAngelis, D. L. (2006). A Standard Protocol for Describing Individual-Based and Agent-Based Models. *Ecological Modelling*, 198(1-2), 115-126.

Grimm, V., Berger, U., DeAngelis, D. L., Polhill, J. G., Giske, J., & Railsback, S. F. (2010). The ODD Protocol: A Review and First Update. *Ecological Modelling*, 221(23), 2760-2768.

Grimm, V., Railsback, S. F., Vincenot, C. E., Berger, U., Gallagher, C., DeAngelis, D. L., ... & Ayllón, D. (2020). The ODD Protocol for Describing Agent-Based and Other Simulation Models: A Second Update to Improve Clarity, Replication, and Structural Realism. *Journal of Artificial Societies and Social Simulation*, 23(2), 7.

Nowak, M. A., & May, R. M. (1992). Evolutionary Games and Spatial Chaos. *Nature*, 359(6398), 826-829.

---

## APPENDIX: PSEUDOCODE SUMMARY

### Main Loop
```
PROCEDURE go():
  FOR each patch p:
    p.play_with_neighbors()
  END FOR
  
  FOR each patch p:
    p.evolve()
  END FOR
  
  FOR each patch p:
    p.strategy = p.new_strategy
  END FOR
  
  display_agents()
  collect_and_plot_data()
  tick++
END PROCEDURE
```

### Strategy Execution
```
FUNCTION payoff(s1, s2, rounds):
  IF s1 = PTFT:
    s1_effective = (same_ethnicity ? TFT : AllD)
  END IF
  
  IF s2 = PTFT:
    s2_effective = (same_ethnicity ? TFT : AllD)
  END IF
  
  RETURN lookup_table[s1_effective][s2_effective] * rounds
END FUNCTION
```

### Evolution
```
PROCEDURE evolve():
  neighbors = patches_in_radius(imitation_radius)
  best = argmax(neighbor.score for neighbor in neighbors)
  
  IF my.score < best.score:
    my.new_strategy = best.strategy
  ELSE:
    my.new_strategy = my.strategy
  END IF
END PROCEDURE
```

---

**END OF ODD DOCUMENTATION**