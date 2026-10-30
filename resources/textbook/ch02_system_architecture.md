# Chapter 2: Computer System Architecture

**Textbook References**: [Silberschatz 10e, Ch. 1-2] • [Stallings 9e, Ch. 2, 15] • [Stevens & Rago 3e, Ch. 2]

---

## 2.1 Processor Architectures [Silberschatz 10e, §1.2.2]

### Single Processor Systems [Silberschatz 10e, §1.2.2]
- One general-purpose CPU
- Most systems also contain **special-purpose processors** [Silberschatz 10e, §1.2.2]:
  - Device controllers (disk, keyboard, GPU)
  - Run limited instruction sets, dedicated functions
  - Offload main CPU (e.g., disk controller handles scheduling)

---

## 2.2 Multiprocessor Systems [Silberschatz 10e, §2.1; Stallings 9e, §15.1]

### Characteristics [Silberschatz 10e, §2.1]
- Two or more processors in close communication
- Share: system bus, clock, memory, peripheral devices

### Advantages [Silberschatz 10e, §2.1.1]
| Advantage | Description |
|-----------|-------------|
| **Increased Throughput** | More work in less time (not linear N× due to sync overhead) |
| **Economy of Scale** | Share peripherals, storage, power — cheaper than N single-CPU systems |
| **Fault Tolerance** | Failure of one CPU ≠ system halt; graceful degradation |

> **Silberschatz**: "Multiprocessor systems have three main advantages: increased throughput, economy of scale, and increased reliability." [Silberschatz 10e, §2.1.1]

---

## 2.3 Multiprocessor Types [Silberschatz 10e, §2.1.2]

### Asymmetric Multiprocessing (AMP) [Silberschatz 10e, §2.1.2]
- **Master-Worker** relationship
- Master: controls system, schedules, allocates work
- Workers: execute assigned tasks
- Simple but master becomes bottleneck

### Symmetric Multiprocessing (SMP) — *Modern Standard* [Silberschatz 10e, §2.1.2; Stallings 9e, §15.2]
- All processors are **peers** — no master-slave
- Each runs kernel + user code
- Each has private registers + cache; share physical memory
- Used by: Linux, Windows, macOS, Android, iOS

```
SMP Architecture [Silberschatz 10e, Fig. 2.1]:
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

> **Silberschatz Fig. 2.1**: "Symmetric multiprocessing architecture" [Silberschatz 10e, Fig. 2.1]

---

## 2.4 Multicore Design [Silberschatz 10e, §2.2; Stallings 9e, §15.3]
- Multiple computing cores on **single chip** [Silberschatz 10e, §2.2]
- Each core = independent physical CPU to OS
- **Benefits**: Faster on-chip communication, less power/heat than multi-chip

```
Dual-Core Chip [Silberschatz 10e, Fig. 2.2]:
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

> **Silberschatz Fig. 2.2**: "Dual-core design" [Silberschatz 10e, Fig. 2.2]

---

## 2.5 Advanced Architectures [Silberschatz 10e, §2.3; Stallings 9e, §15.4]

### Blade Servers [Silberschatz 10e, §2.3.1]
- High-density: multiple processor/I/O/network boards in one chassis
- Each blade boots independently, runs own OS
- Some blades are themselves multiprocessors

### Clustered Systems [Silberschatz 10e, §2.3.2; Stallings 9e, §15.5]
- Multiple independent computers (nodes) linked via high-speed interconnect
- Share storage via **SAN (Storage Area Network)** [Silberschatz 10e, §2.3.2]

| Clustering Type | Behavior |
|-----------------|----------|
| **Asymmetric** | Hot-standby monitors active; takes over on failure |
| **Symmetric** | All nodes actively run apps, monitor each other |
| **HPC** | Parallel computing via MPI/OpenMP |

- **DLM (Distributed Lock Manager)** — prevents conflicting access to shared SAN data [Silberschatz 10e, §2.3.2]

### NUMA (Non-Uniform Memory Access) [Silberschatz 10e, §2.3.3; Stallings 9e, §15.4]
- Memory access latency varies by CPU-memory distance
- Scheduler must consider memory locality

> **Silberschatz**: "In a NUMA system, the time to access a memory location depends on the location of the memory relative to the processor." [Silberschatz 10e, §2.3.3]

### Heterogeneous Multiprocessing (big.LITTLE) [Silberschatz 10e, §2.3.4]
- Cores with different performance/energy profiles
- Scheduler migrates tasks based on workload

---

## 2.6 Key Takeaways
- **SMP** = peer CPUs sharing memory; standard for modern OS [Silberschatz 10e, §2.1.2]
- **Multicore** = multiple cores on one die; each appears as CPU to OS [Silberschatz 10e, §2.2]
- **Clusters** = independent nodes + shared SAN; for HA and HPC [Silberschatz 10e, §2.3.2]
- **NUMA/big.LITTLE** = modern complexities OS scheduler must handle [Silberschatz 10e, §2.3.3-4]

---

**Further Reading**: [Silberschatz 10e, Ch. 1-2] • [Stallings 9e, Ch. 2, 15] • [Stevens & Rago 3e, Ch. 2]