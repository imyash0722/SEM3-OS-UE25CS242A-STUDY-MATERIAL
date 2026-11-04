# Topic 6: CPU Scheduling — Priority & Round Robin

**Source**: Lecture 8 (Unit 1) + Textbook Ch. 4 (Silberschatz Ch. 5, Stallings Ch. 9)

---

## 6.1 Priority Scheduling

### Concept
- Each process has an **integer priority**
- CPU → highest priority process
- **Conventions**: 
  - Silberschatz: **Smaller integer = Higher priority** (1 = highest)
  - Some systems: Larger integer = Higher priority
  - **Always verify convention in problem**

### Modes
| Mode | Behavior |
|------|----------|
| **Non-Preemptive** | Once CPU given, runs to completion (or I/O) |
| **Preemptive** | New arrival with higher priority preempts current |

### Relationship with SJF
- **SJF = special case of Priority** where priority = 1 / predicted burst time

### Major Problem: Starvation
- Low-priority process waits indefinitely if high-priority stream continues
- **Real case**: MIT's IBM 7094 (1973) — low-priority job from 1967 still waiting!

### Solution: Aging
- Gradually increase priority of waiting processes (e.g., +1 every 15 min)
- Eventually gets high enough priority to execute

---

## 6.2 Priority Scheduling Examples

### Example 1: Non-Preemptive (Smaller = Higher Priority)
| Process | Burst | Priority |
|---------|-------|----------|
| P1 | 10 | 3 |
| P2 | 1 | 1 (Highest) |
| P3 | 2 | 4 |
| P4 | 1 | 5 (Lowest) |
| P5 | 5 | 2 |

**Order**: P2 → P5 → P1 → P3 → P4
```
Gantt: | P2 | P5 | P1 | P3 | P4 |
       0    1    6   16   18   19

Wait: P1=6, P2=0, P3=16, P4=18, P5=1 → Avg = 8.2
```

### Example 2: Preemptive (Larger = Higher Priority)
| Process | Arrival | Burst | Priority |
|---------|---------|-------|----------|
| P1 | 0 | 4 | 2 |
| P2 | 1 | 3 | 3 |
| P3 | 2 | 1 | 4 |
| P4 | 3 | 5 | 5 (Highest) |
| P5 | 4 | 2 | 5 (Highest) |

**Timeline**:
```
t=0: P1 starts (pri 2)
t=1: P2 arrives (pri 3 > 2) → preempt P1, run P2
t=2: P3 arrives (pri 4 > 3) → preempt P2, run P3
t=3: P3 done. P4 arrives (pri 5) → run P4
t=4: P5 arrives (pri 5 = P4) → FCFS keeps P4
t=8: P4 done. P5 (pri 5) runs 8-10
t=10: P5 done. Ready: P2(pri 3, rem 2), P1(pri 2, rem 3) → P2 runs 10-12
t=12: P2 done. P1 runs 12-15
t=15: P1 done.

Gantt: | P1 | P2 | P3 | P4 | P5 | P2 | P1 |
       0    1    2    3    8   10   12   15
```

**Waiting Times**:
| Process | CT | AT | BT | WT = CT - AT - BT |
|---------|-----|-----|-----|-------------------|
| P1 | 15 | 0 | 4 | 11 |
| P2 | 12 | 1 | 3 | 8 |
| P3 | 3 | 2 | 1 | 0 |
| P4 | 8 | 3 | 5 | 0 |
| P5 | 10 | 4 | 2 | 4 |
| **Avg** | | | | **4.6** |

---

## 6.3 Round-Robin (RR) — Designed for Time-Sharing

### Principles
- **Preemptive**, based on FCFS
- **Time Quantum (q)**: 10-100ms typical
- Ready queue = **circular FIFO**
- Process runs ≤ q; if not done → preempted → appended to tail

### Example: q=4, P1(24), P2(3), P3(3) at t=0
```
t=0:  P1 runs 4ms (rem=20) → tail
t=4:  P2 runs 3ms (done) → terminates at 7
t=7:  P3 runs 3ms (done) → terminates at 10
t=10: Only P1 remains → runs in 4ms quanta until done at 30

Gantt: | P1 | P2 | P3 | P1 | P1 | P1 | P1 | P1 |
       0    4    7   10   14   18   22   26   30
```

**Waiting Times**:
- P1: Runs [0-4], waits [4-10], runs to finish → Wait = 6
- P2: Waits [0-4] → Wait = 4
- P3: Waits [0-7] → Wait = 7
- **Avg WT = 5.66**

---

## 6.4 RR Performance Analysis

### Time Quantum Trade-offs

| Quantum Size | Behavior |
|--------------|----------|
| **q → ∞** | Degenerates to **FCFS** |
| **q → 0** | Approaches processor sharing (each gets 1/n speed) but **context-switch overhead dominates** |

### Maximum Waiting Bound
```
If n processes in ready queue, time quantum = q:
No process waits longer than (n - 1) × q time units
```

### Rule of Thumb (Silberschatz)
> **~80% of CPU bursts should complete within one quantum**

---

## 6.5 Quick Comparison Table

| Algorithm | Preemptive? | Starvation? | Best For |
|-----------|-------------|-------------|----------|
| FCFS | No | No | Simple batch |
| SJF | No | Yes (long jobs) | Minimum wait |
| SRTF | Yes | Yes (long jobs) | Responsive batch |
| **Priority** | Both | Yes (fix: aging) | Importance-based |
| **RR** | Yes | No | Time-sharing |
| MLFQ | Yes | No (with aging) | General purpose |

---

## 6.6 Quick Self-Test

| Question | Answer |
|----------|--------|
| Priority convention (Silberschatz)? | Smaller integer = higher priority |
| SJF is special case of? | Priority scheduling (priority = 1/burst) |
| Priority starvation fix? | Aging (gradually boost waiting process priority) |
| RR quantum → ∞? | Becomes FCFS |
| RR quantum → 0? | Processor sharing but context-switch overhead kills performance |
| RR max wait bound? | (n - 1) × q |
| RR quantum guideline? | 80% of bursts complete within one quantum |

---

## 6.7 Exam-Relevant MCQ Patterns (from your prep file)

- **Q28**: RR quantum → ∞ → degenerates to FCFS
- **Q29**: 80% rule for quantum selection
- **Q30**: Priority inversion — high blocked on low, medium runs → fix: **Priority Inheritance**

---

*Next: Topic 7 (Multilevel Queue & Multilevel Feedback Queue — Lecture 10)*