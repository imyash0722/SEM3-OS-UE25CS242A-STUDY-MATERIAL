# Topic 2 (Detailed): Computer Architecture & OS Operations

**Source**: Lecture 2 + Textbook Ch. 2 (Silberschatz Ch. 1-2, Stallings Ch. 2, 15, Stevens & Rago Ch. 2)

---

## 2.1 Processor Architectures

### Single Processor Systems

- One general-purpose CPU
- Special-purpose processors: disk controller, keyboard controller, GPU
- Run limited instruction sets; offload main CPU (e.g., disk controller handles scheduling)

---

## 2.2 Multiprocessor Systems

### Characteristics

- Two or more processors in close communication
- Share: system bus, clock, memory, peripheral devices

### Three Advantages

| Advantage | Description |
|-----------|-------------|
| **Increased Throughput** | More work in less time (not N× due to sync overhead) |
| **Economy of Scale** | Share peripherals, storage, power — cheaper than N single-CPU systems |
| **Fault Tolerance** | Failure of one CPU ≠ system halt; graceful degradation |

---

## 2.3 Multiprocessor Types

### Asymmetric Multiprocessing (AMP)

```
Master CPU → Controls system, schedules, allocates work
Worker CPUs → Execute assigned tasks only
```
- Simple but **master becomes bottleneck**

### Symmetric Multiprocessing (SMP) — **Modern Standard**

```
All CPUs are PEERS — no master-slave
Each runs kernel + user code
Each has private registers + cache
All share physical memory via system bus
```
- Used by: Linux, Windows, macOS, Android, iOS

```
SMP Architecture:
  CPU 0          CPU 1          CPU 2
  [Regs] [Cache] [Regs] [Cache] [Regs] [Cache]
     │             │             │
     └─────────────┼─────────────┘
                   ▼
            System Bus
                   │
                   ▼
           Shared Memory
```

---

## 2.4 Multicore Design

- Multiple computing cores on **single chip**
- Each core = independent physical CPU to OS
- **Benefits**: Faster on-chip communication, less power/heat than multi-chip

```
Dual-Core Chip:
  ┌─────────────────────────────────┐
  │         PROCESSOR CHIP          │
  │  ┌──────────┐  ┌──────────┐     │
  │  │  CORE 0  │  │  CORE 1  │     │
  │  │ [Regs]   │  │ [Regs]   │     │
  │  │ [L1]     │  │ [L1]     │     │
  │  └────┬─────┘  └────┬─────┘     │
  │       │             │           │
  │       └──────┬──────┘           │
  │              ▼                  │
  │       [Shared L2/L3 Cache]      │
  └──────────────┬──────────────────┘
                 │
           Main Memory
```

```bash
# Check your CPU topology
cat /proc/cpuinfo | more
```

---

## 2.5 Advanced Architectures

| Architecture | Description |
|--------------|-------------|
| **Blade Servers** | High-density: multiple processor/I/O boards in one chassis; each boots independently |
| **Clustered Systems** | Independent nodes + shared SAN; Asymmetric (hot-standby) / Symmetric (all active) / HPC (MPI/OpenMP) |
| **NUMA** | Non-Uniform Memory Access — latency varies by CPU-memory distance; scheduler must consider locality |
| **big.LITTLE** | Heterogeneous cores (performance + efficiency); scheduler migrates tasks based on workload |

---

## 2.6 OS Operations: Dual-Mode & System Calls

### Dual-Mode Operation

- **User Mode** (bit = 1): Applications run; restricted instructions
- **Kernel Mode** (bit = 0): OS runs; privileged instructions allowed

```
USER MODE (bit=1)                 KERNEL MODE (bit=0)
+-----------------------------+   +-----------------------------+
| User Process executing      |   |                             |
|                             |   |                             |
| Calls system call           |   |                             |
| (e.g. read())               |   |                             |
|         │                   |   |                             |
|         v                   |   |                             |
|   [ TRAP / SYSCALL ] ------>|-->| System call handled         |
|   (HW sets bit = 0)         |   | Execute privileged routine  |
|                             |   |         │                   |
|                             |<--|<--------|--- [ RETURN ]     |
| Resume user execution <-----+   |     (HW resets bit = 1)    |
+-----------------------------+   +-----------------------------+
```

### Transition Lifecycle

1. User program executes in user mode (bit = 1)
2. Program needs OS service → executes **system call** (trap instruction)
3. Hardware: traps, saves CPU state, switches mode bit to 0 (kernel mode)
4. Kernel: looks up syscall table, verifies parameters, executes privileged function
5. Kernel: executes **return-from-trap** (privileged instruction)
6. Hardware: restores state, sets mode bit to 1 (user mode)
7. Control returns to user process

### Privileged Instructions (Kernel Mode Only)

- Direct I/O manipulation
- Clearing interrupts
- Setting timer counters
- Modifying page tables
- Context switching

---

## 2.7 Timer & CPU Protection

**Purpose**: Prevent user programs from hogging CPU (infinite loops)

```
Mechanism:
1. Hardware timer set to interrupt after interval (fixed or variable)
2. Variable timers: fixed-rate clock + internal counter
3. OS loads initial counter via PRIVILEGED INSTRUCTION before dispatch
4. Each clock tick: counter decrements
5. Counter reaches 0 → hardware timer interrupt
6. Interrupt → OS scheduler → preempt current process → assign CPU to another
```

---

## 2.8 Key Takeaways (Memorize)

1. **SMP** = peer CPUs sharing memory; standard for modern OS (Silberschatz §2.1.2)
2. **Multicore** = multiple cores on one die; each appears as CPU to OS (Silberschatz §2.2)
3. **Clusters** = independent nodes + shared SAN; for HA and HPC (Silberschatz §2.3.2)
4. **NUMA/big.LITTLE** = modern complexities OS scheduler must handle (Silberschatz §2.3.3-4)
5. **Dual-mode**: mode bit in PSW; hardware enforces privileged instruction restriction
6. **System call** = trap instruction → mode switch → kernel handler → return
7. **Timer** = hardware mechanism enabling preemptive scheduling

---

## 2.9 Quick Self-Test

| Question | Answer |
|----------|--------|
| AMP vs SMP — which is modern standard? | SMP (all CPUs peers) |
| In SMP, what do CPUs share? | System bus, clock, memory, peripherals |
| What does each core in multicore have? | Private registers + L1 cache |
| What do cores share on-chip? | L2/L3 cache |
| What prevents user program from executing privileged instruction? | Hardware checks mode bit; traps if user mode (bit=1) |
| How does timer enable preemption? | Counter decrements each tick; at 0 → interrupt → scheduler runs |

---

## 2.10 Exam-Relevant MCQ Patterns

- **Q4**: Special-purpose processors (disk controller, GPU) offload main CPU
- **Q5**: Multiprocessor advantages — throughput, economy of scale, fault tolerance (graceful degradation)
- **Q6-7**: AMP (master-worker) vs SMP (peers) — know the diagram
- **Q8**: Multicore benefits — faster on-chip comm, less power/heat
- **Q9**: Blade servers — high-density, each boots independently
- **Q10-11**: Clustered systems — SAN, DLM, asymmetric vs symmetric clustering
- **Q12**: Multiprogramming — CPU always has job; when one waits for I/O, switch to another
- **Q13**: Multitasking/time-sharing — logical extension, rapid response (<1 sec), needs virtual memory
- **Q14**: Interrupt-driven — hardware interrupt (devices) vs software interrupt (trap/exception/syscall)
- **Q15-16**: Dual-mode — mode bit (0=kernel, 1=user), transition via trap/syscall
- **Q17**: Timer — prevents infinite loops, enables preemption, loaded via privileged instruction

---

## 2.11 Practice Problems

### Problem 1: AMP vs SMP
```
Describe the bottleneck in AMP and how SMP solves it.
```

### Problem 2: Multicore
```
Explain why SMT (Hyper-Threading) improves utilization.
```

### Problem 3: Dual-Mode
```
Draw the user/kernel mode transition diagram for a system call.
```

### Problem 4: Timer
```
Explain how the timer interrupt enables preemptive scheduling.
```

### Problem 5: NUMA
```
What is NUMA and why does the scheduler need to be NUMA-aware?
```

---

*Next: Topic 3 (OS Services, System Calls & Process Concept)*