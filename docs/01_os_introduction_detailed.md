# Topic 1 (Detailed): OS Introduction & Computer System Organization

**Source**: Lecture 1 + Textbook Ch. 1 (Silberschatz Ch. 1-2, Stallings Ch. 1-2, Stevens & Rago Ch. 1)

---

## 1.1 Course Overview (from Lecture Slides)

### Course Objectives
- Focus on fundamental Operating System concepts
- Provide understanding of various OS components
- Delve deeper into algorithms and trade-offs for efficient resource management (process, disk, memory)
- Introduce design principles and trade-offs in OS design

### Course Outline

#### Unit 1: Introduction and Process Management (14 hours)
- What Operating Systems Do, Computer-System Organization, Computer-System Architecture
- Operating System Structure & Operations, Operating-System Services
- Process Concept: Process in Memory, Process State, Process Control Block (PCB)
- Process Creation and Termination, System Calls for Process Management, Life Cycle of I/O Requests
- CPU Scheduling: Basic Concepts, Scheduling Criteria, Scheduling Algorithms (FCFS, SJF, Priority, RR, MLQ, MLFQ)
- Introduction to Shell Programming: Variables, Control Flow, Shell Scripts, Scheduler – cron

#### Unit 2: IPC, Threads and Concurrency (14 hours)
- IPC: Shared Memory, Message Passing, Pipes (Named/Ordinary), System Calls, Linux Domain Sockets
- Threads: Types, Multicore Programming, Multithreading Models, TCB, Thread Creation/Scheduling, Pthreads
- Multicore Kernel: SMP, Kernel Parallelism, CPU Affinity, Load Balancing, Multicore Scheduling
- Synchronization: Software Approaches, Concurrency Principles, Hardware Support, Mutex, Semaphores
- Scalable Sync: Spinlocks, Reader-Writer Locks, Lock Contention; Classic Problems; Deadlocks
- Signals and Signal Handling

#### Unit 3: Memory Management (14 hours)
- Main Memory: Hardware, Control Structures, Address Translation, Dynamic Loading/Linking, mmap()
- Swapping, Fragmentation, Segmentation, Paging, Page Tables, TLB, EAT
- Virtual Memory: Demand Paging, Page-Fault Handling, COW, Page Replacement, Thrashing, NUMA, Clock Algorithm

#### Unit 4: File Management, Storage & Security (14 hours)
- File System: Access Methods, Directory, File System Protection, System Calls, File Operations
- Implementation, Directory Implementation, Allocation Methods, Free-Space Management
- Mass Storage: Disk Structure, Scheduling, Management, RAID
- Security: Access Matrix, Access Control, Revocation, Shell Programming (awk, sed)

### Course Outcomes
- Understand OS principles and modules
- Understand scheduling algorithms and relative performance
- Understand deadlocks - avoidance and detection
- Implement OS concepts: process management, concurrent processes, threads, memory management

### Textbooks
1. **Primary**: "Operating System Concepts", Silberschatz, Galvin, Gagne, 10th Ed., Wiley 2023
2. **Primary**: "Advanced Programming in the Unix Environment", Stevens & Rago, 3rd Ed., Pearson 2017
3. **Reference**: "Operating Systems: Internals and Design Principles", Stallings, 9th Ed., Pearson 2018
4. **Reference**: "Modern Operating Systems", Tanenbaum, 3rd Ed., Pearson 2007
5. **Reference**: "Learning the bash shell", Newham, 3rd Ed., O'Reilly 2005

### Course Evaluation Policy
| Component | Conduction Marks | Scaled Marks |
|-----------|-----------------|--------------|
| ISA-1 | 40 | 15 |
| ISA-2 | 40 | 15 |
| Experiential Learning | 70 | 20 |
| ESA | 100 | 50 |
| **Total** | **250** | **100** |

---

## 1.1 What is an Operating System?

### Definition (Silberschatz)
> *"An operating system is a program that acts as an intermediary between a user of a computer and the computer hardware."*

### Need for OS
Without OS, application developers would need direct hardware knowledge to access hardware — OS provides user-friendly environment to develop/execute programs without hardware expertise.

### OS Goals
- Execute user programs and make solving user problems easier
- Make computer system convenient to use
- Use computer hardware efficiently
- Manage resources: Memory, Processor(s), I/O Devices

### Why Study OS?
- Almost all code runs on top of an OS — understanding OS is crucial for efficient, effective, secure programming
- Understanding OS fundamentals is essential for all computer practitioners

---

## 1.2 Computer System Organization (4 Components)

```
┌─────────────────────────────────────┐
│              Users                  │
├─────────────────────────────────────┤
│    Application Programs             │  ← Compilers, browsers, DBs, games
├─────────────────────────────────────┤
│         Operating System            │  ← Resource allocator + control
├─────────────────────────────────────┤
│           Hardware                  │  ← CPU, Memory, I/O Devices
└─────────────────────────────────────┘
```

### Four Components (Abstract View)
1. **Hardware** — CPU, memory, I/O devices; provides basic computing resources
2. **Operating System** — Controls and coordinates hardware use among applications/users
3. **Application Programs** — Define how system resources solve user problems (compilers, browsers, DBs, games)
4. **Users** — People, machines, other computers

### What Operating Systems Do

**User View**: Convenience, ease of use, good performance; don't care about resource utilization

**System View**: 
- **Resource Allocator** — Manages all resources, decides between conflicting requests for efficient/fair use
- **Control Program** — Controls program execution to prevent errors and improper computer use

### Four Components of Computer System (Abstract View)
| Component | Role |
|-----------|------|
| Hardware | CPU, memory, I/O devices; basic computing resources |
| OS | Controls/coordinates hardware use among apps/users |
| Application Programs | Word processors, compilers, browsers, DBs, games |
| Users | People, machines, other computers |

---

## 1.3 Computer System Organization (Hardware Details)

### Hardware Components
- **CPU(s)**: General-purpose + special-purpose (GPU, disk controller, NIC)
- **Memory**: RAM (volatile), ROM/EEPROM (firmware)
- **I/O Devices**: Disk, keyboard, mouse, network, display
- **System Bus**: Connects CPU, memory, device controllers
- **Memory Controller**: Synchronizes access to shared memory

### Computer System Structure
- One or more CPUs, device controllers connect through common bus providing access to shared memory
- CPU and device controllers execute concurrently, competing for memory cycles
- Memory controller synchronizes access to memory

---

## 1.4 System Boot Process

| Step | Description |
|------|-------------|
| **1. Power On / Reset** | CPU PC → firmware address (ROM/EEPROM) |
| **2. Bootstrap Program** | First code to run; stored in ROM/EEPROM (firmware); initializes CPU, devices, memory; locates & loads kernel |
| **3. Kernel Initialization** | Sets up system services, interrupt vectors, starts init process |
| **4. Init Process** | First user process (`init` or `systemd`, PID 1); waits for login/daemons |

### Bootstrap Details
- Stored in ROM/EEPROM (firmware)
- Initializes all aspects: CPU registers, device controllers, memory contents
- Must know how to load OS kernel and start executing it
- Locates and loads OS kernel into memory
- First process created is `init` (PID 1), waits for events

---

## 1.5 Interrupt-Driven Operation

Modern OS is **interrupt-driven** — sits idle waiting for events.

### Interrupt Classification

```
Interrupt Event
    ├── Hardware Interrupt
    │     ├── Polling (CPU queries devices)
    │     └── Vectored (hardware provides offset → Interrupt Vector Table → ISR)
    └── Software Interrupt (Trap/Exception)
          ├── Error (divide by zero, invalid memory access → SIGSEGV)
          └── System Call (user requests OS service)
```

### Interrupt Handling Lifecycle

1. **Generation** — IRQ from device or trap instruction
2. **Processor Response** — Halts current thread at instruction boundary
3. **State Preservation** — Saves PC, PSW, registers to kernel stack
4. **Dispatching** — Vectored (via IVT) or Polling
5. **Handler Execution** — ISR runs (e.g., read keyboard buffer)
6. **State Restoration** — Restore registers/PC, resume interrupted thread

> **Key Insight**: Interrupts enable **multiprogramming** — CPU switches to another process while I/O completes.

### Interrupt Handling Details
- OS saves CPU state (registers, PC)
- Determines interrupt type: polling vs vectored interrupt system
- Separate code segments handle each interrupt type
- Interrupt vector contains addresses of all service routines

### Interrupt Timeline
- Interrupt processing times vary
- I/O transfer times vary
- CPU and I/O devices execute concurrently

---

## 1.6 I/O Structure

### Device Controller
- Each device controller manages a specific device type
- Has local buffer storage and special-purpose registers
- Responsible for moving data between peripheral devices
- Device driver provides uniform interface between controller and kernel

### I/O Operation Modes

| Mode | Behavior |
|------|----------|
| **Synchronous (Blocking)** | CPU waits for I/O completion; one request at a time; wait instruction idles CPU until interrupt |
| **Asynchronous (Non-blocking)** | CPU continues immediately; system call allows waiting for I/O; device-status table tracks device state |

### I/O Flow
1. I/O from device to local buffer of controller
2. CPU moves data between main memory and local buffers
3. Device controller informs CPU of completion via interrupt
4. Device-status table tracks type, address, state of each I/O device

---

## 1.7 DMA (Direct Memory Access)

### Problem
Interrupt per byte wastes CPU for high-speed devices

### Solution
DMA controller transfers **blocks** directly between device buffer ↔ memory without CPU intervention

### Result
- Only **one interrupt per block** (instead of one per byte)
- CPU executes user code concurrently with DMA transfer

### DMA Structure
- Used for high-speed I/O devices (near memory speeds)
- Device controller transfers blocks directly to main memory
- Only one interrupt generated per block

---

## 1.8 Storage Hierarchy

### Storage Structure
- **Main Memory**: Only large storage CPU accesses directly (RAM, volatile); DRAM
- **Secondary Storage**: Extension of main memory; large non-volatile capacity
- **Hard Disks**: Rigid platters with magnetic material; tracks → sectors; disk controller manages logical interaction
- **SSD**: Faster than HDD, non-volatile

### Storage Device Hierarchy

| Level | Technology | Speed | Capacity | Volatility | Cost/Byte |
|-------|------------|-------|----------|------------|-----------|
| Registers | CPU internal | Fastest | Smallest | Volatile | Highest |
| Cache (L1/L2/L3) | SRAM | Very Fast | Small | Volatile | High |
| **Main Memory (RAM)** | DRAM | Fast | Medium | **Volatile** | Medium |
| SSD / NVRAM | Flash | Fast | Large | Non-volatile | Medium |
| Hard Disk (HDD) | Magnetic | Slow | Very Large | Non-volatile | Low |
| Tape / Optical | Magnetic/Optical | Slowest | Huge | Non-volatile | Lowest |

### Caching Principle
1. Copy data from slower → faster storage temporarily
2. **Cache Hit** → read from fast cache
3. **Cache Miss** → fetch from slow storage, populate cache
4. Replacement policies: **LRU**, FIFO, etc.

### Caching Principle Details
- Performed at many levels: hardware, OS, software
- Information copied from slower to faster storage temporarily
- Cache checked first; if hit → fast; if miss → copy to cache
- Cache smaller than storage being cached
- Cache management: size and replacement policy

### Program Execution Model (Von Neumann)
- Fetch, Decode, Execute cycles repeated until program terminates
- Processor fetches instructions from memory, decodes and executes them

---

## 1.9 Key Takeaways (Memorize)

1. **OS = Resource Allocator + Control Program** (Silberschatz §1.2.1)
2. **Kernel = the one program running at all times** (Silberschatz §1.2.1)
3. **Interrupts = OS's nervous system** (Silberschatz §1.5)
4. **Storage hierarchy trades speed vs capacity vs cost** (Silberschatz §1.4)
5. **DMA offloads bulk data movement from CPU** (Silberschatz §1.7.3)
6. **Boot: Firmware → Bootstrap → Kernel → Init (PID 1)**

---

## 1.10 Quick Self-Test

| Question | Answer |
|----------|--------|
| What are the two main roles of an OS from system view? | Resource Allocator + Control Program |
| What is the kernel? | The one program running at all times |
| How does vectored interrupt differ from polling? | Hardware provides offset into IVT; polling = CPU queries each device |
| What happens during DMA transfer? | Device ↔ memory directly; 1 interrupt/block; CPU free |
| Why is storage organized hierarchically? | Trade-off: speed ↑, cost ↑, capacity ↓, volatility ↑ as you go up |
| What are the four components of a computer system? | Hardware, OS, Application Programs, Users |
| What is the bootstrap program? | First program at boot; stored in ROM/EEPROM; loads kernel |
| What is a trap/exception? | Software-generated interrupt (error or user request) |
| Difference between synchronous and asynchronous I/O? | Sync: CPU waits; Async: CPU continues, checks later |

---

## 1.10 Exam-Relevant MCQ Patterns (from prep file)

- **Q13**: Dual-mode operation — mode bit (0=kernel, 1=user) checked by hardware on every instruction
- **Q14**: Interrupt vs Trap — interrupt = async (hardware), trap = sync (syscall, division by zero)
- **Q15**: System call parameters too large for registers → stored in memory block, address passed in register
- **Q18**: Symmetric cluster + SAN → local semaphores invisible across nodes → need **DLM** (Distributed Lock Manager)

---

## 1.11 Practice Problems

### Problem 1: Boot Sequence
```
Order these: Kernel init, Bootstrap, Power on, Init process
Answer: Power on → Bootstrap → Kernel init → Init process
```

### Problem 2: Interrupt vs Trap
```
Classify: Division by zero, Disk I/O complete, Ctrl+C, System call
Answer: Trap (division by zero), Interrupt (Disk I/O), Interrupt (Ctrl+C), Trap (syscall)
```

### Problem 3: DMA
```
Why use DMA for disk I/O instead of programmed I/O?
Answer: DMA transfers blocks directly without CPU, 1 interrupt/block vs 1/byte
```

### Problem 4: Storage Hierarchy
```
Order by speed: Registers > Cache > RAM > SSD > HDD
```

### Problem 5: Caching
```
Cache hit: data found in cache (fast)
Cache miss: data not in cache, fetch from slower storage
Replacement policy: LRU, FIFO, etc.
```

---

*Next: Topic 2 (Computer Architecture & OS Operations)*