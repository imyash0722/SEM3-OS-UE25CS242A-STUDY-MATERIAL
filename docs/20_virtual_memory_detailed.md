# Topic 20 (Detailed): Virtual Memory — Demand Paging, Page Faults, Copy-on-Write

**Source**: Lecture 3.6 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 20.1 Background: Virtual Memory

### Definition
- **Virtual Memory**: Separation of user logical memory from physical memory
- Allows programs **larger than physical memory**
- Only part of program needs to be in memory
- More programs can run concurrently

### Virtual Address Space
```
Stack: starts at MAX address, grows DOWN
Heap:  starts at low address, grows UP
Hole:  Unused space between stack and heap
```
- No physical memory needed until heap/stack grows to new page
- Enables sparse address spaces with holes for growth
- System libraries shared via mapping into virtual address space
- Shared memory via mapping pages read-write
- Pages shared during `fork()` → speeds process creation

### Shared Library Example
```
40 users × text editor (150KB code + 50KB data)
Without sharing: 40 × 200KB = 8,000 KB
With code sharing: 150KB + 40 × 50KB = 2,150 KB
```

---

## 20.1 Demand Paging

### Core Philosophy
**Pages loaded into physical memory only when referenced** (lazy loading)

- **Valid/Invalid bit** in PTE:
  - **Valid (1)** = page in memory
  - **Invalid (0)** = page on disk or not allocated

---

## 20.2 Page Fault Handling

```
1. Process accesses invalid page → Page Fault Trap
2. OS checks: Valid access? (within VMA, permissions OK?)
3. Find free frame (or victim via replacement)
4. If victim dirty → Write to swap
5. Read requested page from disk into frame
6. Update PTE (frame #, valid=1)
7. Restart faulting instruction
```

---

## 20.3 Minor vs Major Page Fault

| Type | Description | Latency |
|------|-------------|---------|
| **Minor** | Page already in RAM (shared library, free list, COW copy) — **zero disk I/O** | Microseconds |
| **Major** | Page must be read from **disk** | Milliseconds |

---

## 20.4 Copy-on-Write (COW)

### fork() with COW
1. `fork()` shares **all pages read-only** (COW)
2. Parent/child can read freely
3. On **write attempt** → Page Fault (protection violation)
4. OS allocates new frame, copies page, marks read-write
5. Restarts instruction

```c
// COW example
pid = fork();
// Parent and child share ALL pages (read-only)
// Child calls exec() → new program loaded (no COW needed for that)
// Or child modifies variable → COW triggers → private copy made
```

---

## 20.5 Dirty Bit (Modify Bit)

| Value | Meaning |
|-------|---------|
| **0 (Clean)** | Page not modified → overwrite immediately on replacement |
| **1 (Dirty)** | Page modified → **must write back to disk** before replacement (doubles fault time) |

---

## 20.6 Complete Page Fault Flow

```
CPU accesses page
       │
       ▼
MMU checks PTE Valid bit
       │
       ├── Valid=1 → Physical address → Memory access (fast)
       │
       └── Valid=0 → PAGE FAULT TRAP
                        │
                        ▼
              OS Page Fault Handler
                        │
                        ├── Check: Valid access? (VMA, permissions)
                        │
                        ├── Find free frame (or victim via replacement)
                        │
                        ├── If victim dirty → Write to swap
                        │
                        ├── Read page from disk into frame
                        │
                        ├── Update PTE (frame#, valid=1)
                        │
                        └── Restart faulting instruction
```

---

## 20.7 Minor vs Major Page Fault Details

| Aspect | Minor Fault | Major Fault |
|--------|-------------|-------------|
| **Source** | Page in RAM (COW, shared lib, zero-fill) | Page on disk |
| **Disk I/O** | **None** | Required |
| **Latency** | Microseconds | Milliseconds |
| **Example** | COW copy, shared library, zero-fill | First access, swapped out |

---

## 20.8 Copy-on-Write (COW) Details

### Mechanism
```
Hardware Enforcement: OS marks PTEs for BOTH processes as Read-Only
The Trap: If either process writes → MMU triggers protection fault
OS Response: Intercepts trap → allocates new frame → copies data →
             updates PTE to Read/Write → restarts instruction
```

### COW & fork()
```
Parent forks Child
    │
    ├── Both share ALL pages (Read-Only, COW)
    │
    ├── Child calls exec()
    │     └── New address space loaded; COW pages discarded
    │
    └── Child modifies variable
          └── COW triggers → private copy made
```

---

## 20.9 Dirty Bit (Modify Bit)

| Value | Meaning | Replacement Action |
|-------|---------|-------------------|
| **0 (Clean)** | Page not modified | Overwrite immediately (no disk write) |
| **1 (Dirty)** | Page modified | **Must write back to disk** first (doubles fault time) |

---

## 20.10 Page Replacement Need

### When No Free Frame
```
Page fault → No free frame → Page replacement
1. Find victim frame (algorithm)
2. If victim dirty → Write to swap
3. Read requested page into frame
4. Update page/frame tables
5. Restart instruction
```

### Note
- Potentially **2 page transfers** per fault (victim out + new in)
- Increases EAT

---

## 20.11 Linux Implementation: kswapd

### The Problem
- Should OS wait for 0 free frames before replacing?

### Linux Solution: kswapd (Kernel Swap Daemon)
- **Watermarks**: "high" and "low" free memory thresholds
- When free memory < low watermark → kswapd wakes up
- Proactively evicts inactive pages in background
- Builds pool of free frames → programs rarely wait synchronously

---

## 20.12 Mobile/Modern Optimizations

### Compressed Memory (ZRAM)
- Android, macOS/iOS use compressed memory (ZRAM)
- Instead of disk swap: compress inactive page, keep in RAM
- CPU cycles cheaper than disk I/O

---

## 20.13 Key Takeaways

1. **Demand Paging** = load pages on reference (lazy loading)
2. **Page Fault** = trap → check validity → find frame → read from disk → update PTE → restart
3. **Minor Fault** = resolves in RAM (COW, shared lib); **Major Fault** = disk I/O
4. **COW** = fork() shares pages read-only; write triggers private copy
5. **Dirty Bit** = if 0, no write-back needed on replacement

---

## 20.14 Exam-Relevant MCQ Patterns

- **Q84**: Demand paging = load pages on reference (lazy loading)
- **Q85**: Page fault handling — MMU generates trap to OS first
- **Q86**: COW fork — protection violation trap → OS copies page → restarts instruction
- **Q87**: Minor vs Major fault — minor = no disk I/O; major = disk read
- **Q88**: Dirty bit = if 0, no write-back needed on replacement

---

## 20.15 Practice Problems

### Problem 1: Page Fault Trace
```
Process accesses: 1,2,3,4,1,2,5,1,2,3,4,5
Frames: 3, LRU
Trace page faults. Which are major vs minor?
```

### Problem 2: COW Scenario
```
Parent forks child.
Child writes to page 5.
Parent reads page 5.
Trace COW mechanism. How many physical pages for page 5?
```

### Problem 3: EAT Calculation
```
TLB hit ratio = 90%
t_TLB = 10 ns
t_RAM = 100 ns
2-level paging
Calculate EAT.
```

### Problem 4: Page Table Size
```
64-bit system, 4KB pages, 8-byte PTE
Size of single-level page table? Why inverted table needed?
```

### Problem 5: mmap() Usage
```
Process mmaps 1GB file with MAP_PRIVATE.
Writes to offset 100MB.
What happens? Is file modified?
```

---

*Next: Topic 21 (Page Replacement, Frame Allocation, Thrashing)*