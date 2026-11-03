# Topic 11 (Detailed): Multicore Kernel Concepts & SMP Scheduling

**Source**: Lecture 5 (Unit 2) + Textbook Ch. 7 (Silberschatz Ch. 2, 5, Stallings Ch. 15, Stevens & Rago Ch. 2)

---

## 11.1 SMP vs AMP

### Asymmetric Multiprocessing (AMP)

```
Master CPU                          Worker CPUs
┌──────────────────┐               ┌──────────────────┐
│ Runs OS kernel   │               │ Run user apps    │
│ Handles all      │               │                  │
│ scheduling, I/O  │               │                  │
└────────┬─────────┘               └──────────────────┘
         │
    Master = BOTTLENECK
```

### Symmetric Multiprocessing (SMP) — Modern Standard

```
ALL CPUs are PEERS:
┌─────────────────────────────────────────────────────────┐
│  CPU 0          CPU 1          CPU 2          CPU 3     │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│ │ Kernel   │  │ Kernel   │  │ Kernel   │  │ Kernel   │ │
│ │ + User   │  │ + User   │  │ + User   │  │ + User   │ │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│      │            │            │            │          │
│      └────────────┼────────────┼────────────┘          │
│                   ▼                                  │
│            Shared Memory (via System Bus)              │
└─────────────────────────────────────────────────────────┘

Every CPU:
- Runs kernel code
- Handles interrupts
- Schedules processes
- No master-slave relationship
```

---

## 11.2 Multicore Architecture

### Core vs Thread

| Term | Meaning |
|------|---------|
| **Physical Core** | Actual silicon with execution units (ALU, FPU) |
| **Hardware Thread / Logical CPU** | Architectural state (registers, PC, stack pointer) |
| **SMT** | Simultaneous Multi-Threading (generic) |
| **Hyper-Threading** | Intel's SMT (2 threads/core) |

```
4 Cores × 2 Threads = 8 Logical CPUs

Physical Package:
┌────────────────────────────────────────────────┐
│ CORE 0              CORE 1                      │
│  Thread 0  Thread 1    Thread 0  Thread 1      │
│   (CPU 0)  (CPU 1)      (CPU 2)  (CPU 3)       │
│       │       │           │       │             │
│       └───────┼───────────┼───────┘             │
│               ▼           ▼                     │
│         Shared L2/L3 Cache                      │
└───────────────────┬─────────────────────────────┘
                    │
              System Bus
                    │
              Main Memory
```

### Why SMT?

```
Single Thread on Core:
┌─────────┬──────────────┬─────────┬──────────────┐
│ Compute │  MEMORY      │ Compute │  MEMORY      │  Time
│  (C)    │  STALL (M)   │  (C)    │  STALL (M)   │  →
└─────────┴──────────────┴─────────┴──────────────┘
  50%      50% idle       50%      50% idle
```

CPU runs at ~3-4 GHz, DRAM latency ~100-300 cycles → core sits idle on cache miss.

### SMT: Two Threads Fill Stalls

```
Thread 0:  [ C0 ] [ M0 ] [ C0 ] [ M0 ] [ C0 ]
Thread 1:  [ M1 ] [ C1 ] [ M1 ] [ C1 ] [ M1 ]
           ┬      ┬      ┬      ┬      ┬
Core:      C0     C1     C0     C1     C0   → Near 100% utilization!
```

Hardware provides duplicate register file, PC, stack pointer per thread. Shared: ALU, FPU, L1/L2 cache, TLB.

---

## 11.3 Ready Queue Organization

### Common Ready Queue (Doesn't Scale)

```
All CPUs → [GLOBAL LOCK] → Single Queue → CPU 0
                         │
                         ├──→ CPU 1
                         │
                         └──→ CPU 2
```

- One global lock protects queue
- All cores **serialize** on lock
- Contention → cache line ping-pong → throughput collapses

### Per-Core Run Queues (Modern Standard — Linux CFS)

```
Core 0: [Queue 0] → CPU 0
Core 1: [Queue 1] → CPU 1
Core 2: [Queue 2] → CPU 2

Linux CFS: each CPU has `struct rq` (run queue)
```

> **Key**: No lock on fast path — each core owns its queue. Lock only needed for **migration** (load balancing).

### Kernel Parallelism

- Multiple cores run kernel code simultaneously
- **Solution**: Partition kernel state (per-CPU variables, RCU, per-CPU allocators)
- Synchronize **only** for cross-core operations (migration, IPI)

---

## 11.4 SMT/Hyper-Threading in Detail

### Hardware View

```
Per Hardware Thread:
- Program Counter (PC)
- General Purpose Registers (RAX, RBX, ...)
- Stack Pointer (RSP)
- Flags Register (RFLAGS)
- Control Registers (CR0, CR3, ...)
- Debug Registers
- FPU/SSE/AVX State (sometimes shared)

Shared:
- L1 Instruction Cache
- L1 Data Cache
- L2 Cache
- Execution Units (ALU, FPU, SIMD)
- TLB (often shared, sometimes duplicated)
- Branch Predictor
```

### OS View: 8 Logical CPUs

```bash
# Check topology
cat /proc/cpuinfo | grep -E "(processor|core id|siblings)"

# Example output for 4 cores × 2 threads:
processor	: 0
core id		: 0
siblings	: 2

processor	: 1
core id		: 0
siblings	: 2

processor	: 2
core id		: 1
siblings	: 2
```

### Scheduling on SMT

```
Linux CFS: Treats each thread as independent CPU
- Sibling threads share core resources
- Scheduler prefers spreading tasks across cores first
- Only packs onto same core when necessary

Kernel aware of topology:
/sys/devices/system/cpu/cpu0/topology/thread_siblings_list
```

---

## 11.5 Multicore Load Balancing

### Push Migration (Periodic)

```
Kernel daemon (every few ms):
1. Scan all run queues
2. Find overloaded (len > avg + threshold) and underloaded
3. PUSH tasks from overloaded → underloaded
```

### Pull Migration (Work Stealing)

```
Idle Core:
1. Detect own queue empty
2. Randomly pick victim core
3. STEAL half its tasks
```

### Linux CFS Uses BOTH

```
Push: Periodic, for large imbalances
Pull: Reactive, for idle cores

NUMA-aware:
- Prefer same-node migration
- Cross-node only for severe imbalance
```

### Load Balancing Metrics

```c
// Simplified load calculation
load = sum(task_weight) for tasks on runqueue

// Imbalance = max_load - min_load
// If imbalance > threshold → balance
```

---

## 11.6 Processor Affinity

### Why It Matters

```
Thread runs on Core 0:
  L1/L2 cache fills with thread's data (WARM)
  
Thread migrates to Core 1:
  Core 0 cache lines invalidated
  Core 1 suffers COLD misses (100+ cycles each)
  Performance tanks until cache re-warms
```

### Affinity Types

| Type | Guarantee |
|------|-----------|
| **Soft Affinity** | Scheduler **prefers** same core but **will migrate** for load balancing (Linux default) |
| **Hard Affinity** | OS **pins** thread to specific CPU subset via syscall |

### Linux Hard Affinity API

```c
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>

void pin_to_cpu(int cpu) {
    cpu_set_t mask;
    CPU_ZERO(&mask);
    CPU_SET(cpu, &mask);
    
    // pid = 0 means current thread
    if (sched_setaffinity(0, sizeof(mask), &mask) == -1) {
        perror("sched_setaffinity");
    }
}

void pin_to_cpus(int *cpus, int n) {
    cpu_set_t mask;
    CPU_ZERO(&mask);
    for (int i = 0; i < n; i++) CPU_SET(cpus[i], &mask);
    sched_setaffinity(0, sizeof(mask), &mask);
}

void print_affinity() {
    cpu_set_t mask;
    CPU_ZERO(&mask);
    sched_getaffinity(0, sizeof(mask), &mask);
    
    printf("Affinity: ");
    for (int i = 0; i < CPU_SETSIZE; i++) {
        if (CPU_ISSET(i, &mask)) printf("%d ", i);
    }
    printf("\n");
}
```

### Check Affinity from Shell

```bash
# View
taskset -cp <pid>

# Set
taskset -cp 2,3 <pid>    # Pin to CPUs 2,3
```

### Use Cases

| Scenario | Affinity Type |
|----------|---------------|
| Real-time tasks | Hard (deterministic latency) |
| HPC (MPI) | Hard (pin ranks to cores) |
| License-bound software | Hard (per-core licensing) |
| Cache-sensitive DB | Hard (keep working set hot) |
| General apps | Soft (default) |

---

## 11.7 Cache Coherency (MESI Protocol)

### The Problem

```
Core 0 reads X=5  → Core 0 cache: X=5 (Shared)
Core 1 reads X=5  → Core 1 cache: X=5 (Shared)
Core 0 writes X=7 → Must invalidate Core 1's copy!
```

### MESI States

| State | Meaning | Can Read? | Can Write? |
|-------|---------|-----------|------------|
| **M**odified | Only this cache has it, dirty | Yes | Yes (silent) |
| **E**xclusive | Only this cache has it, clean | Yes | Yes (silent → M) |
| **S**hared | Multiple caches have it, clean | Yes | No (must invalidate) |
| **I**nvalid | Not in this cache | No | No |

### State Transitions

```
Core 0 reads X:
  Miss → Bus Read → Memory → Core 0: E

Core 1 reads X:
  Miss → Bus Read → Core 0: S, Core 1: S

Core 0 writes X:
  Hit in E → Silent → M

Core 1 reads X (after Core 0 wrote):
  Miss → Bus Read → Core 0: S (writeback), Core 1: S

Core 1 writes X:
  Hit in S → Bus Upgrade → Core 0: I, Core 1: M
```

### False Sharing

```
Thread 0 writes a[0]  → Cache line with a[0..15] goes to M on Core 0
Thread 1 writes a[16] → Same cache line! → Core 1 gets it, Core 0 invalidated
                                                        ↓
                                                Ping-pong!
```

**Fix**: Pad data to cache line size (64 bytes):

```c
struct alignas(64) Counter {
    long value;
    char padding[64 - sizeof(long)];
};
```

---

## 11.8 Complete Modern SMP Kernel Stack

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

## 11.9 Complete Exam-Focused Summary

| Concept | Key Points |
|---------|------------|
| **SMP** | All cores peers; any core runs kernel, schedules, handles interrupts |
| **Multicore** | Multiple cores on one die; each appears as CPU to OS |
| **SMT/Hyper-Threading** | Fills memory stall cycles with another thread's work |
| **Per-core run queues** | Eliminate global lock contention (Linux CFS) |
| **Load balancing** | Push (periodic) + Pull (work stealing), NUMA-aware |
| **Affinity** | Soft (preference) vs Hard (pinning via `sched_setaffinity`) |
| **Cache coherency** | MESI protocol; false sharing kills performance |
| **False sharing fix** | Pad to cache line (64 bytes) |

---

## 11.10 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **SMP vs AMP** | SMP = peers; AMP = master/worker |
| **Multicore benefits** | Faster on-chip comm, less power/heat |
| **SMT purpose** | Fill memory stall cycles |
| **Per-core run queues** | Eliminate global lock contention |
| **Load balancing** | Push (periodic) + Pull (steal) |
| **Hard affinity** | `sched_setaffinity()` pins thread |
| **MESI** | Modified, Exclusive, Shared, Invalid |
| **False sharing** | Different threads on same cache line → ping-pong |
| **Fix false sharing** | Pad to 64-byte cache line |

---

## 11.11 Practice Problems

### Problem 1: SMT Utilization
```
Core has 2 threads.
Thread A: 60% compute, 40% memory stall
Thread B: 30% compute, 70% memory stall
Estimate core utilization with/without SMT.
```

### Problem 2: Load Balancing
```
4 cores, run queue lengths: [10, 2, 0, 8]
Threshold for imbalance = 3
Which cores push/pull?
```

### Problem 3: Affinity
```
Thread pinned to CPU 2.
What syscall? What happens if thread tries to run on CPU 3?
```

### Problem 4: MESI
```
Core 0 has X in Modified state.
Core 1 reads X.
Describe bus transaction and final states.
```

### Problem 5: False Sharing
```
struct { int a; int b; } shared;
Thread 0 increments a, Thread 1 increments b.
Why slow? How to fix?
```

---

*Next: Topic 10 (Threads & Multicore Programming)*