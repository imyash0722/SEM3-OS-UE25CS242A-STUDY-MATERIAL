# Topic 21 (Detailed): Page Replacement, Frame Allocation, Thrashing

**Source**: Lecture 3.7 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 21.1 Page Replacement Problem

When page fault occurs and no free frames exist, OS must choose a **victim frame** to evict.

```
Page Fault → No free frames → Choose victim → Write if dirty → Read new page → Update PTE → Restart
```

**Goal**: Minimize page faults.

---

## 21.2 Reference String Example

We'll trace all algorithms on this string (from slides):

```
Reference String: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1
```

---

## 21.3 FIFO (First-In, First-Out)

### Algorithm
- Circular queue of frames
- Victim = oldest loaded page
- Simple pointer: `victim = (victim + 1) % num_frames`

### Trace: 3 Frames

| Ref | Frames (oldest→newest) | Fault? |
|-----|------------------------|--------|
| 7   | [7]                    | ✅     |
| 0   | [7, 0]                 | ✅     |
| 1   | [7, 0, 1]              | ✅     |
| 2   | [2, 0, 1] ←evict 7     | ✅     |
| 0   | [2, 0, 1]              | ❌     |
| 3   | [2, 3, 1] ←evict 0     | ✅     |
| 0   | [2, 3, 0] ←evict 1     | ✅     |
| 4   | [2, 3, 4] ←evict 0     | ✅     |
| 2   | [2, 3, 4]              | ❌     |
| 3   | [2, 3, 4]              | ❌     |
| 0   | [0, 3, 4] ←evict 2     | ✅     |
| 3   | [0, 3, 4]              | ❌     |
| 2   | [0, 2, 4] ←evict 3     | ✅     |
| 1   | [0, 2, 1] ←evict 4     | ✅     |
| 2   | [0, 2, 1]              | ❌     |
| 0   | [0, 2, 1]              | ❌     |
| 1   | [0, 2, 1]              | ❌     |
| 7   | [7, 2, 1] ←evict 0     | ✅     |
| 0   | [7, 0, 1] ←evict 2     | ✅     |
| 1   | [7, 0, 1]              | ❌     |

**Total Faults: 9**

---

## 21.4 Belady's Anomaly (FIFO)

**Increasing frame allocation → page faults increase!**

**Reference String**: `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`

| Frames | Faults |
|--------|--------|
| 3      | 9      |
| 4      | 10     |

**FIFO suffers from Belady's Anomaly**

---

## 21.5 Optimal (OPT / MIN)

### Algorithm
- Replace page **not used for longest time in future**
- **Theoretical benchmark** (impossible in practice)

### Trace: 3 Frames

| Ref | Future Refs | Frames | Fault? | Reason |
|-----|-------------|--------|--------|--------|
| 7   | 0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 | [7] | ✅ | |
| 0   | 1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 | [7,0] | ✅ | |
| 1   | 2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 | [7,0,1] | ✅ | |
| 2   | 0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 | [2,0,1] ←evict 7 | ✅ | 7 used at pos 17 |
| 0   | 3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 | [2,0,1] | ❌ | Hit |
| 3   | 0,4,2,3,0,3,2,1,2,0,1,7,0,1 | [3,0,1] ←evict 2 | ✅ | 2 used at pos 8 |
| 0   | 4,2,3,0,3,2,1,2,0,1,7,0,1 | [3,0,1] | ❌ | Hit |
| 4   | 2,3,0,3,2,1,2,0,1,7,0,1 | [3,4,1] ←evict 0 | ✅ | 0 used at pos 10 |
| 2   | 3,0,3,2,1,2,0,1,7,0,1 | [3,4,2] ←evict 1 | ✅ | 1 used at pos 15 |
| 3   | 0,3,2,1,2,0,1,7,0,1 | [3,4,2] | ❌ | Hit |
| 0   | 3,2,1,2,0,1,7,0,1 | [3,0,2] ←evict 4 | ✅ | 4 used at pos 18 |
| 3   | 2,1,2,0,1,7,0,1 | [3,0,2] | ❌ | Hit |
| 2   | 1,2,0,1,7,0,1 | [3,0,2] | ❌ | Hit |
| 1   | 2,0,1,7,0,1 | [3,1,2] ←evict 0 | ✅ | 0 used at pos 11 |
| 2   | 0,1,7,0,1 | [3,1,2] | ❌ | Hit |
| 0   | 1,7,0,1 | [3,1,0] ←evict 2 | ✅ | 2 used at pos 12 |
| 1   | 7,0,1 | [3,1,0] | ❌ | Hit |
| 7   | 0,1 | [7,1,0] ←evict 3 | ✅ | 3 used at pos 19 |
| 0   | 1 | [7,1,0] | ❌ | Hit |
| 1   | (none) | [7,1,0] | ❌ | Hit |

**Total Faults: 7** (optimal)

---

## 21.6 LRU (Least Recently Used)

### Algorithm
- Replace page **not used for longest time in past**
- **Stack algorithm** → immune to Belady's Anomaly

### Implementation Methods
| Method | Description |
|--------|-------------|
| **Counters** | Timestamp on each access; victim = oldest timestamp |
| **Stack** | Move referenced page to top; victim = bottom |

### Trace: 3 Frames (Using Timestamps)

| Time | Ref | Frames (ts) | Fault? | Action |
|------|-----|-------------|--------|--------|
| 1    | 7   | [7@1]       | ✅     | |
| 2    | 0   | [7@1, 0@2]  | ✅     | |
| 3    | 1   | [7@1, 0@2, 1@3] | ✅ | |
| 4    | 2   | [2@4, 0@2, 1@3] ←evict 7@1 | ✅ | 7 oldest (t=1) |
| 5    | 0   | [2@4, 0@5, 1@3] ←evict 0@2→0@5 | ✅ | 0 was t=2 |
| 6    | 3   | [2@4, 0@5, 3@6] ←evict 1@3 | ✅ | 1 oldest (t=3) |
| 7    | 0   | [2@4, 0@7, 3@6] ←0@5→0@7 | ❌ | Hit |
| 8    | 4   | [2@4, 0@7, 4@8] ←evict 3@6 | ✅ | 3 oldest (t=6) |
| 9    | 2   | [2@9, 0@7, 4@8] ←2@4→2@9 | ❌ | Hit |
| 10   | 3   | [3@10, 0@7, 4@8] ←evict 2@4 | ✅ | 2 oldest (t=4) |
| 11   | 0   | [3@10, 0@11, 4@8] | ❌ | Hit |
| 12   | 3   | [3@12, 0@11, 4@8] | ❌ | Hit |
| 13   | 2   | [3@12, 0@11, 2@13] ←evict 4@8 | ✅ | 4 oldest (t=8) |
| 14   | 1   | [3@12, 1@14, 2@13] ←evict 0@11 | ✅ | 0 oldest (t=11) |
| 15   | 2   | [3@12, 1@14, 2@15] | ❌ | Hit |
| 16   | 0   | [0@16, 1@14, 2@15] ←evict 3@12 | ✅ | 3 oldest (t=12) |
| 17   | 1   | [0@16, 1@17, 2@15] | ❌ | Hit |
| 18   | 7   | [0@16, 1@17, 7@18] ←evict 2@15 | ✅ | 2 oldest (t=15) |
| 19   | 0   | [0@19, 1@17, 7@18] | ❌ | Hit |
| 20   | 1   | [0@19, 1@20, 7@18] | ❌ | Hit |

**Total Faults: 10**

---

## 21.7 Clock (Second-Chance) Algorithm

### Algorithm
- Circular list of frames with **reference bit (R)**
- Hand sweeps around:
  - If R=0 → victim (replace)
  - If R=1 → R=0, give second chance, advance hand

### Trace: 3 Frames

```
Initial: all R=0

Ref 1: [1@R=1]           Fault, set R=1
Ref 2: [1@1, 2@1]        Fault, set R=1
Ref 3: [1@1, 2@1, 3@1]   Fault, set R=1
Ref 4: Hand at 1@1→R=1→set 0, advance
       Hand at 2@1→R=1→set 0, advance
       Hand at 3@1→R=1→set 0, advance
       Hand at 1@0→VICTIM! Replace with 4@1
       Frames: [4@1, 2@0, 3@0]
Ref 1: Hand at 2@0→VICTIM! Replace with 1@1
       Frames: [4@1, 1@1, 3@0]
Ref 2: Hand at 3@0→VICTIM! Replace with 2@1
       Frames: [4@1, 1@1, 2@1]
Ref 5: Hand at 4@1→set 0, advance
       Hand at 1@1→set 0, advance
       Hand at 2@1→set 0, advance
       Hand at 4@0→VICTIM! Replace with 5@1
       Frames: [5@1, 1@0, 2@0]
Ref 1: Hit! Set R=1 → [5@1, 1@1, 2@0]
Ref 2: Hit! Set R=1 → [5@1, 1@1, 2@1]
Ref 3: Hand at 5@1→set 0, advance
       Hand at 1@1→set 0, advance
       Hand at 2@1→set 0, advance
       Hand at 5@0→VICTIM! Replace with 3@1
       Frames: [3@1, 1@0, 2@0]
Ref 4: Hand at 1@0→VICTIM! Replace with 4@1
       Frames: [3@1, 4@1, 2@0]
Ref 5: Hand at 2@0→VICTIM! Replace with 5@1
       Frames: [3@1, 4@1, 5@1]
```

**Faults: 9** (same as FIFO here, but no Belady's Anomaly!)

---

## 21.8 Enhanced Clock (With Dirty Bit)

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

## 21.9 Frame Allocation

### Strategies

| Strategy | Formula | Example: 62 frames, P1(10 pages), P2(127 pages) |
|----------|---------|--------------------------------------------------|
| **Equal** | `frames / processes` | 31 each |
| **Proportional** | `(size_i / total_size) × total_frames` | P1: (10/137)×62 ≈ **4.5 frames** |
| **Priority** | High-priority gets more | Depends on priority |
| **Working Set** | Pages actively used in recent Δ time | Dynamic |

### Working Set Model
- Based on **Locality of Reference** (spatial + temporal)
- **Working Set Window (Δ)**: Pages referenced in last Δ time units
- Keep working set in memory → prevent thrashing

---

## 21.10 Thrashing

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

### PFF Strategy
- Establish **upper and lower page fault rate bounds**
- If process rate > upper bound → grant more frames
- If process rate < lower bound → revoke frames

---

## 21.11 Global vs Local Replacement

| Policy | Behavior | Risk |
|--------|----------|------|
| **Global** | Victim from any process | One bad process steals frames → system-wide thrashing |
| **Local** | Victim from faulting process only | Isolates thrashing to one process |

---

## 21.12 Key Takeaways

1. **FIFO** = Belady's Anomaly YES; **LRU/OPT** = Belady's Anomaly NO (stack algorithms)
2. **Clock/Second-Chance** = circular queue + reference bit; approximates LRU
3. **Enhanced Clock** = (ref, dirty) priority: (0,0) > (0,1) > (1,0) > (1,1)
4. **Frame Allocation**: Equal, Proportional, Priority, Working Set
5. **Thrashing** = Σ WSSᵢ > D; detected by high paging + low CPU
6. **Working Set** = pages referenced in last Δ time; based on locality
7. **PFF** = upper/lower fault rate bounds → grant/revoke frames
8. **Global replacement** = thrashing contagion risk; **Local** = isolates

---

## 21.13 Exam-Relevant MCQ Patterns

- **Q89**: Belady's Anomaly string → 3 frames=9 faults, 4 frames=10 faults
- **Q90**: Optimal replacement = page not used for longest future time
- **Q91**: LRU/OPT immune to Belady's = stack algorithms (n frames ⊂ n+1 frames)
- **Q92**: Stack algorithm definition = n-frame set ⊂ (n+1)-frame set
- **Q93**: Clock algorithm — ref=1 → reset to 0, advance hand; ref=0 → replace
- **Q94**: Enhanced Clock — (0,0) highest priority candidate for replacement
- **Q95**: Proportional allocation = (size/S) × total_frames
- **Q96**: Global replacement risk = one process steals frames → thrashing
- **Q97**: Thrashing cause = Σ WSSᵢ > D
- **Q98**: Working Set principle = Locality of Reference
- **Q99**: PFF strategy = upper/lower fault rate bounds → grant/revoke frames

---

## 21.14 Practice Problems

### Problem 1: FIFO Trace
```
Ref: 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1
Frames: 3
Trace FIFO. How many faults?
```

### Problem 2: Optimal Trace
```
Ref: 1,2,3,4,1,2,5,1,2,3,4,5
Frames: 3
Trace OPT step by step.
```

### Problem 3: Clock Algorithm
```
Ref: 1,2,3,4,1,2,5,1,2,3,4,5
Frames: 3
Trace Clock. Show reference bit changes.
```

### Problem 4: Belady's Anomaly
Prove FIFO has Belady's Anomaly for string: `1,2,3,4,1,2,5,1,2,3,4,5`

### Problem 5: Frame Allocation
```
Total frames: 64
P1: 16 pages
P2: 48 pages
P3: 32 pages
Equal allocation? Proportional allocation?
```

### Problem 6: Thrashing Detection
```
System: 100 frames
Process working sets: WSS1=40, WSS2=35, WSS3=30
Is system thrashing? What to do?
```

---

*Next: Topic 22 (NUMA, Memory Locality & Clock Page Replacement)*