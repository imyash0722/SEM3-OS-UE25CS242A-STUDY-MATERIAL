# Topic 20: Virtual Memory — Demand Paging, Page Faults, Copy-on-Write

**Source**: Lecture 3.6 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 20.1 Demand Paging

### Core Philosophy
**Pages loaded into physical memory only when referenced** (lazy loading)

- Valid/Invalid bit in PTE:
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

## 20.6 Key Takeaways

1. **Demand Paging** = load pages on reference (lazy loading)
2. **Page Fault** = trap → check validity → find frame → read from disk → update PTE → restart
3. **Minor Fault** = resolves in RAM (COW, shared lib); **Major Fault** = disk I/O
4. **COW** = fork() shares pages read-only; write triggers private copy
5. **Dirty Bit** = if 0, no disk write needed on replacement

---

## 20.7 Exam-Relevant MCQ Patterns

- **Q84**: Demand paging = load pages on reference (lazy loading)
- **Q85**: Page fault handling — MMU generates trap to OS first
- **Q86**: COW fork — protection violation trap → OS copies page → restarts instruction
- **Q87**: Minor vs Major fault — minor = no disk I/O; major = disk read
- **Q88**: Dirty bit = if 0, no write-back needed on replacement