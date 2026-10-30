# Topic 1: OS Introduction & Computer System Organization

**Source**: Lecture 1 + Textbook Ch. 1 (Silberschatz Ch. 1-2, Stallings Ch. 1-2, Stevens & Rago Ch. 1)

---

## 1.1 What is an Operating System?

**Definition** (Silberschatz): *"An operating system is a program that acts as an intermediary between a user of a computer and the computer hardware."*

**Two Views:**
| View | Role |
|------|------|
| **User View** | Convenience, ease of use, performance |
| **System View** | **Resource Allocator** (CPU, memory, I/O) + **Control Program** (prevent errors, control I/O) |

**Kernel**: "The one program running at all times on the computer" — everything else is system programs or applications.

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

**Hardware Components:**
- **CPU(s)**: General-purpose + special-purpose (GPU, disk controller, NIC)
- **Memory**: RAM (volatile), ROM/EEPROM (firmware)
- **I/O Devices**: Disk, keyboard, mouse, network, display
- **System Bus**: Connects CPU, memory, device controllers
- **Memory Controller**: Synchronizes access to shared memory

---

## 1.3 System Boot Process

| Step | Description |
|------|-------------|
| **1. Power On / Reset** | CPU PC → firmware address (ROM/EEPROM) |
| **2. Bootstrap Program** | First code to run; initializes CPU, devices, memory; locates & loads kernel |
| **3. Kernel Initialization** | Sets up system services, interrupt vectors, starts init process |
| **4. Init Process** | First user process (`init` or `systemd`, PID 1); waits for login/daemons |

---

## 1.4 Interrupt-Driven Operation

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

---

## 1.5 Storage Hierarchy

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

---

## 1.6 I/O Structure

### DMA (Direct Memory Access)
- **Problem**: Interrupt per byte wastes CPU for high-speed devices
- **Solution**: DMA controller transfers **blocks** directly between device buffer ↔ memory
- **Result**: Only **one interrupt per block**; CPU executes user code concurrently

### I/O Modes
| Mode | Behavior |
|------|----------|
| **Synchronous (Blocking)** | CPU waits for I/O completion; one request at a time |
| **Asynchronous (Non-blocking)** | CPU continues immediately; checks completion later |

---

## 1.7 Key Takeaways (Memorize)

1. **OS = Resource Allocator + Control Program** (Silberschatz §1.2.1)
2. **Kernel = the one program running at all times** (Silberschatz §1.2.1)
3. **Interrupts = OS's nervous system** (Silberschatz §1.5)
4. **Storage hierarchy trades speed vs capacity vs cost** (Silberschatz §1.4)
5. **DMA offloads bulk data movement from CPU** (Silberschatz §1.7.3)
6. **Boot: Firmware → Bootstrap → Kernel → Init (PID 1)**

---

## 1.8 Quick Self-Test

| Question | Answer |
|----------|--------|
| What are the two main roles of an OS from system view? | Resource Allocator + Control Program |
| What is the kernel? | The one program running at all times |
| How does vectored interrupt differ from polling? | Hardware provides offset into IVT; polling = CPU queries each device |
| What happens during DMA transfer? | Device ↔ memory directly; 1 interrupt/block; CPU free |
| Why is storage organized hierarchically? | Trade-off: speed ↑, cost ↑, capacity ↓, volatility ↑ as you go up |

---

## 1.9 Exam-Relevant MCQ Patterns (from prep file)

- **Q13**: Dual-mode operation — mode bit (0=kernel, 1=user) checked by hardware on every instruction
- **Q14**: Interrupt vs Trap — interrupt = async (hardware), trap = sync (syscall, division by zero)
- **Q15**: System call parameters too large for registers → stored in memory block, address passed in register
- **Q18**: Symmetric cluster + SAN → local semaphores invisible across nodes → need **DLM** (Distributed Lock Manager)