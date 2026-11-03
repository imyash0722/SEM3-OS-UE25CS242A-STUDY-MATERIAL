# Topic 22 (Detailed): NUMA, Memory Locality & Enhanced Clock Replacement

**Source**: Lecture 3.8 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 22.1 NUMA (Non-Uniform Memory Access) Architecture

### The Problem: UMA Doesn't Scale

```
UMA (Uniform Memory Access):
        CPU 0          CPU 1          CPU 2          CPU 3
          │              │              │              │
          └──────────────┼──────────────┼──────────────┘
                         ▼
              ┌───────────────────┐
              │   SHARED MEMORY   │  (Single bus, uniform latency)
              └───────────────────┘

Problem: Bus contention → latency increases with CPU count
```

### NUMA Solution

```
NUMA (Non-Uniform Memory Access):
         NODE 0                          NODE 1
    ┌──────────────────┐           ┌──────────────────┐
    │  CPU 0  CPU 1    │           │  CPU 2  CPU 3    │
    │       │          │           │       │          │
    │  ┌────┴────┐     │           │  ┌────┴────┐     │
    │  │ LOCAL   │     │  INTERCONNECT  │ LOCAL   │     │
    │  │  MEM    │     │                │  MEM    │     │
    │  └─────────┘     │                └─────────┘     │
    └──────────────────┘           └──────────────────┘

Local access:  ~100ns (direct on node's bus)
Remote access: ~200-400ns (traverse interconnect)
```

### Key Characteristics

| Aspect | UMA | NUMA |
|--------|-----|------|
| Memory latency | Uniform | Varies by CPU-memory distance |
| Scalability | Limited (~8-16 CPUs) | High (64+ CPUs) |
| Programming model | Simple | Requires NUMA awareness |
| OS support | Standard | NUMA-aware scheduler/allocator |

---

## 22.2 Memory Locality & First-Touch Policy

### First-Touch Policy

```
When a page is first WRITTEN (not just allocated):
1. OS allocates physical frame on the CURRENT NODE
2. Page stays on that node unless migrated

Example:
Process on Node 0 calls malloc(100MB)
  → Pages marked "not present"
Process writes to page 0 on Node 0
  → Page fault → allocated on Node 0
Process migrates to Node 1, writes to page 1
  → Page fault → allocated on Node 1
```

### Code Example: First-Touch Matters

```c
// BAD: All memory allocated on master thread's node
double *array = malloc(N * sizeof(double));
#pragma omp parallel for
for (int i = 0; i < N; i++) {
    array[i] = 0.0;  // All pages allocated on master's node!
}

// GOOD: Each thread touches its own pages
double *array = malloc(N * sizeof(double));
#pragma omp parallel for
for (int i = 0; i < N; i++) {
    array[i] = 0.0;  // Each thread's pages allocated on its node
}
```

### NUMA-Aware Allocation APIs (Linux)

```c
#include <numa.h>
#include <numaif.h>

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

---

## 22.3 NUMA-Aware Scheduler

### Goals
1. **Prefer local memory** — Keep processes on nodes where their memory resides
2. **Balance load** — Don't overload one node while others idle
3. **Minimize migrations** — Moving processes is expensive (cache cold, remote memory)

### Scheduler Policies

```
Linux CFS NUMA Balancing:
1. Task NUMA group tracking
   - Track which nodes a task's memory is on
   - Periodic NUMA hinting faults to detect access patterns

2. Load balancing with NUMA cost
   - Calculate "imbalance" including remote memory penalty
   - Prefer same-node migration
   - Cross-node only for severe imbalance

3. Wake-up affinity
   - Wake task on same node as waker (shared data likely)
   - Or on node where task's memory resides
```

### NUMA Statistics

```bash
# Show NUMA topology
numactl --hardware

# Show memory policy
numactl --show

# Per-node memory usage
cat /sys/devices/system/node/node*/meminfo

# NUMA statistics
numastat -p <pid>
```

---

## 22.4 Clock Page Replacement — Complete Implementation

### Basic Clock (Second-Chance)

```
Data Structure:
┌─────────────────────────────────────────────────────┐
│  Circular list of frames with reference bit (R)    │
│                                                     │
│  Frame 0: Page 5, R=1  ← hand                      │
│  Frame 1: Page 2, R=0                               │
│  Frame 2: Page 7, R=1                               │
│  Frame 3: Page 1, R=0                               │
│  Frame 4: Page 9, R=1                               │
└─────────────────────────────────────────────────────┘

Algorithm:
1. Hand points to next frame to examine
2. If R=0 → VICTIM (replace)
3. If R=1 → R=0 (second chance), advance hand
4. Repeat until victim found
```

### Clock State Machine

```
Frame States:
┌─────────┐     Reference bit=1     ┌─────────┐
│ (R=0)   │ ─────────────────────►  │ (R=1)   │
│ Victim  │                         │ Safe    │
└─────────┘                         └────┬────┘
                                         │
                    Clock sweep          │
                    (hand passes)        │
                                         ▼
                                   ┌─────────┐
                                   │ (R=0)   │
                                   │ Second  │
                                   │ chance! │
                                   └─────────┘
```

---

## 22.5 Enhanced Clock (With Dirty Bit)

### 4 Priority Classes

| Priority | (Ref, Dirty) | Name | Action |
|----------|--------------|------|--------|
| **1 (Best)** | (0, 0) | Clean, unreferenced | Replace immediately (no I/O) |
| **2** | (0, 1) | Dirty, unreferenced | Write to disk, then replace |
| **3** | (1, 0) | Referenced, clean | Clear R, give second chance |
| **4 (Worst)** | (1, 1) | Referenced, dirty | Clear R, give second chance |

### Multi-Pass Algorithm

```
Pass 1: Scan for (0,0) — replace immediately if found
Pass 2: Scan for (0,1) — clear R, advance; if completes → write dirty, replace
Pass 3: Scan for (1,0) — clear R, advance
Pass 4: Scan for (1,1) — clear R, advance
Repeat from Pass 1
```

### Why (0,0) First?
- **No disk write needed** → fastest replacement
- **Clean page** → can be overwritten immediately
- **Unreferenced** → unlikely to be needed soon

### Why (1,1) Last?
- **Recently used** → likely to be used again
- **Modified** → requires disk write before replacement
- **Maximum cost to replace**

---

## 22.6 Complete Enhanced Clock Implementation

```c
/*
 * File: enhanced_clock.c
 * Complete Enhanced Clock with 4-pass algorithm
 * Compile: gcc -o enhanced_clock enhanced_clock.c
 */

#include <stdio.h>
#include <stdlib.h>

#define MAX_FRAMES 10

typedef struct {
    int page;        // Page number (-1 = empty)
    int ref_bit;     // Reference bit (R)
    int dirty_bit;   // Dirty bit (D)
} Frame;

Frame frames[MAX_FRAMES];
int n_frames;
int hand = 0;

// Priority: (R,D) pairs in order of preference
// Pass 0: (0,0) - best
// Pass 1: (0,1)
// Pass 2: (1,0)
// Pass 3: (1,1) - worst

int find_victim() {
    for (int pass = 0; pass < 4; pass++) {
        int start_hand = hand;
        bool found = false;
        
        do {
            int r = frames[hand].ref_bit;
            int d = frames[hand].dirty_bit;
            bool match = false;
            
            // Check if this frame matches current pass priority
            if (pass == 0 && r == 0 && d == 0) match = true;
            else if (pass == 1 && r == 0 && d == 1) match = true;
            else if (pass == 2 && r == 1 && d == 0) match = true;
            else if (pass == 3 && r == 1 && d == 1) match = true;
            
            if (match) {
                // Victim found!
                int victim = hand;
                hand = (hand + 1) % n_frames;
                return victim;
            } else {
                // Not a match - clear reference bit, advance hand
                frames[hand].ref_bit = 0;
                hand = (hand + 1) % n_frames;
            }
        } while (hand != start_hand);
    }
    
    // Should never reach here (pass 3 always matches)
    int victim = hand;
    hand = (hand + 1) % n_frames;
    return victim;
}

void access_page(int page, int is_write) {
    // Check if page already in memory
    for (int i = 0; i < n_frames; i++) {
        if (frames[i].page == page) {
            // HIT
            frames[i].ref_bit = 1;
            if (is_write) frames[i].dirty_bit = 1;
            printf("Hit: Page %d (R=%d, D=%d)\n", page, frames[i].ref_bit, frames[i].dirty_bit);
            return;
        }
    }
    
    // PAGE FAULT
    printf("Fault: Page %d\n", page);
    
    // Find free frame
    for (int i = 0; i < n_frames; i++) {
        if (frames[i].page == -1) {
            frames[i].page = page;
            frames[i].ref_bit = 1;
            frames[i].dirty_bit = is_write ? 1 : 0;
            printf("  Loaded into free frame %d (R=%d, D=%d)\n", i, frames[i].ref_bit, frames[i].dirty_bit);
            return;
        }
    }
    
    // Need replacement - use enhanced clock
    int victim = find_victim();
    
    if (frames[victim].dirty_bit) {
        printf("  [DISK WRITE] Frame %d (page %d) was dirty\n", victim, frames[victim].page);
    }
    
    frames[victim].page = page;
    frames[victim].ref_bit = 1;
    frames[victim].dirty_bit = is_write ? 1 : 0;
    printf("  Replaced frame %d with page %d (R=%d, D=%d)\n", victim, page, frames[victim].ref_bit, frames[victim].dirty_bit);
}

void print_frames() {
    printf("Frames: ");
    for (int i = 0; i < n_frames; i++) {
        if (frames[i].page == -1) printf("[empty] ");
        else printf("[P%d R%d D%d] ", frames[i].page, frames[i].ref_bit, frames[i].dirty_bit);
    }
    printf("  (hand=%d)\n", hand);
}

int main() {
    // Reference string from slides
    int refs[] = {1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5};
    int n_refs = 12;
    
    n_frames = 3;
    for (int i = 0; i < n_frames; i++) frames[i].page = -1;
    
    printf("=== Enhanced Clock (3 frames) ===\n");
    printf("Reference string: ");
    for (int i = 0; i < n_refs; i++) printf("%d ", refs[i]);
    printf("\n\n");
    
    for (int i = 0; i < n_refs; i++) {
        access_page(refs[i], 0); // All reads for simplicity
        print_frames();
    }
    
    return 0;
}
```

---

## 22.7 NUMA + Page Replacement Interaction

### Challenge: Page Replacement Across NUMA Nodes

```
Problem:
- Page replacement chooses victim globally
- Victim might be on remote node
- Evicting remote page = remote disk I/O (slow)
- Allocating replacement page on local node = good

Solution: NUMA-aware page replacement
1. Prefer local victims
2. If no local victim, consider remote with penalty
3. Allocate replacement on requesting node
```

### Linux Implementation

```c
// Linux uses per-zone LRU lists
// Each NUMA node has its own LRU lists
// kswapd runs per node
// Global direct reclaim considers NUMA distance

// Zone structure:
struct zone {
    struct lruvec lruvec;        // Per-zone LRU
    struct zone_reclaim_stat reclaim_stat;
    nodemask_t *reclaim_nodes;   // Nodes allowed for reclaim
};
```

### Migrate-on-Fault

```
When process on Node 0 accesses page on Node 1:
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

## 22.8 Complete Exam-Focused Summary

| Concept | Key Points |
|---------|------------|
| **NUMA** | Local memory ~100ns, remote ~200-400ns |
| **First-touch** | Page allocated on node where first written |
| **NUMA scheduler** | Prefers same-node migration; cross-node for severe imbalance |
| **Clock Algorithm** | Circular + R bit; R=1→set 0, advance; R=0→replace |
| **Enhanced Clock** | 4 passes by (R,D): (0,0)>(0,1)>(1,0)>(1,1) |
| **Pass 0: (0,0)** | Best - no I/O needed |
| **Pass 3: (1,1)** | Worst - recently used + dirty |
| **Linux** | Uses enhanced clock variant |
| **NUMA + page replacement** | Prefer local victims; allocate on requesting node |

---

## 22.9 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **NUMA local vs remote** | Local on CPU's local bus, lower latency |
| **First-touch policy** | Page allocated on node where first written |
| **Clock: ref=1** | Reset to 0, advance hand |
| **Clock: ref=0** | Replace (victim) |
| **Enhanced Clock priority** | (0,0) > (0,1) > (1,0) > (1,1) |
| **(0,0) first** | No write-back needed |
| **(1,1) last** | Recently used + dirty = expensive to replace |
| **Linux page replacement** | Enhanced clock variant |

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

*All 22 detailed topics complete! Ready for compilation into final study guide.*