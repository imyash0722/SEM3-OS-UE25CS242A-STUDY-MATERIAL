# Operating Systems (UE25CS242A) — Textbook Index

## Complete Chapter Listing

| Chapter | Title | Source Lectures | Pages |
|---------|-------|-----------------|-------|
| **1** | [Introduction to Operating Systems](ch01_introduction.md) | Unit 1, Lecture 1 | ~50 |
| **2** | [Computer System Architecture](ch02_system_architecture.md) | Unit 1, Lectures 2, 4, 5 | ~40 |
| **3** | [Process Management](ch03_process_management.md) | Unit 1, Lectures 3, 5 | ~50 |
| **4** | [CPU Scheduling](ch04_cpu_scheduling.md) | Unit 1, Lectures 7, 8, 10 | ~50 |
| **5** | [Inter-Process Communication (IPC)](ch05_ipc.md) | Unit 2, Lectures 1, 2 | ~50 |
| **6** | [Threads & Multicore Programming](ch06_threads_multicore.md) | Unit 2, Lectures 2, 4 | ~50 |
| **7** | [Multicore Kernel Concepts](ch07_multicore_kernel.md) | Unit 2, Lecture 5 | ~40 |
| **8** | [Process Synchronization](ch08_synchronization.md) | Unit 2, Lectures 7, 8, 9 | ~60 |
| **9** | [Deadlocks](ch09_deadlocks.md) | Unit 2, Lecture 11 | ~50 |
| **10** | [Shell Programming & Cron](ch10_shell_cron.md) | Unit 1, Lecture 11 | ~30 |
| **11** | [Signals & Signal Handling](ch11_signals.md) | Unit 2, Lecture 13 | ~30 |

---

## Learning Path

### Foundation (Start Here)
1. **Chapter 1** — What is an OS, system organization, interrupts, storage hierarchy
2. **Chapter 2** — Computer architectures: SMP, multicore, clusters, NUMA

### Core OS Concepts
3. **Chapter 3** — Processes: creation, states, PCB, scheduling, context switching
4. **Chapter 4** — CPU Scheduling: FCFS, SJF, RR, Priority, MLFQ
5. **Chapter 5** — IPC: Shared memory, message passing, pipes, sockets
6. **Chapter 6** — Threads: creation, Pthreads API, models, pools, cancellation
7. **Chapter 7** — Multicore Kernels: SMP scheduling, SMT, load balancing, affinity

### Advanced Topics
8. **Chapter 8** — Synchronization: race conditions, mutexes, semaphores, classical problems
9. **Chapter 9** — Deadlocks: characterization, prevention, avoidance, Banker's Algorithm
10. **Chapter 10** — Shell & Cron: scripting, automation
11. **Chapter 11** — Signals: handling, multithreaded delivery, priority inversion

---

## Key Formulas Reference

### Scheduling Metrics
| Metric | Formula |
|--------|---------|
| Turnaround Time | Completion - Arrival |
| Waiting Time | Turnaround - Burst = Completion - Arrival - Burst |
| Response Time | First Start - Arrival |
| Avg Waiting | Σ Wait_i / n |
| RR Max Wait Bound | (n - 1) × q |

### Banker's Algorithm
| Structure | Formula |
|-----------|---------|
| Need[i][j] | Max[i][j] - Allocation[i][j] |
| Available | Total - Σ Allocation |
| Safety Check | Find i: Finish[i]=false ∧ Need[i] ≤ Work |

### Producer-Consumer Semaphores
```
sem_t empty = N;  // free slots
sem_t full = 0;   // filled slots
sem_t mutex = 1;  // buffer protection

// Producer: wait(empty) → wait(mutex) → signal(mutex) → signal(full)
// Consumer: wait(full) → wait(mutex) → signal(mutex) → signal(empty)
```

### Readers-Writers
```
sem_t rw_mutex = 1;  // writer exclusion
sem_t mutex = 1;     // read_count protection
int read_count = 0;

// Writer: wait(rw_mutex) → write → signal(rw_mutex)
// Reader: wait(mutex); read_count++; if(1) wait(rw_mutex); signal(mutex)
//         read → wait(mutex); read_count--; if(0) signal(rw_mutex); signal(mutex)
```

---

## Exam Preparation Checklist

### Must-Know Algorithms (Trace by Hand)
- [ ] FCFS, SJF, SRTF, RR, Priority — calculate wait/turnaround
- [ ] Banker's Algorithm — safety check, request granting
- [ ] Producer-Consumer — semaphore setup, wait/signal order
- [ ] Readers-Writers — read_count logic
- [ ] Peterson's Algorithm — 2-process mutual exclusion
- [ ] Dining Philosophers — 3 deadlock-free solutions

### Must-Know Concepts (Define & Explain)
- [ ] Process vs Thread, PCB vs TCB
- [ ] User/Kernel mode, system calls, interrupts
- [ ] Context switch components
- [ ] Race condition, critical section, 3 requirements
- [ ] Spinlock vs mutex vs semaphore
- [ ] Priority inversion + inheritance
- [ ] Memory hierarchy, caching principle
- [ ] MLFQ aging/demotion/promotion

### Code-Level Understanding
- [ ] `fork()`/`exec()`/`wait()` flow
- [ ] `pthread_create`/`join`/`mutex_lock`
- [ ] `sem_wait`/`sem_post` semantics
- [ ] Signal handlers, async-signal-safety

---

## Lecture-to-Chapter Mapping

| Lecture | Chapter(s) |
|---------|------------|
| Unit 1, Lec 1 | Ch 1 |
| Unit 1, Lec 2 | Ch 2 |
| Unit 1, Lec 3 | Ch 3 |
| Unit 1, Lec 5 | Ch 3, Ch 4 |
| Unit 1, Lec 7 | Ch 4 |
| Unit 1, Lec 8 | Ch 4 |
| Unit 1, Lec 10 | Ch 4 |
| Unit 1, Lec 11 | Ch 10 |
| Unit 2, Lec 1 | Ch 5 |
| Unit 2, Lec 2 | Ch 5, Ch 6 |
| Unit 2, Lec 4 | Ch 6, Ch 7 |
| Unit 2, Lec 5 | Ch 7 |
| Unit 2, Lec 7 | Ch 8 |
| Unit 2, Lec 8 | Ch 8 |
| Unit 2, Lec 9 | Ch 8 |
| Unit 2, Lec 10 | Ch 8 |
| Unit 2, Lec 11 | Ch 9 |
| Unit 2, Lec 13 | Ch 11 |

---

## Study Strategy

1. **Read chapters in order** — each builds on previous
2. **Draw diagrams** — scheduling Gantt charts, memory layouts, RAGs, state transitions
3. **Trace examples by hand** — don't just read solutions
4. **Write small C programs** — fork, threads, mutex, semaphores
5. **Connect concepts** — how does MLFQ use aging? How does priority inheritance fix inversion?
6. **Ask "what if?"** — quantum too small? No aging? Wait/signal reversed?

---

*Generated from UE25CS242A lecture materials (Units 1 & 2)*