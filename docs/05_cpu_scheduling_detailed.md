# Topic 5 (Detailed): CPU Scheduling — FCFS, SJF, SRTF, Priority, RR

**Source**: Lectures 7, 8 + Textbook Ch. 5 (Silberschatz Ch. 5, Stallings Ch. 9)

---

## 5.1 Scheduling Fundamentals

### What is CPU Scheduling?

```
CPU SCHEDULER (Short-term)
        │
        ▼
┌─────────────────────────────────────────┐
│         READY QUEUE                     │
│  PCB1 ──► PCB2 ──► PCB3 ──► PCB4        │
└─────────────────────────────────────────┘
        │
        ▼
   DISPATCHER
        │
        ▼
┌─────────────────────────────────────────┐
│            CPU                          │
│    Running: PCB2                        │
└─────────────────────────────────────────┘
```

**Goal**: Decide which ready process gets the CPU next.

### When Does Scheduling Occur?

| Trigger | Scheduler Called? | Preemptive? |
|---------|-------------------|-------------|
| Process created | Yes | No (new process) |
| Process exits | Yes | No |
| I/O request (block) | Yes | No (voluntary) |
| I/O completion (unblock) | Yes | Yes |
| Timer interrupt (time slice) | Yes | **Yes** |
| Higher priority process arrives | Yes | **Yes** |

**Non-preemptive decisions**: Process switches only when it voluntarily gives up CPU (blocks or terminates).
**Preemptive decisions**: OS can forcibly take CPU away.

---

## 5.2 Scheduling Metrics (Must Memorize Formulas)

```
Timeline for Process P:
Arrival ──────────────────────────────► Completion
   │                                      │
   ▼                                      ▼
Start (first CPU)                     End (last CPU)
   │                                      │
   └────── Response Time ────────────────┘
   
   └──────────────── Turnaround Time ───────────────┘
   
   └── Wait 1 ──┘  Running  └── Wait 2 ──┘  Running
   └────────────── Waiting Time ───────────────────┘
```

| Metric | Formula | What It Measures |
|--------|---------|------------------|
| **Turnaround Time (TAT)** | `Completion - Arrival` | Total time in system |
| **Waiting Time (WT)** | `TAT - Burst Time` | Time spent ready but not running |
| **Response Time (RT)** | `First Run - Arrival` | Time to first response (interactive) |
| **CPU Utilization** | `Busy Time / Total Time` | Keep CPU busy |
| **Throughput** | `Processes Completed / Time` | Maximize jobs done |

**Relationship**: `WT = TAT - BT` (for non-preemptive, or sum of wait periods for preemptive)

---

## 5.3 FCFS (First-Come, First-Served)

### Algorithm
- Ready queue = FIFO
- Non-preemptive
- Simple but suffers **Convoy Effect**

### Example: All Arrive at Time 0

| Process | Burst Time |
|---------|------------|
| P1      | 24         |
| P2      | 3          |
| P3      | 3          |

**Gantt Chart:**
```
Time: 0                          24        27      30
      │                          │         │       │
      ▼                          ▼         ▼       ▼
┌─────────────┬─────────┬─────────┐
│    P1 (24)  │  P2 (3) │  P3 (3) │
└─────────────┴─────────┴─────────┘
```

**Calculations:**
| Process | Arrival | Burst | Completion | TAT = C-A | WT = TAT-BT |
|---------|---------|-------|------------|-----------|-------------|
| P1      | 0       | 24    | 24         | 24        | 0           |
| P2      | 0       | 3     | 27         | 27        | 24          |
| P3      | 0       | 3     | 30         | 30        | 27          |
| **Avg** |         |       |            | **27.0**  | **17.0**    |

### Convoy Effect
Short processes stuck behind long one → terrible average wait.
**If order was P2, P3, P1**: Avg WT = 3.0 (vs 17.0)!

---

## 5.4 SJF (Shortest Job First) — Non-Preemptive

### Algorithm
- Pick process with **shortest next CPU burst**
- Tie-breaker: FCFS
- **Optimal** for minimum average waiting time (non-preemptive)

### Example

| Process | Burst |
|---------|-------|
| P1      | 6     |
| P2      | 8     |
| P3      | 7     |
| P4      | 3     |

**Order**: P4(3) → P1(6) → P3(7) → P2(8)

**Gantt:**
```
Time: 0      3      9      16     24
      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼
┌───────┬───────┬───────┬───────┐
│ P4(3) │ P1(6) │ P3(7) │ P2(8) │
└───────┴───────┴───────┴───────┘
```

| Process | Arrival | Burst | Completion | TAT | WT |
|---------|---------|-------|------------|-----|----|
| P1      | 0       | 6     | 9          | 9   | 3  |
| P2      | 0       | 8     | 24         | 24  | 16 |
| P3      | 0       | 7     | 16         | 16  | 9  |
| P4      | 0       | 3     | 3          | 3   | 0  |
| **Avg** |         |       |            | 13.0| 7.0|

**FCFS avg WT = 10.25**, **SJF avg WT = 7.0** → SJF wins!

### Starvation Problem
Long jobs may wait forever if short jobs keep arriving.
**Fix**: Aging (gradually increase priority of waiting processes).

---

## 5.5 SRTF (Shortest Remaining Time First) — Preemptive SJF

### Algorithm
- Like SJF but **preemptive**
- If new arrival has **shorter remaining time** than current → preempt
- **Optimal** for minimum average waiting time (overall)

### Example with Arrival Times

| Process | Arrival | Burst |
|---------|---------|-------|
| P1      | 0       | 8     |
| P2      | 1       | 4     |
| P3      | 2       | 9     |
| P4      | 3       | 5     |

**Step-by-Step Trace:**

```
t=0: P1 arrives (rem=8). Only P1 ready. RUN P1.
t=1: P2 arrives (rem=4). 4 < 7 (P1's rem). PREEMPT P1, RUN P2.
t=2: P3 arrives (rem=9). 9 > 3 (P2's rem). P2 continues.
t=3: P4 arrives (rem=5). 5 > 2 (P2's rem). P2 continues.
t=5: P2 completes. Ready: P1(rem=7), P3(9), P4(5). RUN P4 (shortest=5).
t=10: P4 completes. Ready: P1(7), P3(9). RUN P1.
t=17: P1 completes. RUN P3.
t=26: P3 completes.
```

**Gantt:**
```
Time: 0  1  5  10  17  26
      │  │  │   │   │   │
      ▼  ▼  ▼   ▼   ▼   ▼
┌────┬──┬────┬────┬────┐
│ P1 │P2│ P4 │ P1 │ P3 │
│ 0-1│1-5│5-10│10-17│17-26
└────┴──┴────┴────┴────┘
```

**Calculations:**
| Process | Arrival | Burst | Completion | TAT = C-A | WT = TAT-BT |
|---------|---------|-------|------------|-----------|-------------|
| P1      | 0       | 8     | 17         | 17        | 9           |
| P2      | 1       | 4     | 5          | 4         | 0           |
| P3      | 2       | 9     | 26         | 24        | 15          |
| P4      | 3       | 5     | 10         | 7         | 2           |
| **Avg** |         |       |            | **13.0**  | **6.5**     |

**Compare**: SJF (non-preemptive) avg WT = 7.0, SRTF avg WT = 6.5

---

## 5.6 Priority Scheduling

### Algorithm
- Each process has priority number
- **Convention** (Silberschatz): **Smaller number = Higher priority**
- Can be preemptive or non-preemptive
- SJF is special case: priority = 1 / burst_time

### Example: Preemptive (Smaller = Higher Priority)

| Process | Arrival | Burst | Priority |
|---------|---------|-------|----------|
| P1      | 0       | 4     | 2        |
| P2      | 1       | 3     | 3        |
| P3      | 2       | 1     | 4        |
| P4      | 3       | 5     | 1 (HIGHEST) |
| P5      | 4       | 2     | 1 (HIGHEST) |

**Trace:**
```
t=0: P1 starts (pri=2)
t=1: P2 arrives (pri=3 > 2). P1 continues.
t=2: P3 arrives (pri=4 > 2). P1 continues.
t=3: P4 arrives (pri=1 < 2). PREEMPT P1, RUN P4.
t=4: P5 arrives (pri=1 = P4). FCFS keeps P4.
t=8: P4 completes. Ready: P5(pri=1), P2(pri=3), P3(pri=4), P1(pri=2, rem=1).
      RUN P5 (pri=1).
t=10: P5 completes. RUN P1 (pri=2, rem=1).
t=11: P1 completes. RUN P2 (pri=3).
t=14: P2 completes. RUN P3 (pri=4).
t=15: P3 completes.
```

**Gantt:**
```
Time: 0  1  2  3  8  10  11  14  15
      │  │  │  │   │   │   │   │
      ▼  ▼  ▼  ▼   ▼   ▼   ▼   ▼
┌────┬──┬──┬───┬───┬────┬────┐
│ P1 │P2│P3│ P4│ P5│ P1│ P2│ P3│
│ 0-1│1-2│2-3│3-8│8-10│10-11│11-14│14-15
└────┴──┴──┴───┴───┴────┴────┘
```

### Priority Inversion Problem
```
High-priority H needs mutex held by Low-priority L
    H blocks
Medium-priority M runs (preempts L)
    L can't release mutex
    H blocked by M indirectly!
```
**Fix**: Priority Inheritance (L temporarily inherits H's priority).

---

## 5.7 Round Robin (RR)

### Algorithm
- Preemptive FCFS with **time quantum (q)**
- Process runs ≤ q, then moves to tail of ready queue
- q typically 10-100ms

### Example: q=4, All Arrive at 0

| Process | Burst |
|---------|-------|
| P1      | 24    |
| P2      | 3     |
| P3      | 3     |

**Trace:**
```
t=0:   RUN P1 (4ms), rem=20 → tail
t=4:   RUN P2 (3ms), completes at t=7
t=7:   RUN P3 (3ms), completes at t=10
t=10:  Only P1 left. Runs in 4ms quanta until done at t=30.
```

**Gantt:**
```
Time: 0  4  7  10 14 18 22 26 30
      │  │  │  │  │  │  │  │  │
      ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼
┌────┬──┬──┬───┬───┬───┬───┬───┐
│ P1 │P2│P3│ P1│ P1│ P1│ P1│ P1│
│ 4  │ 3│ 3│ 4 │ 4 │ 4 │ 4 │ 4 │
└────┴──┴──┴───┴───┴───┴───┴───┘
```

**Calculations:**
| Process | Arrival | Burst | Completion | TAT | WT |
|---------|---------|-------|------------|-----|----|
| P1      | 0       | 24    | 30         | 30  | 6  |
| P2      | 0       | 3     | 7          | 7   | 4  |
| P3      | 0       | 3     | 10         | 10  | 7  |
| **Avg** |         |       |            | 15.7| 5.7|

### Quantum Selection Rules
| Quantum Size | Behavior |
|--------------|----------|
| **q → ∞** | Becomes FCFS |
| **q → 0** | Processor sharing (each gets 1/n speed), but context switch overhead kills performance |
| **Optimal** | ~80% of CPU bursts complete within one quantum |

### Maximum Waiting Time Bound
```
With n processes in ready queue:
Max wait for any process = (n - 1) × q
```

---

## 5.8 Complete Calculation Program

```c
/*
 * File: scheduling_calc.c
 * Purpose: Calculate FCFS, SJF, SRTF, RR, Priority metrics
 * Compile: gcc -o scheduling_calc scheduling_calc.c -lm
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PROCESSES 100

typedef struct {
    int pid;
    int arrival;
    int burst;
    int priority;
    int remaining;
    int completion;
    int tat;
    int wt;
    int rt;
    int started;
} Process;

void print_gantt(Process p[], int n, int quantum) {
    printf("\nGantt Chart (time quantum = %d):\n", quantum);
    // Simplified - real implementation would track execution segments
}

void calculate_metrics(Process p[], int n) {
    float avg_tat = 0, avg_wt = 0, avg_rt = 0;
    printf("\n%-5s %-10s %-10s %-12s %-10s %-10s %-10s\n",
           "PID", "Arrival", "Burst", "Completion", "TAT", "WT", "RT");
    for (int i = 0; i < n; i++) {
        p[i].tat = p[i].completion - p[i].arrival;
        p[i].wt = p[i].tat - p[i].burst;
        avg_tat += p[i].tat;
        avg_wt += p[i].wt;
        avg_rt += p[i].rt;
        printf("%-5d %-10d %-10d %-12d %-10d %-10d %-10d\n",
               p[i].pid, p[i].arrival, p[i].burst,
               p[i].completion, p[i].tat, p[i].wt, p[i].rt);
    }
    printf("Average: TAT=%.2f, WT=%.2f, RT=%.2f\n",
           avg_tat/n, avg_wt/n, avg_rt/n);
}

/* FCFS Implementation */
void fcfs(Process p[], int n) {
    // Sort by arrival, then by original order
    for (int i = 0; i < n-1; i++) {
        for (int j = i+1; j < n; j++) {
            if (p[i].arrival > p[j].arrival ||
                (p[i].arrival == p[j].arrival && p[i].pid > p[j].pid)) {
                Process tmp = p[i]; p[i] = p[j]; p[j] = tmp;
            }
        }
    }
    
    int time = 0;
    for (int i = 0; i < n; i++) {
        if (time < p[i].arrival) time = p[i].arrival;
        p[i].rt = time - p[i].arrival;
        time += p[i].burst;
        p[i].completion = time;
    }
    printf("\n=== FCFS ===\n");
    calculate_metrics(p, n);
}

/* SJF Non-Preemptive */
void sjf_np(Process p[], int n) {
    int completed = 0, time = 0;
    int done[MAX_PROCESSES] = {0};
    
    while (completed < n) {
        int shortest = -1;
        int min_burst = 999999;
        
        // Find shortest job among arrived processes
        for (int i = 0; i < n; i++) {
            if (!done[i] && p[i].arrival <= time && p[i].burst < min_burst) {
                min_burst = p[i].burst;
                shortest = i;
            }
        }
        
        if (shortest == -1) {
            time++; // No job ready, advance time
            continue;
        }
        
        if (time < p[shortest].arrival) time = p[shortest].arrival;
        p[shortest].rt = time - p[shortest].arrival;
        time += p[shortest].burst;
        p[shortest].completion = time;
        done[shortest] = 1;
        completed++;
    }
    printf("\n=== SJF (Non-Preemptive) ===\n");
    calculate_metrics(p, n);
}

/* SRTF Preemptive */
void srtf(Process p[], int n) {
    // Reset remaining times
    for (int i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
        p[i].started = 0;
        p[i].completion = 0;
    }
    
    int time = 0, completed = 0;
    
    while (completed < n) {
        int shortest = -1;
        int min_rem = 999999;
        
        for (int i = 0; i < n; i++) {
            if (p[i].remaining > 0 && p[i].arrival <= time && p[i].remaining < min_rem) {
                min_rem = p[i].remaining;
                shortest = i;
            }
        }
        
        if (shortest == -1) {
            time++;
            continue;
        }
        
        if (!p[shortest].started) {
            p[shortest].rt = time - p[shortest].arrival;
            p[shortest].started = 1;
        }
        
        p[shortest].remaining--;
        time++;
        
        if (p[shortest].remaining == 0) {
            p[shortest].completion = time;
            completed++;
        }
    }
    printf("\n=== SRTF (Preemptive SJF) ===\n");
    calculate_metrics(p, n);
}

/* Round Robin */
void rr(Process p[], int n, int quantum) {
    for (int i = 0; i < n; i++) {
        p[i].remaining = p[i].burst;
        p[i].started = 0;
        p[i].completion = 0;
    }
    
    int time = 0, completed = 0;
    int queue[MAX_PROCESSES];
    int front = 0, rear = 0;
    int in_queue[MAX_PROCESSES] = {0};
    
    // Initial queue by arrival
    for (int i = 0; i < n; i++) {
        if (p[i].arrival == 0) {
            queue[rear++] = i;
            in_queue[i] = 1;
        }
    }
    
    while (completed < n) {
        // Add newly arrived
        for (int i = 0; i < n; i++) {
            if (p[i].arrival == time && !in_queue[i] && p[i].remaining > 0) {
                queue[rear++] = i;
                in_queue[i] = 1;
            }
        }
        
        if (front == rear) {
            time++;
            continue;
        }
        
        int idx = queue[front++];
        if (!p[idx].started) {
            p[idx].rt = time - p[idx].arrival;
            p[idx].started = 1;
        }
        
        int exec = (p[idx].remaining < quantum) ? p[idx].remaining : quantum;
        p[idx].remaining -= exec;
        time += exec;
        
        // Add arrivals during execution
        for (int t = time - exec + 1; t <= time; t++) {
            for (int i = 0; i < n; i++) {
                if (p[i].arrival == t && !in_queue[i] && p[i].remaining > 0) {
                    queue[rear++] = i;
                    in_queue[i] = 1;
                }
            }
        }
        
        if (p[idx].remaining > 0) {
            queue[rear++] = idx; // Re-queue
        } else {
            p[idx].completion = time;
            completed++;
        }
    }
    printf("\n=== Round Robin (q=%d) ===\n", quantum);
    calculate_metrics(p, n);
}

int main() {
    // Example: P1(0,24), P2(0,3), P3(0,3)
    Process processes[] = {
        {1, 0, 24, 0, 0, 0, 0, 0, 0, 0},
        {2, 0, 3, 0, 0, 0, 0, 0, 0, 0},
        {3, 0, 3, 0, 0, 0, 0, 0, 0, 0},
    };
    int n = 3;
    
    // Make copies for each algorithm
    Process p_fcfs[MAX_PROCESSES], p_sjf[MAX_PROCESSES];
    Process p_srtf[MAX_PROCESSES], p_rr[MAX_PROCESSES];
    
    memcpy(p_fcfs, processes, n * sizeof(Process));
    memcpy(p_sjf, processes, n * sizeof(Process));
    memcpy(p_srtf, processes, n * sizeof(Process));
    memcpy(p_rr, processes, n * sizeof(Process));
    
    fcfs(p_fcfs, n);
    sjf_np(p_sjf, n);
    srtf(p_srtf, n);
    rr(p_rr, n, 4);
    
    return 0;
}
```

**Run it:**
```bash
gcc -o scheduling_calc scheduling_calc.c -lm
./scheduling_calc
```

---

## 5.9 Algorithm Comparison Summary

| Algorithm | Preemptive | Starvation | Optimal For | Complexity |
|-----------|------------|------------|-------------|------------|
| **FCFS** | No | No | Simple batch | O(1) |
| **SJF** | No | Yes (long jobs) | Min avg wait (non-preempt) | O(n log n) |
| **SRTF** | Yes | Yes (long jobs) | **Min avg wait (overall)** | O(n log n) |
| **Priority** | Both | Yes (low prio) | Importance-based | O(n log n) |
| **RR** | Yes | No | Time-sharing, fairness | O(1) |
| **MLFQ** | Yes | No (with aging) | General purpose | O(1) |

---

## 5.10 Exam Traps

| Trap | Reality |
|------|---------|
| "SJF is always optimal" | Only non-preemptive optimality; SRTF is overall optimal |
| "RR with q=∞ is SJF" | RR with q=∞ is **FCFS** |
| "Smaller priority number = lower priority" | **Silberschatz: smaller = HIGHER priority** |
| "Response time = Waiting time" | **RT = First Run - Arrival** (different!) |
| "Context switch time is zero" | **Pure overhead** — adds to WT/TAT |

---

## 5.11 Practice Problems

### Problem 1: FCFS with Arrivals
```
P1: AT=0, BT=5
P2: AT=1, BT=3
P3: AT=2, BT=8
P4: AT=3, BT=6
```
Calculate Gantt, TAT, WT, RT for each. What is avg WT?

### Problem 2: SRTF Trace
```
P1: AT=0, BT=7
P2: AT=2, BT=4
P3: AT=4, BT=1
P4: AT=5, BT=4
```
Draw Gantt chart step by step.

### Problem 3: RR with q=2
```
P1: AT=0, BT=5
P2: AT=1, BT=3
P3: AT=2, BT=2
```
Draw Gantt. Calculate avg WT.

### Problem 4: Priority Preemptive
```
P1: AT=0, BT=6, Pri=3
P2: AT=1, BT=2, Pri=1
P3: AT=2, BT=4, Pri=2
```
(Smaller = higher priority). Trace execution.

---

*Next: Topic 12 (Synchronization) with complete semaphore/mutex/condition variable programs*