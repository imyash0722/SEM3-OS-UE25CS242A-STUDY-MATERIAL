# Topic 7 (Detailed): CPU Scheduling — Multilevel Queue & Multilevel Feedback Queue

**Source**: Lecture 10 + Textbook Ch. 4 (Silberschatz Ch. 5)

---

## 7.1 Multilevel Queue (MLQ) Scheduling

### Motivation

- Processes can be classified into distinct groups with different response-time requirements
- Single ready queue is inadequate

### Common Partitioning

| Queue Type | Processes | Scheduling |
|------------|-----------|------------|
| **Foreground** | Interactive (low response time) | Round-Robin |
| **Background** | Batch jobs (throughput priority) | FCFS |

### Permanent Assignment

- Processes permanently assigned to one queue at creation
- Based on: memory size, process priority, process type

### Silberschatz Priority Hierarchy

```
HIGHEST PRIORITY
   │   +-------------------------------------------+
   │   | System Processes                          |
   │   +-------------------------------------------+
   │   | Interactive Processes                     |
   │   +-------------------------------------------+
   │   | Interactive Editing Processes             |
   │   +-------------------------------------------+
   │   | Batch Processes                           |
   │   +-------------------------------------------+
   v   | Student Processes                         |
LOWEST PRIORITY
```

### Inter-Queue Scheduling Policies

| Policy | Behavior |
|--------|----------|
| **Fixed-Priority Preemptive** | Higher queues must empty first; lower queues starve if higher busy |
| **Time-Sliced** | Each queue gets CPU fraction (e.g., 80% foreground, 20% background) |

---

## 7.2 Multilevel Feedback Queue (MLFQ) — Self-Tuning

### Core Innovation

- Unlike MLQ, processes **migrate between queues** dynamically
- Adapts to runtime CPU-burst characteristics
- Implements **Aging** to prevent starvation

### Defining Parameters (5)

1. Number of queues
2. Scheduling algorithm per queue
3. Promotion (upgrade) method
4. Demotion (downgrade) method
5. Initial queue for new processes

### Concrete 3-Queue Architecture

```
            [ New Process Enters ]
                      |
                      v
      +-------------------------------+
      | Queue 0 (Q0): RR, Quantum = 8 |
      +---------------+---------------+
                      | (If not completed within 8 ms)
                      v
      +-------------------------------+
      | Queue 1 (Q1): RR, Quantum = 16|
      +---------------+---------------+
                      | (If not completed within 16 ms)
                      v
      +-------------------------------+
      | Queue 2 (Q2): FCFS            |
      +-------------------------------+
```

### Execution & Demotion Rules

1. **Q0 (RR, q=8)**: New process enters; if uses full 8ms → demoted to Q1
2. **Q1 (RR, q=16)**: Runs only when Q0 empty; if uses full 16ms → demoted to Q2
3. **Q2 (FCFS)**: Runs only when Q0 & Q1 empty
4. **Preemption**: Q0 arrival preempts Q1/Q2; Q1 arrival preempts Q2

### Promotion (Aging) Policy

- If process waits too long in Q2 without CPU → promoted to Q1 or Q0
- Guarantees long-running jobs eventually make progress

---

## 7.3 Key Takeaways

1. **MLQ**: Fixed queues, no migration → starvation risk in lower queues
2. **MLFQ**: Dynamic migration → learns process behavior (I/O-bound stay high, CPU-bound sink low)
3. **Aging**: Prevents starvation by promoting long-waiting processes
4. **Modern OS**: Linux CFS, Windows, macOS use MLFQ variants

---

## 7.4 Exam-Relevant MCQ Patterns

- **Q31**: MLQ rigidity — processes permanently assigned, cannot migrate
- **Q32**: MLFQ demotion — CPU-bound processes use full quantum → demoted; I/O-bound release early → stay high

---

## 7.5 Practice Problems

### Problem 1: MLQ vs MLFQ
```
Explain the key difference between MLQ and MLFQ.
```

### Problem 2: MLFQ Trace
```
3 queues: Q0(RR,q=8), Q1(RR,q=16), Q2(FCFS)
Process P: bursts 12, 4, 20, 3
Trace P's queue movements.
```

### Problem 3: MLFQ Parameters
```
What are the 5 defining parameters of MLFQ?
```

### Problem 4: Aging
```
How does aging prevent starvation in MLFQ?
```

### Problem 5: Modern OS
```
Which scheduling algorithm does Linux CFS use? How does it relate to MLFQ?
```

---

*Next: Topic 15 (Main Memory — Hardware, Address Translation, Dynamic Loading/Linking, mmap)*