# Topic 31: Disk Scheduling & Disk Management

**Source**: Lecture 4.7 (Unit 4) + Textbook Ch. 12 (Silberschatz Ch. 12, Stallings Ch. 13)

---

## 31.1 Disk Scheduling Overview

### Goals
| Goal | Description |
|------|-------------|
| **Minimize Seek Time** | Seek time ∝ seek distance |
| **Maximize Disk Bandwidth** | Total bytes transferred / total time (first request to last completion) |

### Why Scheduling Matters
- Multiple I/O requests from: OS, system processes, user processes
- Requests queued per disk/device
- **Idle disk** → immediate service
- **Busy disk** → requests queued
- **Optimization only matters** when queue exists

### I/O Request Structure
| Field | Description |
|-------|-------------|
| **Mode** | Input (read) or Output (write) |
| **Disk Address** | Cylinder/track/sector or LBA |
| **Memory Address** | Buffer in RAM |
| **Sector Count** | Number of sectors to transfer |

---

## 31.2 Disk Scheduling Algorithms

### Reference Queue
```
Queue: 98, 183, 37, 122, 14, 124, 65, 67
Head starts at: 53
Cylinders: 0-199
```

---

## 31.3 FCFS (First-Come, First-Served)

### Algorithm
- Service requests in arrival order
- No optimization

### Trace (Head at 53)
```
Order: 98, 183, 37, 122, 14, 124, 65, 67
Head:  53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67

Movements:
53→98   = 45
98→183  = 85
183→37  = 146
37→122  = 85
122→14  = 108
14→124  = 110
124→65  = 59
65→67   = 2
Total = 640 cylinders
```

### Characteristics
| Property | Value |
|----------|-------|
| **Total Movement** | 640 cylinders |
| **Fairness** | ✅ Perfect |
| **Performance** | ❌ Poor (no optimization) |

---

## 31.3 SSTF (Shortest Seek Time First)

### Algorithm
- Select request with **minimum seek time** from current head position
- **Form of SJF** scheduling

### Trace (Head at 53)
```
Queue: 98, 183, 37, 122, 14, 124, 65, 67
Head:  53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183

Movements:
53→65   = 12
65→67   = 2
67→37   = 30
37→14   = 23
14→98   = 84
98→122  = 24
122→124 = 2
124→183 = 59
Total = 236 cylinders
```

### Characteristics
| Property | Value |
|----------|-------|
| **Total Movement** | 236 cylinders (vs 640 FCFS) |
| **Throughput** | ✅ Better than FCFS |
| **Starvation** | ❌ Possible (requests far from head) |
| **Fairness** | ❌ Poor |

---

## 31.3 SCAN (Elevator Algorithm)

### Algorithm
- Arm moves from one end to other
- Services requests **in current direction**
- At end → **reverse direction**
- **Also called**: Elevator Algorithm

### Trace (Head at 53, moving toward higher)
```
Initial direction: ↑ (toward higher cylinders)
Queue: 98, 183, 37, 122, 14, 124, 65, 67
Head: 53 → 65 → 67 → 98 → 122 → 124 → 183 → 199 (end) → 37 → 14 → 0

Movements:
53→65   = 12
65→67   = 2
67→98   = 31
98→122  = 24
122→124 = 2
124→183 = 59
183→199 = 16 (to end)
199→37  = 162 (reverse)
37→14   = 23
14→0    = 14 (to end)
Total = 236 cylinders
```

### Characteristics
| Property | Value |
|----------|-------|
| **Total Movement** | 236 cylinders |
| **Starvation** | None (all requests eventually served) |
| **Variance** | ⚠️ Ends wait longer if uniform density |

---

## 31.4 C-SCAN (Circular SCAN)

### Algorithm
- Head moves from one end to other
- At end → **immediately returns to start** (no service on return)
- **Cylinders treated as circular list** (wraps around)

### Trace (Head at 53, moving ↑)
```
Direction: ↑
53 → 65 → 67 → 98 → 122 → 124 → 183 → 199 (end)
→ Jump to 0 (no service)
0 → 14 → 37
End at 37

Movements:
53→65   = 12
65→67   = 2
67→98   = 31
98→122  = 24
122→124 = 2
124→183 = 59
183→199 = 16
199→0   = 199 (return, no service)
0→14    = 14
14→37   = 23
Total = 382 cylinders
```

### Characteristics
| Property | Value |
|----------|-------|
| **Total Movement** | 382 cylinders |
| **Wait Time** | More uniform than SCAN |
| **Return Trip** | No service (fast return) |

---

## 31.4 LOOK & C-LOOK

### LOOK (Improved SCAN)
- Arm goes **only to last request** in current direction
- **Reverses immediately** (no travel to physical end)

### C-LOOK (Improved C-SCAN)
- Goes to **last request** in direction
- **Jumps to first request** in opposite direction

### C-LOOK Trace
```
Head at 53, direction ↑
53 → 65 → 67 → 98 → 122 → 124 → 183 (last request)
→ Jump to 14 (first request in other direction)
→ 37
End at 37

Movements:
53→65   = 12
65→67   = 2
67→98   = 31
98→122  = 24
122→124 = 2
124→183 = 59
183→14  = 169 (jump)
14→37   = 23
Total = 322 cylinders
```

---

## 31.5 Algorithm Comparison

| Algorithm | Total Movement | Starvation | Fairness | Complexity |
|-----------|---------------|------------|----------|------------|
| **FCFS** | 640 | None | Perfect | O(1) |
| **SSTF** | 236 | Possible | Poor | O(n) |
| **SCAN** | 236 | None | Good | O(n log n) |
| **C-SCAN** | 382 | None | Better | O(n log n) |
| **LOOK** | ~200* | None | Good | O(n log n) |
| **C-LOOK** | 322 | None | Best | O(n log n) |

*LOOK varies based on request distribution

---

## 31.5 Algorithm Selection

### Selection Guidelines
| Scenario | Recommended |
|----------|-------------|
| **Light load** | SSTF (simple, good throughput) |
| **Heavy load** | SCAN / C-SCAN (less starvation) |
| **Real-time** | C-LOOK / LOOK (predictable) |
| **General purpose** | SSTF or LOOK (default) |

### Selection Factors
| Factor | Consideration |
|--------|---------------|
| **Load** | Heavy → SCAN/C-SCAN; Light → SSTF |
| **Starvation tolerance** | Low → avoid SSTF |
| **Predictability** | Real-time → LOOK/C-LOOK |
| **Implementation** | Modular design for easy replacement |

---

## 31.6 Rotational Latency Consideration

### The Problem
- **Rotational latency** ≈ **Seek time** (can be equally large)
- **OS cannot easily optimize** because:
  - Modern disks don't expose physical block locations
  - Logical Block Address (LBA) ≠ physical sector

### Solution: Controller-Based Scheduling
```
OS → Batch of requests → Disk Controller
    ↓
Controller queues & schedules for:
  1. Seek time optimization
  2. Rotational latency optimization
```

### Modern Approach
| Layer | Responsibility |
|-------|----------------|
| **OS** | High-level scheduling (seek optimization) |
| **Disk Controller** | Low-level (rotational latency, NCQ) |

### NCQ (Native Command Queuing)
- SATA feature: drive reorders commands internally
- Optimizes both seek + rotational latency

---

## 31.6 Disk Management

### Disk Formatting
| Level | Description |
|-------|-------------|
| **Low-level** | Physical sectors/tracks (factory) |
| **Partitioning** | Logical divisions (MBR/GPT) |
| **High-level** | File system creation (mkfs) |

### Bad Block Handling
| Method | Description |
|--------|-------------|
| **Spare sectors** | Reserved sectors replace bad ones |
| **Bad block list** | Maintained by controller/OS |
| **Sector slipping** | Shift sectors to skip bad ones |

### RAID (Redundant Array of Independent Disks)
| Level | Description | Redundancy |
|------|-------------|------------|
| **RAID 0** | Striping | None |
| **RAID 1** | Mirroring | Full |
| **RAID 5** | Striping + Parity | 1 disk |
| **RAID 6** | Striping + Dual Parity | 2 disks |
| **RAID 10** | Mirrored Stripes | Full |

---

## 31.7 Key Takeaways

1. **FCFS** = simple, fair, poor performance
2. **SSTF** = better throughput, starvation risk
3. **SCAN** = elevator; no starvation; ends wait longer
4. **C-SCAN** = uniform wait; return trip empty
5. **LOOK/C-LOOK** = practical SCAN/C-SCAN (don't go to physical ends)
6. **Selection** = SSTF/LOOK for default; SCAN/C-SCAN for heavy load
7. **Rotational latency** = handled by disk controller (NCQ)
8. **Modular design** = scheduling algorithm as separate module

---

## 31.7 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **FCFS movement** | Sum of absolute differences in arrival order |
| **SSTF** | Minimum seek from current head; may starve |
| **SCAN** | Elevator; reverses at end; no starvation |
| **C-SCAN** | Circular; returns to start without service |
| **LOOK** | SCAN but reverses at last request, not disk end |
| **C-LOOK** | C-SCAN but jumps to first request, not cylinder 0 |
| **SSTF vs SCAN** | SSTF = better throughput, possible starvation |
| **SCAN vs C-SCAN** | C-SCAN = more uniform wait times |
| **Rotational latency** | Handled by disk controller (NCQ) |
| **Algorithm modularity** | Should be separate module for replaceability |

---

## 31.8 Practice Problems

### Problem 1: FCFS Trace
```
Queue: 55, 58, 39, 18, 90, 160, 150, 38, 184
Head: 50
Calculate total head movement.
```

### Problem 2: SSTF Trace
```
Queue: 82, 170, 43, 140, 24, 16, 190
Head: 50
Trace SSTF.
```

### Problem 3: SCAN vs C-SCAN
```
Queue: 10, 22, 20, 2, 40, 6, 38
Head: 20, moving ↑
Compare SCAN vs C-SCAN total movement.
```

### Problem 3: LOOK vs SCAN
```
Queue: 98, 183, 37, 122, 14, 124, 65, 67
Head: 53, moving ↑
Calculate LOOK total movement.
```

### Problem 4: Algorithm Selection
```
System with 100 processes, heavy I/O load.
Which algorithm? Why not SSTF?
```

### Problem 5: Rotational Latency
```
Why can't OS optimize rotational latency?
What does NCQ do?
```

---

*Next: Topic 32 (RAID Structure)*