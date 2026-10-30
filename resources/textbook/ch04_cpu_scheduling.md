# Chapter 4: CPU Scheduling

**Textbook References**: [Silberschatz 10e, Ch. 5] • [Stallings 9e, Ch. 9] • [Stevens & Rago 3e, Ch. 9]

---

## 4.1 Basic Concepts [Silberschatz 10e, §5.1]

### Motivation [Silberschatz 10e, §5.1.1]
- Single CPU core → only one process executes at a time
- Others wait in **ready queue**
- **Multiprogramming objective**: Keep CPU busy at all times
- When process waits (I/O), scheduler switches to another ready process

### CPU-I/O Burst Cycle [Silberschatz 10e, Fig. 5.1]
```
CPU burst → I/O burst → CPU burst → I/O burst → ...
```
- CPU burst distribution drives scheduling algorithm design

> **Silberschatz Fig. 5.1**: "The CPU-I/O burst cycle" [Silberschatz 10e, Fig. 5.1]

---

## 4.2 Scheduler & Dispatcher [Silberschatz 10e, §5.2]

| Component | Role | [Silberschatz 10e, §5.2] |
|-----------|------|--------------------------|
| **Short-term scheduler** | Picks next process from ready queue | |
| **Dispatcher** | Context switch, mode change, jump to user code | |
| **Dispatch latency** | Time to stop one process, start another | |

---

## 4.3 Preemptive vs Non-Preemptive Scheduling [Silberschatz 10e, §5.3]

### Four Decision Points [Silberschatz 10e, §5.3.1]
| # | Transition | Non-Preemptive | Preemptive |
|---|------------|----------------|------------|
| 1 | Running → Waiting (I/O) | ✅ | ✅ |
| 2 | Running → Ready (interrupt) | ❌ | ✅ |
| 3 | Waiting → Ready (I/O done) | ❌ | ✅ |
| 4 | Running → Terminated | ✅ | ✅ |

| Type | Description | [Silberschatz 10e, §5.3] |
|------|-------------|--------------------------|
| **Non-Preemptive** | Process keeps CPU until it voluntarily releases (I/O or terminate) | |
| **Preemptive** | OS can forcibly preempt on timer interrupt or higher-priority arrival | |

**Preemptive challenges**: Race conditions on shared data; need kernel synchronization [Silberschatz 10e, §5.3.2]

---

## 4.4 Scheduling Criteria (Metrics) [Silberschatz 10e, §5.4]

| Metric | Goal | Description | [Silberschatz 10e, §5.4] |
|--------|------|-------------|--------------------------|
| **CPU Utilization** | Maximize | % time CPU busy (40-90%) | |
| **Throughput** | Maximize | Processes completed per unit time | |
| **Turnaround Time** | Minimize | Submit → complete (wait + exec + I/O) | |
| **Waiting Time** | Minimize | Time in ready queue | |
| **Response Time** | Minimize | Submit → first response (interactive) | |

---

## 4.5 Scheduling Algorithms [Silberschatz 10e, §5.5]

### 1. First-Come, First-Served (FCFS) [Silberschatz 10e, §5.5.1]
- **Algorithm**: FIFO ready queue, **non-preemptive**
- **Simple** but suffers **Convoy Effect**

#### Example 1: P1(24), P2(3), P3(3) at t=0
```
Gantt: | P1 (24) | P2 (3) | P3 (3) |
       0        24       27       30
Wait: P1=0, P2=24, P3=27 → Avg = 17.0 ms
```

#### Example 2: P2(3), P3(3), P1(24) at t=0
```
Gantt: | P2 (3) | P3 (3) | P1 (24) |
       0        3        6        30
Wait: P2=0, P3=3, P1=6 → Avg = 3.0 ms
```

**Convoy Effect** [Silberschatz 10e, §5.5.1]: Short I/O-bound processes stuck behind long CPU-bound process → poor utilization

---

### 2. Shortest-Job-First (SJF) — Non-Preemptive [Silberschatz 10e, §5.5.2]
- **Algorithm**: Pick process with **smallest next CPU burst**
- **Tie-breaker**: FCFS
- **Provably optimal** for minimum average waiting time (stationary processes) [Silberschatz 10e, §5.5.2]

#### Example: All arrive at t=0
| Process | Burst |
|---------|-------|
| P1 | 6 |
| P2 | 8 |
| P3 | 7 |
| P4 | 3 |

**Order**: P4(3) → P1(6) → P3(7) → P2(8)
```
Gantt: | P4 | P1 | P3 | P2 |
       0    3    9   16   24
Wait: P4=0, P1=3, P3=9, P2=16 → Avg = 7.0 ms
```
vs FCFS (P1,P2,P3,P4): Avg = 10.25 ms

> **Silberschatz**: "SJF is provably optimal, in that it gives the minimum average waiting time for a given set of processes." [Silberschatz 10e, §5.5.2]

---

### 3. Shortest-Remaining-Time-First (SRTF) — Preemptive SJF [Silberschatz 10e, §5.5.3]
- Preempt if new arrival has **shorter remaining burst** than current

#### Example with Arrival Times
| Process | Arrival | Burst |
|---------|---------|-------|
| P1 | 0 | 8 |
| P2 | 1 | 4 |
| P3 | 2 | 9 |
| P4 | 3 | 5 |

**Timeline**:
```
t=0: P1 starts (rem=8)
t=1: P2 arrives (4 < 7) → preempt P1, run P2
t=2: P3 arrives (9 > 3) → P2 continues
t=3: P4 arrives (5 > 2) → P2 continues
t=5: P2 done. Ready: P1(7), P3(9), P4(5) → run P4
t=10: P4 done. Ready: P1(7), P3(9) → run P1
t=17: P1 done. Run P3
t=26: P3 done.

Gantt: | P1 | P2 | P4 | P1 | P3 |
       0    1    5   10   17   26

Wait: P1=9, P2=0, P3=15, P4=2 → Avg = 6.5 ms
```

---

### 4. Priority Scheduling [Silberschatz 10e, §5.5.4]
- Each process has **integer priority**
- CPU → highest priority process
- **Conventions**: Smaller integer = higher priority (Silberschatz) OR larger = higher [Silberschatz 10e, §5.5.4]
- **Preemptive** or **Non-preemptive**
- **SJF = special case** where priority = 1 / predicted burst

#### Starvation Problem [Silberschatz 10e, §5.5.4]
- Low-priority process waits indefinitely if high-priority stream continues
- **Solution: Aging** — gradually increase priority of waiting processes [Silberschatz 10e, §5.5.4]

#### Example: Non-Preemptive (Smaller = Higher)
| Process | Burst | Priority |
|---------|-------|----------|
| P1 | 10 | 3 |
| P2 | 1 | 1 (Highest) |
| P3 | 2 | 4 |
| P4 | 1 | 5 (Lowest) |
| P5 | 5 | 2 |

**Order**: P2 → P5 → P1 → P3 → P4
```
Avg Wait = 8.2 ms
```

#### Example: Preemptive (Larger = Higher)
| Process | Arrival | Burst | Priority |
|---------|---------|-------|----------|
| P1 | 0 | 4 | 2 |
| P2 | 1 | 3 | 3 |
| P3 | 2 | 1 | 4 |
| P4 | 3 | 5 | 5 (Highest) |
| P5 | 4 | 2 | 5 (Highest) |

```
Avg Wait = 4.6 ms
```

---

### 5. Round-Robin (RR) — *Designed for Time-Sharing* [Silberschatz 10e, §5.5.5]
- **Preemptive**, based on FCFS
- **Time Quantum (q)**: 10-100ms typical
- Ready queue = circular FIFO
- Process runs for ≤ q; if not done, preempted → appended to tail

#### Example: q=4, P1(24), P2(3), P3(3) at t=0
```
Gantt: | P1 | P2 | P3 | P1 | P1 | P1 | P1 | P1 |
       0    4    7   10   14   18   22   26   30

Wait: P1=6, P2=4, P3=7 → Avg = 5.66 ms
```

### RR Performance Analysis [Silberschatz 10e, §5.5.5]
| Quantum Size | Behavior |
|--------------|----------|
| **q → ∞** | Degenerates to **FCFS** |
| **q → 0** | Approaches **processor sharing** (each gets 1/n speed) but **context-switch overhead dominates** |

**Rule of Thumb** [Silberschatz 10e, §5.5.5]: ~80% of CPU bursts should complete within one quantum

---

### 6. Multilevel Queue (MLQ) [Silberschatz 10e, §5.5.6]
- Processes permanently assigned to queues (foreground/background)
- Each queue has own scheduling (RR for foreground, FCFS for background)
- **Inter-queue scheduling**:
  - Fixed-priority (higher queues must empty first) → starvation risk
  - Time-sliced (e.g., 80% foreground, 20% background)

### Multilevel Feedback Queue (MLFQ) — *Self-Tuning* [Silberschatz 10e, §5.5.7]
- **Dynamic migration** between queues based on behavior
- Standard 3-queue example:
  ```
  NEW → Q0 (RR, q=8) → Q1 (RR, q=16) → Q2 (FCFS)
  ```
- **Demotion**: Use full quantum → move down
- **Promotion (Aging)**: Wait too long → move up
- **Preemption**: Higher queue arrival preempts lower

> **Silberschatz**: "The multilevel feedback queue is the most general scheduling algorithm, but it is also the most complex to implement." [Silberschatz 10e, §5.5.7]

---

## 4.6 Thread Scheduling [Silberschatz 10e, §5.6]
- **PCS (Process-Contention Scope)**: User-level scheduling (M:1, M:N) [Silberschatz 10e, §5.6.1]
- **SCS (System-Contention Scope)**: Kernel schedules directly (1:1 — Linux default) [Silberschatz 10e, §5.6.2]

---

## 4.7 Summary Table [Silberschatz 10e, Table 5.2]

| Algorithm | Preemptive? | Best For | Drawback |
|-----------|-------------|----------|----------|
| FCFS | No | Simple batch | Convoy effect |
| SJF | No | Minimum wait | Needs burst prediction |
| SRTF | Yes | Responsive batch | More context switches |
| Priority | Both | Importance-based | Starvation (fix: aging) |
| RR | Yes | Time-sharing | Quantum tuning critical |
| MLFQ | Yes | General purpose | Complex tuning |

---

## 4.8 Key Formulas [Silberschatz 10e, §5.4]

| Metric | Formula |
|--------|---------|
| **Turnaround Time** | Completion - Arrival |
| **Waiting Time** | Turnaround - Burst = Completion - Arrival - Burst |
| **Response Time** | First Start - Arrival |
| **Avg Waiting** | Σ Wait_i / n |
| **RR Max Wait Bound** | (n - 1) × q |

---

## Key Takeaways
- **FCFS**: Simple but convoy effect [Silberschatz 10e, §5.5.1]
- **SJF/SRTF**: Optimal for wait time but need burst prediction [Silberschatz 10e, §5.5.2-3]
- **Priority**: Flexible but starvation → fix with aging [Silberschatz 10e, §5.5.4]
- **RR**: Fair, predictable; quantum tuning critical (80% rule) [Silberschatz 10e, §5.5.5]
- **MLFQ**: Self-tuning; adapts to actual behavior [Silberschatz 10e, §5.5.7]
- **Real systems**: Use MLFQ variants (Linux CFS, Windows, macOS) [Silberschatz 10e, §5.5.7]

---

**Further Reading**: [Silberschatz 10e, Ch. 5] • [Stallings 9e, Ch. 9] • [Stevens & Rago 3e, Ch. 9]