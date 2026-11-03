# Topic 2 (Detailed): Computer Architecture & OS Operations

**Source**: Lecture 2 + Textbook Ch. 2 (Silberschatz Ch. 1-2, Stallings Ch. 2, 15, Stevens & Rago Ch. 2)

---

## 2.1 Processor Architectures

### Single Processor Systems

- One general-purpose CPU
- Special-purpose processors: disk controller, keyboard controller, GPU
- Run limited instruction sets; offload main CPU (e.g., disk controller handles scheduling)

### Special-Purpose Processors
- Device-specific: disk, keyboard, graphics controller
- Run limited instruction sets
- Low-level components built into hardware, managed by OS
- OS monitors their status
- **Example**: Disk controller microprocessor
  - Receives request sequences from CPU
  - Implements own disk queue and scheduling algorithm
  - Relieves main CPU of disk scheduling overhead

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

### Clustered Systems Details
- Multiple systems working together, sharing storage via SAN
- **Asymmetric clustering**: one machine in hot-standby mode
- **Symmetric clustering**: multiple nodes running applications, monitoring each other
- **HPC clusters**: apps must use parallelization (MPI/OpenMP)
- **DLM (Distributed Lock Manager)**: avoids conflicting operations when multiple hosts access shared storage on SAN

---

## 2.6 OS Operations: Multiprogramming, Multitasking & Dual-Mode

### Multiprogramming (Batch System)
- Single user cannot keep CPU and I/O busy at all times
- Multiprogramming organizes jobs so CPU always has one to execute
- Subset of total jobs kept in memory
- One job selected and run via job scheduling
- When it waits (I/O), OS switches to another job

### Multitasking (Time-Sharing)
- Logical extension: CPU switches jobs frequently so users can interact
- Response time < 1 second
- Each user has at least one program executing in memory → process
- If several jobs ready → CPU scheduling
- If processes don't fit in memory → swapping moves them in/out

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

## 2.7 Interrupt-Driven Operations

### Hardware vs Software Interrupts

| Type | Source | Examples |
|------|--------|----------|
| **Hardware Interrupt** | Devices | Disk I/O complete, network packet, timer |
| **Software Interrupt (Trap/Exception)** | Current instruction | Division by zero, invalid memory access (SIGSEGV), system call |

### Dual-Mode Transition
- **Trap/Interrupt**: Hardware switches from user → kernel mode (mode bit = 0)
- **Return**: System switches back to user mode (mode bit = 1) before returning to user program

### Multi-Mode Operation (Modern CPUs)
- Increasingly support multi-mode operations
- e.g., Virtual Machine Manager (VMM) mode for guest VMs

---

## 2.7 Timer & CPU Protection

### Purpose
Prevent user programs from hogging CPU (infinite loops)

### Mechanism
```
1. Hardware timer set to interrupt after interval (fixed or variable)
2. Variable timers: fixed-rate clock + internal counter
3. OS loads initial counter via PRIVILEGED INSTRUCTION before dispatch
4. Each clock tick: counter decrements
5. Counter reaches 0 → hardware timer interrupt
6. Interrupt → OS scheduler → preempt current process → assign CPU to another
```

### Timer Details
- Fixed interval (e.g., 1/60 sec) or variable (1 msec to 1 sec)
- Variable timer: fixed-rate clock + counter
- OS sets counter via privileged instruction
- Each clock tick decrements counter
- Counter = 0 → hardware timer interrupt
- Can terminate program running too long

---

## 2.8 OS Structure & Operations

### Interrupt-Driven Operations
- **Hardware interrupt** by devices
- **Software interrupt** (exception/trap):
  - Software error (division by zero)
  - Request for OS service (system call)
  - Infinite loop, processes modifying each other or OS

### Other Process Problems
- Infinite loop
- Processes modifying each other or the OS

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
| What is the difference between AMP and SMP? | AMP: master-worker; SMP: all peers |
| What does a disk controller do? | Implements own queue/scheduling; relieves main CPU |
| What is a blade server? | Multiple processor/I/O boards in one chassis; each boots independently |
| What is DLM in clustered systems? | Distributed Lock Manager for shared storage access |

---

## 2.9 Exam-Relevant MCQ Patterns

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

## 2.10 Practice Problems

### Problem 1: AMP vs SMP
```
Describe the bottleneck in AMP and how SMP solves it.
Answer: AMP master CPU becomes bottleneck scheduling all work; SMP makes all CPUs peers with own run queues.
```

### Problem 2: Multicore
```
Explain why SMT (Hyper-Threading) improves utilization.
Answer: Two threads on one core fill memory stall cycles of each other; near 100% core utilization.
```

### Problem 3: Dual-Mode
```
Draw the user/kernel mode transition diagram for a system call.
```

### Problem 4: Timer
```
Explain how the timer interrupt enables preemptive scheduling.
Answer: Counter decrements each tick; at 0 → interrupt → scheduler preempts current process.
```

### Problem 5: NUMA
```
What is NUMA and why does the scheduler need to be NUMA-aware?
Answer: Memory latency varies by CPU-node distance; scheduler must prefer local memory allocation.
```

---

*Next: Topic 3 (OS Services, System Calls & Process Concept)*