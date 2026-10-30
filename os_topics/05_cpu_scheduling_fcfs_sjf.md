# Topic 5: CPU Scheduling — FCFS & SJF

**Source**: Lecture 7 + Textbook Ch. 4 (Silberschatz Ch. 5, Stallings Ch. 9, Stevens & Rago Ch. 9)

---

## 5.1 Basic Concepts

### Why Scheduling?
- Single CPU core → only one process executes at a time
- Others wait in **ready queue**
- **Goal**: Keep CPU busy at all times (maximize utilization)
- When process waits for I/O → scheduler switches to another ready process

### CPU-I/O Burst Cycle
```
CPU burst → I/O burst → CPU burst → I/O burst → ...
```
- CPU burst distribution drives scheduling algorithm design
- I/O-bound: many short CPU bursts
- CPU-bound: few long CPU bursts

---

## 5.2 Scheduler & Dispatcher

| Component | Role |
|-----------|------|
| **Short-term scheduler** | Picks next process from ready queue |
| **Dispatcher** | Context switch, mode change, jump to user code |
| **Dispatch latency** | Time to stop one process, start another |

---

## 5.3 Preemptive vs Non-Preemptive

### Four Decision Points
| # | Transition | Non-Preemptive | Preemptive |
|---|------------|----------------|------------|
| 1 | Running → Waiting (I/O) | ✅ | ✅ |
| 2 | Running → Ready (interrupt) | ❌ | ✅ |
| 3 | Waiting → Ready (I/O done) | ❌ | ✅ |
| 4 | Running → Terminated | ✅ | ✅ |

| Type | Description |
|------|-------------|
| **Non-Preemptive** | Process keeps CPU until it voluntarily releases (I/O or terminate) |
| **Preemptive** | OS can forcibly preempt on timer interrupt or higher-priority arrival |

---

## 5.4 Scheduling Criteria (Metrics)

| Metric | Formula | Goal |
|--------|---------|------|
| **Turnaround Time (TAT)** | Completion - Arrival | Minimize |
| **Waiting Time (WT)** | TAT - Burst = Completion - Arrival - Burst | Minimize |
| **Response Time (RT)** | First Start - Arrival | Minimize |
| **CPU Utilization** | % time CPU busy | Maximize |
| **Throughput** | Processes completed / time | Maximize |

---

## 5.5 First-Come, First-Served (FCFS)

- **Algorithm**: FIFO ready queue, **non-preemptive**
- **Simple** but suffers **Convoy Effect**

### Example 1: P1(24), P2(3), P3(3) at t=0
```
Gantt: | P1 (24) | P2 (3) | P3 (3) |
       0        24       27       30

Wait: P1=0, P2=24, P3=27 → Avg = 17.0
```

### Example 2: P2(3), P3(3), P1(24) at t=0
```
Gantt: | P2 (3) | P3 (3) | P1 (24) |
       0        3        6        30

Wait: P2=0, P3=3, P1=6 → Avg = 3.0
```

### Convoy Effect
Short I/O-bound processes stuck behind long CPU-bound process → poor CPU & device utilization.

---

## 5.6 Shortest-Job-First (SJF) — Non-Preemptive

- **Algorithm**: Pick process with **smallest next CPU burst**
- **Tie-breaker**: FCFS
- **Provably optimal** for minimum average waiting time (stationary processes)

### Example: All arrive at t=0
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

Wait: P4=0, P1=3, P3=9, P2=16 → Avg = 7.0
vs FCFS (P1,P2,P3,P4): Avg = 10.25
```

---

## 5.7 Shortest-Remaining-Time-First (SRTF) — Preemptive SJF

- Preempt if new arrival has **shorter remaining burst** than current

### Example with Arrival Times
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
```

**Waiting Times**:
| Process | Completion | Arrival | Burst | WT = CT - AT - BT |
|---------|------------|---------|-------|-------------------|
| P1 | 17 | 0 | 8 | 9 |
| P2 | 5 | 1 | 4 | 0 |
| P3 | 26 | 2 | 9 | 15 |
| P4 | 10 | 3 | 5 | 2 |
| **Avg** | | | | **6.5** |

---

## 5.8 Key Formulas (Memorize)

| Metric | Formula |
|--------|---------|
| **Turnaround Time** | Completion - Arrival |
| **Waiting Time** | Turnaround - Burst = Completion - Arrival - Burst |
| **Response Time** | First Start - Arrival |
| **Avg Waiting** | Σ Wait_i / n |
| **RR Max Wait Bound** | (n - 1) × q |

---

## 5.9 Quick Self-Test

| Question | Answer |
|----------|--------|
| FCFS convoy effect? | Short processes wait behind long CPU-bound process |
| SJF optimality? | Minimum average waiting time for non-preemptive |
| SRTF vs SJF? | SRTF = preemptive SJF; can preempt on new arrival |
| FCFS preemptive? | No |
| SRTF preemptive? | Yes |
| SRTF avg wait vs SJF? | SRTF ≤ SJF (always better or equal) |

---

## 5.10 Exam-Relevant MCQ Patterns (from prep file)

- **Q22**: FCFS convoy effect — short processes wait behind long job
- **Q23**: SJF optimal — minimum average waiting time
- **Q24**: SJF starvation → fix with **Aging**
- **Q25**: SRTF provides **absolute minimal** average waiting time
- **Q26**: SRTF numerical — P1(0,8), P2(1,4), P3(2,2), P4(3,1) → CT of P1 = 15
- **Q27**: FCFS turnaround calc — AT 0,1,2 with BT 4,3,1 → Avg TAT = 5.33

---

## 5.11 Practice: Trace These By Hand

1. **FCFS**: P1(0,10), P2(1,5), P3(2,8) → Gantt + Avg WT/TAT
2. **SJF**: P1(0,7), P2(0,4), P3(0,1), P4(0,4) → Order + Avg WT
3. **SRTF**: P1(0,8), P2(1,4), P3(2,9), P4(3,5) → Full trace (from slides)