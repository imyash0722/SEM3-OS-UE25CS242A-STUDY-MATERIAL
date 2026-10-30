# Chapter 7: Multicore Kernel Concepts & SMP Scheduling

**Textbook References**: [Silberschatz 10e, Ch. 2, 5] • [Stallings 9e, Ch. 15] • [Stevens & Rago 3e, Ch. 2]

---

## 7.1 SMP vs AMP [Silberschatz 10e, §2.1]

| Architecture | Description | [Silberschatz 10e, §2.1] |
|--------------|-------------|--------------------------|
| **AMP (Asymmetric)** | Master handles OS scheduling, syscalls, I/O; Workers run user apps only. Simple but master = bottleneck | |
| **SMP (Symmetric)** | **All cores peers** — any core runs user processes, kernel code, handles interrupts. **Modern standard** (Linux, Windows, macOS, Android, iOS) | |

> **Silberschatz**: "In symmetric multiprocessing (SMP), each processor is self-scheduling; all processes in the ready queue can be scheduled on any processor." [Silberschatz 10e, §2.1.2]

---

## 7.2 Ready Queue Organization [Silberschatz 10e, §5.6; Stallings 9e, §15.3]

### Common Ready Queue (Doesn't Scale) [Silberschatz 10e, Fig. 5.11]
```
All cores → [GLOBAL LOCK] → Single Queue → Core 0
                        │
                        ├──→ Core 1
                        │
                        └──→ Core 2
```
- **One global lock** protects queue
- All cores **serialize** on lock
- Contention → cache line ping-pong → throughput collapses

> **Silberschatz Fig. 5.11**: "Common ready queue vs. per-processor run queues" [Silberschatz 10e, Fig. 5.11]

### Per-Core Run Queues (Modern Standard — Linux CFS) [Silberschatz 10e, §5.6.2]
```
Core 0: [Queue 0] → Core 0
Core 1: [Queue 1] → Core 1
Core 2: [Queue 2] → Core 2
```
- **No lock on fast path** — each core owns its queue
- Lock only needed for **migration** (load balancing)
- Linux CFS: each CPU has `struct rq` (run queue)

> **Silberschatz**: "To avoid the lock contention of a single ready queue, most modern SMP kernels use per-processor run queues." [Silberschatz 10e, §5.6.2]

### Kernel Parallelism [Silberschatz 10e, §5.6.3]
- Multiple cores run kernel code simultaneously
- **Solution**: Partition kernel state (per-CPU variables, RCU, per-CPU allocators)
- Synchronize **only** for cross-core operations (migration, IPI)

---

## 7.3 Hardware Multithreading (SMT / Hyper-Threading) [Silberschatz 10e, §5.4; Stallings 9e, §15.2]

### The Memory Stall Problem [Silberschatz 10e, Fig. 5.12]
```
Single Thread on Core:
┌─────────┬──────────────┬─────────┬──────────────┐
│ Compute │  MEMORY      │ Compute │  MEMORY      │  Time
│  (C)    │  STALL (M)   │  (C)    │  STALL (M)   │  →
└─────────┴──────────────┴─────────┴──────────────┘
  50%      50% idle       50%      50% idle
```
- CPU ~3-4 GHz, DRAM ~100-300 cycles latency
- **Cache miss = core sits idle for 100-400 cycles**

> **Silberschatz Fig. 5.12**: "Memory stall timeline on a single hardware thread" [Silberschatz 10e, Fig. 5.12]

### SMT Solution: Two Hardware Threads per Core [Silberschatz 10e, Fig. 5.13]
```
Thread 0:  [ C0 ] [ M0 ] [ C0 ] [ M0 ] [ C0 ]
Thread 1:  [ M1 ] [ C1 ] [ M1 ] [ C1 ] [ M1 ]
           ┬      ┬      ┬      ┬      ┬
Core:      C0     C1     C0     C1     C0   → Near 100% utilization!
```

**Hardware provides**: Duplicate register file, PC, stack pointer per hardware thread
**Shared**: Execution units (ALU, FPU), L1/L2 cache, TLB

> **Silberschatz Fig. 5.13**: "Multithreaded core cycle interleaving" [Silberschatz 10e, Fig. 5.13]

### Terminology [Silberschatz 10e, §5.4.2]
| Term | Meaning |
|------|---------|
| **Physical Core** | Actual silicon core with execution units |
| **Hardware Thread / Logical CPU** | Architectural state (registers, PC) — appears as CPU to OS |
| **SMT** | Simultaneous Multi-Threading (generic) |
| **Hyper-Threading** | Intel's SMT (2 threads/core) |
| **CMT** | Chip Multi-Threading = Multi-core + SMT |

```
4 cores × 2 threads = 8 Logical CPUs → OS sees 8 CPUs
```

> **Silberschatz Fig. 5.14**: "Chip multithreading architecture" [Silberschatz 10e, Fig. 5.14]

---

## 7.4 Multicore Load Balancing [Silberschatz 10e, §5.6.4]

With per-core queues, imbalance happens: Core 0 has 10 tasks, Core 1 has 0.

### Push Migration [Silberschatz 10e, §5.6.4]
```
Kernel daemon (periodic):
  1. Scan all run queues
  2. Find overloaded (len > avg + threshold) and idle
  3. PUSH tasks from overloaded → underloaded
```
- **Proactive**, centralized
- Overhead: periodic scanning

### Pull Migration (Work Stealing) [Silberschatz 10e, §5.6.4]
```
Idle Core 1:
  1. Detect own queue empty
  2. Randomly pick victim core
  3. STEAL half its tasks
```
- **Reactive**, decentralized
- **Linux CFS uses BOTH** — push for large imbalances, pull for idle cores

### NUMA Awareness [Silberschatz 10e, §5.6.4]
```
Node 0 (CPUs 0-3, Local RAM)     Node 1 (CPUs 4-7, Local RAM)
     │                                    │
     └── Prefer migrating within node ────┘
           (local RAM access = fast)
           Cross-node = slow (interconnect)
```
- Linux scheduler tracks **NUMA topology**
- Prefers same-node migration; cross-node only if severe imbalance

> **Silberschatz**: "Load balancing is essential for effective use of SMP systems." [Silberschatz 10e, §5.6.4]

---

## 7.5 Processor Affinity [Silberschatz 10e, §5.6.5]

### Why It Matters [Silberschatz 10e, §5.6.5]
```
Thread runs on Core 0:
  L1/L2 cache fills with thread's data (WARM)
  
Thread migrates to Core 1:
  Core 0 cache lines invalidated
  Core 1 suffers COLD misses (100+ cycles each)
  Performance tanks until cache re-warms
```

### Affinity Types [Silberschatz 10e, §5.6.5]
| Type | Guarantee |
|------|-----------|
| **Soft Affinity** | Scheduler **prefers** same core but **will migrate** for load balancing (Linux default) |
| **Hard Affinity** | OS **pins** thread to specific CPU subset via syscall |

### Linux Hard Affinity API [Stevens & Rago 3e, §12.7]
```c
#define _GNU_SOURCE
#include <sched.h>

cpu_set_t mask;
CPU_ZERO(&mask);
CPU_SET(2, &mask);   // Pin to CPU 2 only
CPU_SET(3, &mask);   // Or CPU 3

sched_setaffinity(0, sizeof(mask), &mask);  // pid=0 = current process
```

**Use cases**:
- Real-time tasks (deterministic latency)
- HPC (MPI processes pinned to cores)
- License-bound software (per-core licensing)
- Cache-sensitive workloads (databases, games)

**Check affinity**:
```bash
taskset -cp <pid>        # View
taskset -cp 2,3 <pid>    # Set
```

---

## 7.6 Modern SMP Kernel Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATIONS                              │
│              (pthreads, processes, containers)              │
├─────────────────────────────────────────────────────────────┤
│              SYSCALL INTERFACE (entry/exit)                 │
├─────────────────────────────────────────────────────────────┤
│              KERNEL SCHEDULER (CFS)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Run Queue 0 │ │ Run Queue 1 │ │ Run Queue 2 │  ...      │
│  │ (CPU 0)     │ │ (CPU 1)     │ │ (CPU 2)     │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
│         │               │               │                  │
│         └───────────────┼───────────────┘                  │
│                     Load Balancer                          │
│              (Push + Pull, NUMA-aware)                     │
├─────────────────────────────────────────────────────────────┤
│              HARDWARE ABSTRACTION                           │
│  Physical Cores × Hardware Threads = Logical CPUs           │
│  (SMT/Hyper-Threading fills memory stalls)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways
- **SMP** = all cores peers; any core runs kernel, schedules, handles interrupts [Silberschatz 10e, §2.1.2]
- **Per-core run queues** = eliminate global lock contention (Linux CFS) [Silberschatz 10e, §5.6.2]
- **SMT/Hyper-Threading** = fills memory stall cycles with another thread's work [Silberschatz 10e, §5.4]
- **Load balancing** = push (periodic) + pull (work stealing), NUMA-aware [Silberschatz 10e, §5.6.4]
- **Affinity** = soft (preference) vs hard (pinning via `sched_setaffinity`) [Silberschatz 10e, §5.6.5]
- **Cache warmth** = migration costs 1000s of cycles in cold misses [Silberschatz 10e, §5.6.5]

---

**Further Reading**: [Silberschatz 10e, Ch. 2, 5] • [Stallings 9e, Ch. 15] • [Stevens & Rago 3e, Ch. 2]