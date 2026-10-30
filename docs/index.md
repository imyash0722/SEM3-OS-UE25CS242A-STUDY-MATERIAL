# OS Exam Prep — UE25CS242A (Units 1–3)

Complete study guide for Operating Systems (UE25CS242A) covering Units 1, 2, and 3.

## Course Information

| Detail | Value |
|--------|-------|
| **Course** | Operating Systems (UE25CS242A) |
| **Exam Date** | Oct 28, 2026 |
| **Coverage** | Units 1, 2, 3 (100 MCQs total: 35 Unit 1 + 35 Unit 2 + 30 Unit 3) |
| **Focus** | Lab C Programs, System Calls, Tracing, Timing Calculations, Synchronization & Memory Management |

## Textbooks

- **Silberschatz, Galvin, Gagne** — *Operating System Concepts*, 10th Ed., Wiley (2023)
- **Stallings** — *Operating Systems: Internals and Design Principles*, 9th Ed., Pearson (2018)
- **Stevens & Rago** — *Advanced Programming in the Unix Environment*, 3rd Ed., Pearson (2017)

## Quick Navigation

### Unit 1: Introduction & Process Management (35 MCQs)
1. [OS Introduction](01_os_introduction.md)
2. [Computer Architecture](02_computer_architecture.md)
3. [OS Services & Process Concept](03_os_services_process_concept.md)
4. [Process Creation & Termination](04_process_creation_termination.md)
5. [CPU Scheduling: FCFS & SJF](05_cpu_scheduling_fcfs_sjf.md)
6. [CPU Scheduling: Priority & RR](06_cpu_scheduling_priority_rr.md)
7. [CPU Scheduling: MLQ & MLFQ](07_cpu_scheduling_mlq_mlfq.md)
8. [Shell & Cron](08_shell_cron.md)

### Unit 2: IPC, Threads & Concurrency (35 MCQs)
9. [IPC: Shared Memory & Message Passing](09_ipc_shared_memory_message_passing.md)
10. [Threads & Multicore](10_threads_multicore.md)
11. [Multicore Kernel Concepts](11_multicore_kernel_concepts.md)
12. [Synchronization](12_synchronization_software_approaches.md)
13. [Deadlocks](13_deadlocks.md)
14. [Signals](14_signals.md)

### Unit 3: Memory Management (30 MCQs)
15. [Main Memory](15_main_memory.md)
16. [Swapping & Fragmentation](16_swapping_fragmentation.md)
17. [Segmentation](17_segmentation.md)
18. [Paging](18_paging.md)
19. [Page Tables, TLB & EAT](19_page_table_tlb_eat.md)
20. [Virtual Memory & Demand Paging](20_virtual_memory_demand_paging.md)
21. [Page Replacement & Thrashing](21_page_replacement_thrashing.md)
22. [NUMA & Clock Replacement](22_numa_clock_replacement.md)

## Exam Preparation Checklist

### Must-Know Algorithms (Trace by Hand)
- [ ] FCFS, SJF, SRTF, RR, Priority — calculate wait/turnaround
- [ ] Banker's Algorithm — safety check, request granting
- [ ] Producer-Consumer — semaphore setup, wait/signal order
- [ ] Readers-Writers — read_count logic
- [ ] Peterson's Algorithm — 2-process mutual exclusion
- [ ] Dining Philosophers — 3 deadlock-free solutions
- [ ] Page Replacement — FIFO, LRU, Optimal, Clock

### Must-Know Concepts
- [ ] Process vs Thread, PCB vs TCB
- [ ] User/Kernel mode, system calls, interrupts
- [ ] Context switch components
- [ ] Race condition, critical section, 3 requirements
- [ ] Spinlock vs mutex vs semaphore
- [ ] Priority inversion + inheritance
- [ ] Memory hierarchy, caching principle
- [ ] MLFQ aging/demotion/promotion
- [ ] COW fork(), virtual memory, demand paging
- [ ] TLB, EAT calculation
- [ ] NUMA, memory locality

### Code-Level Understanding
- [ ] `fork()`/`exec()`/`wait()` flow
- [ ] `pthread_create`/`join`/`mutex_lock`/`cond_wait`
- [ ] `sem_wait`/`sem_post` for producer-consumer, readers-writers
- [ ] Signal handlers with `sigaction()`
- [ ] `mmap()` for memory-mapped files
- [ ] `sched_setaffinity()` for CPU pinning
- [ ] Banker's algorithm trace

## Study Strategy

1. **Read topics in order** — each builds on previous
2. **Draw diagrams** — scheduling Gantt charts, memory layouts, RAGs, state transitions
3. **Trace examples by hand** — don't just read solutions
4. **Write small C programs** — fork, threads, mutex, semaphores, signals
5. **Connect concepts** — how does MLFQ use aging? How does priority inheritance fix inversion?
6. **Ask "what if?"** — quantum too small? No aging? Wait/signal reversed?

---

*Generated from course materials: Silberschatz 10e, Stallings 9e, Stevens & Rago 3e*