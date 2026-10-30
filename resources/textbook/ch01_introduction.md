# Chapter 1: Introduction to Operating Systems

**Textbook References**: [Silberschatz 10e, Ch. 1-2] • [Stallings 9e, Ch. 1-2] • [Stevens & Rago 3e, Ch. 1]

---

## 1.1 What is an Operating System?

An **Operating System (OS)** is a program that acts as an intermediary between a user of a computer and the computer hardware. [Silberschatz 10e, §1.1]

> **Silberschatz Definition**: "An operating system is a program that acts as an intermediary between a user of a computer and the computer hardware." [Silberschatz 10e, p. 3]

### Goals of an OS [Silberschatz 10e, §1.2]
1. **Execute user programs** and make solving user problems easier
2. **Convenience** — make the computer system easy to use
3. **Efficiency** — use computer hardware in an efficient manner
4. **Resource Management** — manage CPU, memory, I/O devices, files

> **Silberschatz**: "The operating system acts as a resource allocator and a control program." [Silberschatz 10e, §1.2.1]

### Why Study OS? [Silberschatz 10e, §1.3]
- Almost all code runs on top of an OS
- Understanding OS internals enables writing optimized, secure, high-performance software
- Knowledge of scheduling, memory management, concurrency is fundamental

> **Silberschatz**: "Only a small percentage of computer practitioners will be involved in the creation or modification of an operating system. However, almost all code runs on top of an operating system." [Silberschatz 10e, §1.3]

---

## 1.2 Computer System Organization

### Four Components of a Computer System [Silberschatz 10e, §1.2.2]
| Component | Role |
|-----------|------|
| **Hardware** | CPU, memory, I/O devices — basic computing resources |
| **Operating System** | Controls and coordinates hardware use among applications/users |
| **Application Programs** | Define how system resources solve user problems (compilers, browsers, DBs) |
| **Users** | People, machines, other computers issuing requests |

### Layered View [Silberschatz 10e, Fig. 1.1]
```
User Applications
       ↓
System Calls / User Interface (CLI, GUI, Batch)
       ↓
Operating System Services
  ├── Program Execution    ├── I/O Operations      ├── File Systems
  ├── Communications       ├── Resource Allocation ├── Accounting
  ├── Error Detection      ├── Protection & Security
       ↓
Hardware (CPU, Memory, I/O Devices)
```

> **Silberschatz Fig. 1.1**: "Abstract view of the components of a computer system" [Silberschatz 10e, Fig. 1.1]

---

## 1.3 Operating System Operations

### Interrupt-Driven Nature [Silberschatz 10e, §1.5]
Modern OS is **interrupt-driven** — sits idle waiting for events signaled by interrupts.

#### Interrupt Classification [Silberschatz 10e, §1.5.1]
```
Interrupt Event
    ├── Hardware Interrupt
    │     ├── Polling (CPU queries devices)
    │     └── Vectored (hardware provides offset into Interrupt Vector Table → ISR)
    └── Software Interrupt (Trap/Exception)
          ├── Error (division by zero, invalid memory access)
          └── System Call (user requests OS service)
```

#### Interrupt Handling Lifecycle [Silberschatz 10e, §1.5.2]
1. **Generation** — IRQ from device or trap instruction
2. **Processor Response** — Halts current thread at instruction boundary
3. **State Preservation** — Saves PC, PSW, registers to stack
4. **Dispatching** — Vectored (via Interrupt Vector Table) or Polling
5. **Handler Execution** — ISR runs (e.g., read keyboard buffer)
6. **State Restoration** — Restore registers/PC, resume interrupted thread

> **Stallings**: "The interrupt mechanism is the key to multiprogramming." [Stallings 9e, §3.3]

---

## 1.4 System Boot Process [Silberschatz 10e, §1.5.3; Stallings 9e, §13.1]
1. **Power On / Reset** — CPU PC points to firmware (ROM/EEPROM)
2. **Bootstrap Program** — First program to execute; initializes hardware; loads kernel
3. **Kernel Initialization** — Sets up system services, interrupt vectors, starts init process
4. **Init Process** — First user process (`init` or `systemd`); waits for events (login, daemons)

---

## 1.5 Storage Hierarchy [Silberschatz 10e, §1.4; Stallings 9e, Ch. 4]

### Memory Types [Silberschatz 10e, Table 1.1]
| Level | Technology | Speed | Capacity | Volatility | Cost/Byte |
|-------|------------|-------|----------|------------|-----------|
| Registers | CPU internal | Fastest | Smallest | Volatile | Highest |
| Cache (L1/L2/L3) | SRAM | Very Fast | Small | Volatile | High |
| Main Memory (RAM) | DRAM | Fast | Medium | Volatile | Medium |
| SSD / NVRAM | Flash | Fast | Large | Non-volatile | Medium |
| Hard Disk (HDD) | Magnetic | Slow | Very Large | Non-volatile | Low |
| Tape / Optical | Magnetic/Optical | Slowest | Huge | Non-volatile | Lowest |

### Caching Principle [Silberschatz 10e, §1.4.2]
- Copy data from slower → faster storage temporarily
- **Cache Hit** → read from fast cache
- **Cache Miss** → fetch from slow storage, populate cache
- Replacement policies: LRU, FIFO, etc.

> **Silberschatz**: "Caching is one of the most important principles of computer systems." [Silberschatz 10e, §1.4.2]

---

## 1.6 I/O Structure [Silberschatz 10e, §1.7; Stallings 9e, Ch. 7]

### DMA (Direct Memory Access) [Silberschatz 10e, §1.7.3]
- **Problem**: Interrupt per byte wastes CPU cycles for high-speed devices
- **Solution**: DMA controller transfers blocks directly between device buffer ↔ memory
- Only **one interrupt per block** instead of per byte
- CPU executes user code concurrently during transfer

### I/O Modes [Silberschatz 10e, §1.7.4]
| Mode | Behavior |
|------|----------|
| **Synchronous (Blocking)** | CPU waits for I/O completion; one request at a time |
| **Asynchronous (Non-blocking)** | CPU continues immediately; checks completion later |

---

## 1.7 Key Takeaways
- OS = Resource Allocator + Control Program [Silberschatz 10e, §1.2.1]
- Kernel = the one program running at all times [Silberschatz 10e, §1.2.1]
- Interrupts = OS's nervous system [Silberschatz 10e, §1.5]
- Storage hierarchy trades speed vs capacity vs cost [Silberschatz 10e, §1.4]
- DMA offloads bulk data movement from CPU [Silberschatz 10e, §1.7.3]

---

**Further Reading**: [Silberschatz 10e, Ch. 1-2] • [Stallings 9e, Ch. 1-2] • [Stevens & Rago 3e, Ch. 1]