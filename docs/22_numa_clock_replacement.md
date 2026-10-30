# Topic 22: NUMA, Memory Locality & Clock Page Replacement

**Source**: Lecture 3.8 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9)

---

## 22.1 NUMA (Non-Uniform Memory Access)

### Architecture
- Memory access latency varies by CPU-memory distance
- Each CPU has "local" memory (fast) and "remote" memory (slow)
- Multiple nodes: each with CPUs + local RAM, connected via interconnect

### Memory Locality
| Access Type | Latency |
|-------------|---------|
| **Local** | ~100ns (direct on CPU's local bus) |
| **Remote** | ~200-400ns (traverse interconnect) |

### First-Touch Policy
- Page allocated on node where **first touched**
- OS tries to allocate on same node as accessing thread

### OS Scheduler Support
- Prefers same-node migration
- Cross-node only for severe imbalance
- Tracks NUMA topology

---

## 22.2 Clock Page Replacement (Second-Chance)

### Basic Algorithm
- Circular list of frames with **reference bit**
- Hand sweeps around:
  - If ref=0 → victim (replace)
  - If ref=1 → ref=0, give second chance, advance hand

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

## 22.3 Enhanced Clock (Second-Chance with Dirty Bit)

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

## 22.4 Key Takeaways

1. **NUMA** = local memory fast, remote memory slow; scheduler must be NUMA-aware
2. **First-touch** = page allocated on node where first accessed
3. **Clock Algorithm** = circular + ref bit; ref=1 → reset to 0, advance; ref=0 → replace
4. **Enhanced Clock** = 4 classes by (ref, dirty); (0,0) evicted first (no write-back)
5. **Linux** = uses enhanced clock variant

---

## 22.5 Exam-Relevant MCQ Patterns

- **Q100**: NUMA — local memory on CPU's local bus, lower latency than remote across interconnect
- **Q93**: Clock — ref=1 → reset to 0, advance hand; ref=0 → replace
- **Q94**: Enhanced Clock — (0,0) highest priority candidate for replacement