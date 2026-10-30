# Chapter 3: Process Management

**Textbook References**: [Silberschatz 10e, Ch. 3] • [Stallings 9e, Ch. 3-4] • [Stevens & Rago 3e, Ch. 3, 7-8]

---

## 3.1 Process Concept [Silberschatz 10e, §3.1]

### Program vs Process [Silberschatz 10e, §3.1.1]
| Aspect | Program | Process |
|--------|---------|---------|
| Nature | Passive (file on disk) | Active (in execution) |
| Context | None | PC, registers, memory space, stack |
| Instances | One file | Multiple processes from same program |

> **Silberschatz**: "A program is a passive entity, such as a file containing a list of instructions stored on disk. A process is a program in execution." [Silberschatz 10e, §3.1.1]

### Process Memory Layout (32-bit) [Silberschatz 10e, Fig. 3.1; Stevens & Rago 3e, Fig. 7.6]
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

> **Silberschatz Fig. 3.1**: "Memory layout of a process" [Silberschatz 10e, Fig. 3.1]

### C Mapping Example [Stevens & Rago 3e, §7.6]
```c
int x;              // → BSS
int y = 15;         // → DATA

int main(int argc, char *argv[]) {  // args in high memory
    int *values;    // → STACK (pointer)
    int i;          // → STACK
    values = malloc(5 * sizeof(int)); // → HEAP
    for (i = 0; i < 5; i++) values[i] = i;  // → TEXT executes
    return 0;
}
```

---

## 3.2 Process State Model (5-State) [Silberschatz 10e, §3.2; Stallings 9e, §3.3]

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

| State | Meaning | [Silberschatz 10e, §3.2] |
|-------|---------|--------------------------|
| **New** | Being created | |
| **Ready** | In memory, waiting for CPU | |
| **Running** | Executing on CPU | |
| **Waiting** | Blocked on I/O/event | |
| **Terminated** | Finished, awaiting cleanup | |

> **Silberschatz Fig. 3.2**: "Diagram of process state" [Silberschatz 10e, Fig. 3.2]

---

## 3.3 Process Control Block (PCB / `task_struct`) [Silberschatz 10e, §3.3; Stevens & Rago 3e, §3.3]

**Kernel representation of each process**

| PCB Field | Description | [Silberschatz 10e, §3.3] |
|-----------|-------------|--------------------------|
| Process State | Ready, Running, Waiting... | |
| Process ID (PID) | Unique identifier | |
| Program Counter | Next instruction address | |
| CPU Registers | Accumulator, index, stack pointer | |
| Scheduling Info | Priority, queue pointers | |
| Memory Management | Page tables, base/limit | |
| Accounting | CPU time used, time limits | |
| I/O Status | Allocated devices, open files | |

**Linux `task_struct`**: `pid`, `state`, `mm` (memory), `files` (fd table), `parent`, `children` [Stevens & Rago 3e, §3.3]

> **Silberschatz**: "Each process is represented in the operating system by a process control block (PCB)." [Silberschatz 10e, §3.3]

---

## 3.4 Process Creation: `fork()` + `exec()` [Silberschatz 10e, §3.4; Stevens & Rago 3e, Ch. 8]

### The Unix Way
```c
pid = fork();  // Clone current process!
if (pid == 0) {
    // CHILD: Different program entirely
    exec("/bin/ls", "ls", NULL);  // Replaces memory with new program
} else {
    // PARENT: Continues original program
    wait(NULL);  // Wait for child to finish
}
```

> **Stevens & Rago**: "The fork() function is the only way a new process is created by an existing process." [Stevens & Rago 3e, §8.3]

### Why This Design?
- `fork()` copies everything (with **Copy-on-Write** optimization) [Silberschatz 10e, §3.4.1]
- `exec()` loads new program [Silberschatz 10e, §3.4.2]
- Separation allows: setup pipes, change directories, drop privileges *before* loading new program

### `fork()` Semantics [Stevens & Rago 3e, §8.3]
| Context | Return |
|---------|--------|
| **Child** | 0 |
| **Parent** | Child's PID (>0) |
| **Error** | -1 |

**COW**: Parent and child share physical pages read-only until one writes → then page is duplicated [Silberschatz 10e, §3.4.1].

---

## 3.5 Process Termination [Silberschatz 10e, §3.5; Stevens & Rago 3e, §8.5]

### Normal (5 ways) [Stevens & Rago 3e, §8.5]
1. `return` from `main()`
2. `exit()` — flushes buffers, runs `atexit` handlers
3. `_exit()` / `_Exit()` — direct kernel call, no cleanup
4. Last thread returns from start routine
5. `pthread_exit()` from last thread

### Abnormal (3 ways) [Stevens & Rago 3e, §8.5]
1. `abort()` → `SIGABRT`
2. Signals: `SIGKILL`, `SIGSEGV`, `SIGFPE`
3. Last thread responds to cancellation

### Zombie vs Orphan [Silberschatz 10e, §3.5; Stevens & Rago 3e, §8.6]
| | **Zombie** | **Orphan** |
|---|------------|------------|
| **Cause** | Child exited, parent hasn't `wait()` | Parent exited before child |
| **State** | Dead but PID+status in process table | Alive, no parent |
| **Resolution** | Parent calls `wait()` → reaped | Re-parented to `init`/`systemd` (PID 1) |

> **Stevens & Rago**: "A process that has terminated, but whose parent has not yet waited for it, is called a zombie." [Stevens & Rago 3e, §8.6]

---

## 3.6 Process Scheduling & Queues [Silberschatz 10e, §3.6]

### Three Queues [Silberschatz 10e, §3.6.1]
| Queue | Contents |
|-------|----------|
| **Job Queue** | All processes in system |
| **Ready Queue** | In memory, ready to execute |
| **Device/Waiting Queues** | Blocked on specific I/O/event |

### Scheduler Types [Silberschatz 10e, §3.6.2]
| Scheduler | Frequency | Role |
|-----------|-----------|------|
| **Short-term (CPU)** | Milliseconds | Pick next ready process → dispatch |
| **Long-term (Job)** | Seconds/minutes | Admit processes from disk to memory (controls **degree of multiprogramming**) |
| **Medium-term (Swapper)** | As needed | Swap out to disk (free memory) → swap in later |

### Process Types [Silberschatz 10e, §5.1.1]
| Type | Behavior | CPU Bursts |
|------|----------|------------|
| **I/O-Bound** | More I/O than compute | Many, short |
| **CPU-Bound** | More compute than I/O | Few, long |

**Scheduler goal**: Balance mix for good utilization + responsiveness

---

## 3.6 Context Switching [Silberschatz 10e, §3.7; Stallings 9e, §3.4]

**Mechanism**: Save current process state to PCB, load next process state from PCB

```
P0 Running → Interrupt → Save PCB0 → Load PCB1 → P1 Running
             ↑                               │
             └── Interrupt → Save PCB1 → Load PCB0 ───┘
```

### Overhead (Pure System Cost) [Silberschatz 10e, §3.7]
- Save/restore: GPRs, PC, SP, FP registers
- Flush/invalidate **TLB**
- Switch address space (page table base register)
- **Factors**: Hardware register sets, PCB size, OS complexity

> **Silberschatz**: "Context-switch time is pure overhead, because the system does no useful work while switching." [Silberschatz 10e, §3.7]

---

## 3.8 Key Takeaways
- **Process** = active entity with memory layout (TEXT, DATA, BSS, HEAP, STACK) [Silberschatz 10e, §3.1]
- **5-State Model**: New → Ready ↔ Running → Waiting → Terminated [Silberschatz 10e, §3.2]
- **PCB** = kernel's process representation (Linux: `task_struct`) [Silberschatz 10e, §3.3]
- **fork()/exec()** = standard creation pattern [Silberschatz 10e, §3.4]
- **Zombie** = dead, un-waited; **Orphan** = re-parented to init [Silberschatz 10e, §3.5]
- **Three schedulers**: Short-term (CPU), Long-term (admission), Medium-term (swapping) [Silberschatz 10e, §3.6]
- **Context switch** = save/restore PCB + TLB flush + address space switch [Silberschatz 10e, §3.7]

---

**Further Reading**: [Silberschatz 10e, Ch. 3] • [Stallings 9e, Ch. 3-4] • [Stevens & Rago 3e, Ch. 3, 7-8]