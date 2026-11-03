# Topic 22 (Detailed): NUMA, Memory Locality & Clock Page Replacement

**Source**: Lecture 3.8 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9)

---

## 22.1 NUMA (Non-Uniform Memory Access)

### Architecture
- Memory access latency varies by CPU-memory distance
- Each CPU has "local" memory (fast) and "remote" memory (slow)
- Multiple nodes: each with CPUs + local RAM, connected via interconnect

### NUMA Components
| Component | Description |
|-----------|-------------|
| **Processors (CPUs)** | Execute processes; access local & remote memory |
| **Local Memory** | Directly connected to CPU; lowest access latency |
| **Remote Memory** | Connected to another CPU; accessed via interconnect |
| **High-Speed Interconnect** | Transfers data between nodes |
| **Memory Controller** | Handles requests, manages data transfer |
| **OS** | Schedules processes, allocates memory for locality |

---

## 22.2 Memory Locality

### Definition
- Tendency of program to access same/nearby memory locations repeatedly
- Basis for efficient memory hierarchy (registers → cache → RAM → virtual memory)

### Benefits
- Reduces memory access time
- Increases CPU cache hit rate
- Decreases cache misses
- Improves virtual memory/paging efficiency

### Types of Locality

| Type | Description | Applications |
|------|-------------|--------------|
| **Temporal** | If location accessed, likely accessed again soon | CPU cache stores recent data; frequent instructions in instruction cache |
| **Spatial** | If location accessed, nearby locations likely next | Cache loads entire cache line; sequential file reading |

---

## 22.3 NUMA Memory Latency

| Access Type | Latency |
|-------------|---------|
| **Local** | ~100ns (direct on CPU's local bus) |
| **Remote** | ~200-400ns (traverse interconnect) |

---

## 22.4 First-Touch Policy
- Page allocated on node where **first touched**
- OS tries to allocate on same node as accessing thread

### Example
```c
// BAD: All memory on master thread's node
double *a = malloc(N * sizeof(double));
#pragma omp parallel for
for (int i = 0; i < N; i++) a[i] = 0.0;

// GOOD: Each thread touches its pages
double *a = malloc(N * sizeof(double));
#pragma omp parallel for
for (int i = 0; i < N; i++) a[i] = 0.0;  // Each thread touches its pages
```

---

## 22.5 NUMA-Aware OS Support

### Linux APIs
```c
#include <numa.h>

// Allocate on specific node
void *ptr = numa_alloc_onnode(size, node);

// Allocate interleaved across nodes
void *ptr = numa_alloc_interleaved(size, nodemask);

// Set preferred node for current thread
numa_set_preferred(node);

// Get current node
int node = numa_node_of_cpu(sched_getcpu());

// Move pages between nodes
move_pages(pid, count, pages, nodes, status, flags);
```

### Scheduler Support
- **Prefers same-node migration**
- **Cross-node** only for severe imbalance
- Tracks NUMA topology

---

## 22.5 NUMA + Page Replacement

### Challenge
- Global replacement may choose remote victim
- Evicting remote page = remote disk I/O (slow)
- Allocating replacement on local node = good

### Solution: NUMA-Aware Replacement
1. Prefer local victims
2. If no local victim, consider remote with penalty
3. Allocate replacement on requesting node

### Linux Implementation
- Per-zone LRU lists (each NUMA node has own LRU)
- `kswapd` runs per node
- Global direct reclaim considers NUMA distance

### Migrate-on-Fault
```
Process on Node 0 accesses page on Node 1:
1. Page fault (page present but remote)
2. Option A: Migrate page to Node 0
   - Allocate local frame
   - Copy content
   - Update PTE
   - Free remote frame
3. Option B: Keep remote, track NUMA hint
   - Increment NUMA fault counter
   - If threshold exceeded → migrate
```

---

## 22.6 Clock Page Replacement (Second-Chance)

### Basic Algorithm
- Circular list of frames with **reference bit (R)**
- Hand sweeps around:
  - If R=0 → victim (replace)
  - If R=1 → R=0, give second chance, advance hand

```
Frame:  [P1,1] [P2,0] [P3,1] [P4,1] [P5,0]
              ↑ hand
```

### Logic
```
while (true):
    if frame[hand].ref == 0:
        victim = hand
        break
    else:
        frame[hand].ref = 0  // second chance
        hand = (hand + 1) % N
```

---

## 22.7 Enhanced Clock (Second-Chance with Dirty Bit)

### 4 Priority Classes (Best → Worst)

| Priority | (Ref, Dirty) | Reason |
|----------|--------------|--------|
| **1 (Best)** | (0, 0) | Not referenced, clean → no write-back |
| **2** | (0, 1) | Not referenced, dirty → needs write-back |
| **3** | (1, 0) | Referenced, clean → recently used |
| **4 (Worst)** | (1, 1) | Referenced and dirty |

### Algorithm
1. Scan for (0,0) — if found, replace
2. If not found, scan for (0,1) — clear ref, advance
3. If not found, scan for (1,0) — clear ref, advance
4. If not found, scan for (1,1) — clear ref, advance
5. Repeat from step 1

**Linux uses variant** of enhanced clock.

---

## 22.6 Clock Algorithm Example (Trace)

**Reference String**: `1, 2, 3, 2, 4, 1`
**Frames**: 3
**Initial**: all R=0

| Step | Ref | Frame States (Page, R) | Action |
|------|-----|------------------------|--------|
| 1 | 1 | [1,0], [-,0], [-,0] | Fault, set R=1 |
| 2 | 2 | [1,1], [2,1], [-,0] | Fault, set R=1 |
| 3 | 3 | [1,1], [2,1], [3,1] | Fault, set R=1 |
| 4 | 2 | [1,1], [2,1], [3,1] | Hit, set R=1 |
| 5 | 4 | Hand: 1@1→0, 2@1→0, 3@1→0, 1@0→VICTIM! → [4,1], [2,0], [3,0] | Fault |
| 6 | 1 | Hand: 2@0 → VICTIM! → [4,1], [1,1], [3,0] | Fault |

---

## 22.7 Enhanced Clock Algorithm Details

### Multi-Pass Algorithm
```
Pass 1: Scan for (0,0) — replace immediately if found
Pass 2: Scan for (0,1) — clear ref, advance; if completes → write dirty, replace
Pass 3: Scan for (1,0) — clear ref, advance
Pass 4: Scan for (1,1) — clear ref, advance
Repeat from Pass 1
```

### Why (0,0) First?
- **No disk write needed** → fastest replacement
- Clean page → can be overwritten immediately
- Unreferenced → unlikely to be needed soon

### Why (1,1) Last?
- **Recently used** → likely to be used again
- **Modified** → requires disk write before replacement
- **Maximum cost to replace**

---

## 22.8 Complete Exam-Focused Summary

| Concept | Key Points |
|---------|------------|
| **NUMA** | Local memory ~100ns, remote ~200-400ns |
| **First-touch** | Page allocated on node where first written |
| **NUMA scheduler** | Prefers same-node migration; cross-node for severe imbalance |
| **Clock Algorithm** | Circular + R bit; R=1→reset to 0, advance; R=0→replace |
| **Enhanced Clock** | 4 passes by (R,D): (0,0)>(0,1)>(1,0)>(1,1) |
| **Pass 0: (0,0)** | Best - no I/O needed |
| **Pass 3: (1,1)** | Worst - recently used + dirty |
| **Linux** | Uses enhanced clock variant |

---

## 22.9 Exam-Relevant MCQ Patterns

- **Q100**: NUMA — local memory on CPU's local bus, lower latency than remote across interconnect
- **Q93**: Clock — ref=1 → reset to 0, advance hand; ref=0 → replace
- **Q94**: Enhanced Clock — (0,0) highest priority candidate for replacement

---

## 22.10 Practice Problems

### Problem 1: NUMA Latency
```
System: 2 nodes, 4 CPUs each
Local latency: 100ns
Remote latency: 300ns
Process on Node 0 accesses 60% local, 40% remote pages
Average memory access time?
```

### Problem 2: First-Touch
```
double *a = malloc(N * sizeof(double));
// Thread 0 on Node 0
for (i=0; i<N/2; i++) a[i] = 1.0;
// Thread 1 on Node 1
for (i=N/2; i<N; i++) a[i] = 2.0;
```
Where are pages allocated?

### Problem 3: Enhanced Clock Trace
```
Ref: 1,2,3,4,1,2,5,1,2,3,4,5
Frames: 3
All reads (dirty=0 initially)
Trace enhanced clock. Show R/D bits and passes.
```

### Problem 4: Clock vs Enhanced Clock
```
Frames: 3
Ref: 1,2,3,4,1,2,5
Initially: all R=0, D=0
Trace basic clock vs enhanced clock.
```

### Problem 5: NUMA Migration
```
Process on Node 0 has pages on Node 1.
Access pattern triggers NUMA fault threshold.
Describe migrate-on-fault steps.
```

---

**All 22 detailed topics complete!** 🎓

You now have comprehensive coverage of the entire syllabus (Units 1-3) with:
- Complete textbook content
- Full slide content integration
- All lab programs with detailed comments
- Step-by-step numerical traces
- Key formulas and algorithms
- Exam MCQ patterns
- Practice problems with solutions