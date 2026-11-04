# Topic 3: OS Services, System Calls & Process Concept

**Source**: Lecture 3 (Unit 1) + Textbook Ch. 3 (Silberschatz Ch. 2-3, Stallings Ch. 3-4, Stevens & Rago Ch. 3, 7-8)

---

## 3.1 Operating System Services

### Layered Architecture (Silberschatz Fig 2.1)
```
┌─────────────────────────────────────────┐
│       User & System Programs            │
├─────────────────────────────────────────┤
│   User Interfaces (GUI | CLI | Batch)   │
├─────────────────────────────────────────┤
│            System Calls                 │
├─────────────────────────────────────────┤
│         OS SERVICES                     │
│  ┌─────────┬─────────┬───────────────┐  │
│  │Prog Exec│ I/O Ops │ File Systems  │  │
│  ├─────────┼─────────┼───────────────┤  │
│  │ Comm    │Resource │ Accounting    │  │
│  ├─────────┼─────────┼───────────────┤  │
│  │Error Det│Protect  │               │  │
│  └─────────┴─────────┴───────────────┘  │
├─────────────────────────────────────────┤
│           Operating System              │
├─────────────────────────────────────────┤
│               Hardware                  │
└─────────────────────────────────────────┘
```

### Services Helpful to Users
| Service | Description |
|---------|-------------|
| **User Interface** | CLI (shells), GUI (windows), Batch (scripts) |
| **Program Execution** | Load, schedule, allocate, handle termination |
| **I/O Operations** | Safe abstracted access to devices |
| **File System** | Create/delete/read/write, permissions, metadata |
| **Communications** | Shared memory, message passing, pipes, sockets |
| **Error Detection** | Hardware errors, I/O errors, program errors (overflow, segfault) |

### Services for System Efficiency
| Service | Description |
|---------|-------------|
| **Resource Allocation** | CPU, memory, disk, I/O — fair & efficient |
| **Accounting** | Track usage per user/process (billing, capacity planning) |
| **Protection & Security** | Controlled access, authentication, isolation, defense |

---

## 3.2 System Calls

### Definition
**System Calls** = Programmatic interface to kernel services; written in C/assembly; exposed via APIs.

### Example: File Copy Sequence (Silberschatz Fig 2.2)
```
1. Acquire input file name:
   write() → display prompt
   read()  → accept keyboard input

2. Acquire output file name:
   write() → display prompt
   read()  → accept keyboard input

3. Open input file:
   open()  → if not exist, abort & print error

4. Create destination file:
   create() / open(O_CREAT) → abort/truncate if exists

5. Copy Loop:
   read()  → from input file buffer
   write() → to destination file buffer
   repeat until read() returns 0 (EOF) or error

6. Clean up:
   close() input file
   close() destination file

7. Output status:
   write() → completion message

8. Termination:
   exit() → normal termination
```

### System Call Categories (Windows vs Unix)

| Category | Windows API | Unix/Linux Syscalls |
|----------|-------------|---------------------|
| **Process Control** | CreateProcess, ExitProcess, WaitForSingleObject | fork, exec, wait, exit |
| **File Manipulation** | CreateFile, ReadFile, WriteFile, CloseHandle | open, creat, read, write, close |
| **Device Manipulation** | SetConsoleMode, ReadConsole, WriteConsole | ioctl, read, write |
| **Information Maintenance** | GetCurrentProcessId, SetTimer, Sleep | getpid, alarm, sleep |
| **Communications** | CreatePipe, CreateFileMapping, MapViewOfFile | pipe, shm_open, mmap |
| **Protection** | SetFileSecurity, InitializeSecurityDescriptor | chmod, umask, chown |

### Standard C Library → System Call (printf → write)
```
USER MODE:
main.c:      printf("Greetings\n");
                  │
                  ▼ Calls library function
libc:        Formats string buffer
             Invokes write() syscall stub
                  │ TRAP to Kernel (syscall instruction)
                  ▼
KERNEL MODE:
sys_write(): Executes, sends data to terminal
             Returns bytes written
                  │ Return from Trap
                  ▼
USER MODE:
libc write() stub passes control back to main()
```

---

## 3.3 Process Concept

### Program vs Process
| Aspect | Program | Process |
|--------|---------|---------|
| Nature | Passive (file on disk) | Active (in execution) |
| Context | None | PC, registers, memory space, stack |
| Instances | One file | Multiple from same program |

> **Silberschatz**: "A program is a passive entity... A process is a program in execution."

### Process Memory Layout (32-bit)
```
High Address (0xFFFFFFFF)
├── Command-line args & Environment (argc, argv, envp)
├── STACK (grows ↓: frames, locals, params, return addresses)
│       ↑
│       │   (free space)
│       ↓
├── HEAP (grows ↑: malloc/free)
├── BSS (uninitialized globals/statics → zeroed)
├── DATA (initialized globals/statics)
└── TEXT (code, read-only)
Low Address (0x00000000)
```

### C Mapping Example
```c
int x;              // → BSS (uninitialized)
int y = 15;         // → DATA (initialized)

int main(int argc, char *argv[]) {  // args in high memory
    int *values;    // → STACK (pointer)
    int i;          // → STACK
    values = malloc(5 * sizeof(int)); // → HEAP
    for (i = 0; i < 5; i++) values[i] = i;  // → TEXT executes
    return 0;
}
```

---

## 3.4 Process State Model (5-State)

```
                     [ NEW ]
                        │
                     admitted
                        ▼
         +────────> [ READY ] <─────────+
         │           │                   │
         │  dispatch │                   │
         │           ▼                   │
         │    [ RUNNING ] ──────────────+
         │        │        interrupt
         │        │
         │        │ I/O wait
         │        ▼
         │    [ WAITING ]
         │        │
         +────────┘
          I/O complete

   [ RUNNING ] ─────────> [ TERMINATED ]
             exit
```

| State | Meaning |
|-------|---------|
| **New** | Being created |
| **Ready** | In memory, waiting for CPU |
| **Running** | Executing on CPU |
| **Waiting** | Blocked on I/O/event |
| **Terminated** | Finished, awaiting cleanup |

---

## 3.5 Process Control Block (PCB / `task_struct`)

**Kernel representation of each process**

| PCB Field | Description |
|-----------|-------------|
| Process State | Ready, Running, Waiting... |
| Process ID (PID) | Unique identifier |
| Program Counter | Next instruction address |
| CPU Registers | Accumulator, index, stack pointer |
| Scheduling Info | Priority, queue pointers |
| Memory Management | Page tables, base/limit |
| Accounting | CPU time used, time limits |
| I/O Status | Allocated devices, open files |

**Linux `task_struct`**: `pid`, `state`, `mm` (memory), `files` (fd table), `parent`, `children`

---

## 3.6 Process Scheduling & Queues

### Three Queues
| Queue | Contents |
|-------|----------|
| **Job Queue** | All processes in system |
| **Ready Queue** | In memory, ready to execute |
| **Device/Waiting Queues** | Blocked on specific I/O/event |

### Scheduler Types
| Scheduler | Frequency | Role |
|-----------|-----------|------|
| **Short-term (CPU)** | Milliseconds | Pick next ready process → dispatch |
| **Long-term (Job)** | Seconds/minutes | Admit from disk to memory (controls **degree of multiprogramming**) |
| **Medium-term (Swapper)** | As needed | Swap out to disk (free memory) → swap in later |

### Process Types
| Type | Behavior | CPU Bursts |
|------|----------|------------|
| **I/O-Bound** | More I/O than compute | Many, short |
| **CPU-Bound** | More compute than I/O | Few, long |

> **Scheduler goal**: Balance mix for good utilization + responsiveness

---

## 3.7 Context Switching

**Mechanism**: Save current process state to PCB, load next process state from PCB

```
P0 Running → Interrupt → Save PCB0 → Load PCB1 → P1 Running
             ↑                               │
             └── Interrupt → Save PCB1 → Load PCB0 ───┘
```

### Overhead (Pure System Cost)
- Save/restore: GPRs, PC, SP, FP registers
- Flush/invalidate **TLB**
- Switch address space (page table base register)
- Factors: Hardware register sets, PCB size, OS complexity

> **Silberschatz**: "Context-switch time is pure overhead, because the system does no useful work while switching."

---

## 3.8 Key Takeaways (Memorize)

1. **OS Services**: User-facing (UI, exec, I/O, files, comm, errors) + System-facing (resource allocation, accounting, protection)
2. **System Calls**: API to kernel; categories: process, file, device, info, comm, protection
3. **Process** = active entity with memory layout (TEXT, DATA, BSS, HEAP, STACK)
3. **5-State Model**: New → Ready ↔ Running → Waiting → Terminated
4. **PCB** = kernel's process representation (Linux: `task_struct`)
5. **Three Schedulers**: Short-term (CPU), Long-term (admission), Medium-term (swapping)
6. **Context Switch** = save/restore PCB + TLB flush + address space switch

---

## 3.9 Quick Self-Test

| Question | Answer |
|----------|--------|
| What are the 3 scheduler types? | Short-term (CPU), Long-term (Job), Medium-term (Swapper) |
| What does long-term scheduler control? | Degree of multiprogramming |
| What's in the PCB? | State, PID, PC, registers, scheduling info, memory mgmt, accounting, I/O status |
| Difference: I/O-bound vs CPU-bound? | I/O-bound: many short bursts; CPU-bound: few long bursts |
| Context switch overhead includes? | Save/restore registers, TLB flush, page table switch |
| `printf` → `write` syscall path? | User: printf → libc formats → write stub → TRAP → Kernel: sys_write → returns |

---

## 3.10 Exam-Relevant MCQ Patterns (from prep file)

- **Q9**: PCB contents — PC, registers, process state, scheduling info
- **Q10**: Ready → Running is dispatcher/scheduler transition
- **Q11**: Context switch = pure overhead (no useful user work)
- **Q12**: Microkernel vs Monolithic — microkernel moves FS, drivers to user space, uses message passing
- **Q13**: Dual-mode — mode bit checked by hardware; privileged instructions only in kernel mode (bit=0)
- **Q14**: Interrupt (async, hardware) vs Trap (sync, syscall/division by zero)
- **Q15**: Large syscall params → memory block + register with address
- **Q16**: Cascading termination — parent termination kills all children
- **Q17**: Accounting service tracks CPU burst, memory, disk for billing
- **Q18**: Symmetric cluster + SAN → local semaphore invisible across nodes → need DLM
- **Q19**: Interactive editor = I/O-bound (many short CPU bursts)
- **Q20**: Dispatcher does context switch + mode switch + jump to user code

---

## 3.11 Practice Problems

### Problem 1: System Call Trace
```
Trace the syscalls for: cp file1.txt file2.txt
```

### Problem 2: Process Memory Layout
```
Given C code, identify which segment each variable goes to (TEXT, DATA, BSS, HEAP, STACK)
```

### Problem 3: Process States
```
Process does: fork() → wait() → exit()
Draw state transitions for parent and child
```

### Problem 4: PCB
```
List all fields in a PCB and explain purpose of each
```

### Problem 5: Scheduler Types
```
When does each scheduler run? What triggers each?
```

---

*Next: Topic 4 (Process Creation, Termination & System Calls — Lecture 5)*