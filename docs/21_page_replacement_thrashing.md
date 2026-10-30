# Topic 21: Page Replacement, Frame Allocation, Thrashing

**Source**: Lecture 3.7 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 21.1 Page Replacement Algorithms

| Algorithm | Victim Selection | Belady's Anomaly? | Hardware Support / Overhead |
|-----------|------------------|-------------------|----------------------------|
| **FIFO** | Oldest loaded page | **Yes** | Simple circular queue; very low overhead |
| **Optimal (OPT)** | Page not used for longest future time | **No** (Stack algorithm) | Impossible in practice (benchmark only) |
| **LRU** | Page not used for longest past time | **No** (Stack algorithm) | Counters or stack; high hardware overhead |
| **Clock (Second Chance)** | First page with reference bit = 0 | No | 1 reference bit per frame; low overhead LRU approx |
| **Enhanced Clock** | (ref, dirty) = (0,0) best, (0,1), (1,0), (1,1) worst | No | 2 bits per frame |
| **LFU/MFU** | Least/Most Frequently Used | No | Counters per frame |

### Belady's Anomaly (FIFO)
Increasing frame allocation → **page faults increase**
- Example string: `1,2,3,4,1,2,5,1,2,3,4,5`
- 3 frames = 9 faults, 4 frames = 10 faults

### Stack Algorithms (LRU & Optimal)
The set of pages in memory for n frames is always a subset of pages for n+1 frames.
→ **LRU and Optimal NEVER suffer from Belady's Anomaly**

---

## 21.2 Frame Allocation

| Strategy | Description |
|----------|-------------|
| **Equal** | Frames / processes |
| **Proportional** | By process size: aᵢ = (sᵢ / S) × m |
| **Priority** | High-priority gets more |
| **Working Set Model** | Pages actively used in recent Δ time |

### Example: Proportional Allocation
- 62 frames, P1 (10 pages), P2 (127 pages)
- P1 gets: (10/137) × 62 ≈ 4.5 frames

---

## 21.3 Thrashing

### Definition
High paging activity where CPU spends more time swapping than executing.

### Cause
```
Sum of working-set sizes > Total Physical Memory
Σ WSSᵢ > D
```

### Detection
- CPU utilization drops while disk I/O high
- Page fault rate spikes

### Solutions
1. **Working Set Model** — keep working set in memory
2. **Page Fault Frequency (PFF)** — dynamic frame allocation based on fault rate

---

## 21.4 Working Set Model

### Principle
Based on **Locality of Reference** (spatial + temporal):
- Processes execute within clusters of localized pages (routines, loops, local data)
- Define **Working Set Window (Δ)**: pages referenced in last Δ time units
- Keep working set in memory → prevent thrashing

---

## 21.5 Page Fault Frequency (PFF) Strategy

- Establish **upper and lower page fault rate bounds**
- If process rate > upper bound → grant more frames
- If process rate < lower bound → revoke frames
- Directly monitors fault rate, dynamically adjusts allocation

---

## 21.6 Global vs Local Replacement

| Policy | Behavior | Risk |
|--------|----------|------|
| **Global** | Victim from any process | One bad process steals frames → system-wide thrashing |
| **Local** | Victim from faulting process only | Isolates thrashing to one process |

---

## 21.7 Key Takeaways

1. **FIFO** = Belady's Anomaly YES; **LRU/OPT** = Belady's Anomaly NO (stack algorithms)
2. **Clock/Second-Chance** = circular queue + reference bit; approximates LRU
3. **Enhanced Clock** = (ref, dirty) priority: (0,0) > (0,1) > (1,0) > (1,1)
4. **Frame Allocation**: Equal, Proportional, Priority, Working Set
5. **Thrashing** = Σ WSSᵢ > D; detected by high paging + low CPU
6. **Working Set** = pages referenced in last Δ time; based on locality
7. **PFF** = upper/lower fault rate bounds → dynamic frame adjustment
8. **Global replacement** = thrashing contagion risk; **Local** = isolates

---

## 21.8 Exam-Relevant MCQ Patterns

- **Q89**: Belady's Anomaly string → 3 frames=9 faults, 4 frames=10 faults
- **Q90**: Optimal replacement = page not used for longest future time
- **Q91**: LRU/OPT immune to Belady's = stack algorithms (n frames ⊂ n+1 frames)
- **Q92**: Stack algorithm definition = n-frame set ⊂ (n+1)-frame set
- **Q93**: Clock algorithm — ref=1 → reset to 0, advance hand; ref=0 → replace
- **Q94**: Enhanced Clock — (0,0) highest priority (no write-back needed)
- **Q95**: Proportional allocation = (size/S) × total_frames
- **Q96**: Global replacement risk = one process steals frames → thrashing
- **Q97**: Thrashing cause = Σ WSSᵢ > D
- **Q98**: Working Set principle = Locality of Reference
- **Q99**: PFF strategy = upper/lower fault rate bounds → grant/revoke frames