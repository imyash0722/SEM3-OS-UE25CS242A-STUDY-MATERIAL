# Topic 19 (Detailed): Page Table Structures, TLB & Effective Access Time (EAT)

**Source**: Lecture 3.5 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8, Stallings Ch. 7)

---

## 19.1 Hardware Support for Page Table

### Page Table in Memory
- **PTBR** (Page Table Base Register): Points to page table
- **PTLR** (Page Table Length Register): Indicates page table size
- Without TLB: every access = 2 memory accesses (page table + data)

### TLB (Translation Lookaside Buffer)
- Special fast-lookup hardware cache (associative memory)
- Solves two-memory-access problem
- Stores recent `<VPN, PPN>` mappings

---

## 19.2 Effective Access Time (EAT)

### Formula
```
EAT = α × (t_TLB + t_RAM) + (1-α) × (t_TLB + 2 × t_RAM)
```
Where:
- α = TLB hit ratio
- t_TLB = TLB lookup time
- t_RAM = Main memory access time

### Example
```
α = 80%, t_TLB = 20 ns, t_RAM = 100 ns
EAT = 0.80 × 120 + 0.20 × 220 = 140 ns
```

### With 2-Level Paging on Miss
```
EAT = α(t_TLB + t_RAM) + (1-α)(t_TLB + 3×t_RAM)
```
(outer page table + inner page table + data frame)

### Practice Problems
1. **TLB hit ratio = 90%, t_TLB=10ns, t_RAM=100ns, 2-level paging → EAT?**
2. **32-bit, 4KB pages, TLB size 64, 1000 accesses, 95% hit → memory accesses saved?**
3. **3-level paging, no TLB → memory accesses for one translation?**

---

## 19.3 TLB (Translation Lookaside Buffer)

### Purpose
- Hardware associative cache for page table entries
- **TLB Hit**: Translation in TLB → fast (bypass page table)
- **TLB Miss**: Walk page table → slow (2+ memory accesses)

### Structure
- Associative hardware cache (parallel lookup)
- Stores recent `<VPN, PPN>` mappings
- Typical size: 64-512 entries
- **ASID** (Address Space ID): Distinguishes processes in TLB

### TLB vs CPU Cache
| Aspect | TLB | CPU Cache |
|--------|-----|-----------|
| Purpose | Speed up address translation | Speed up memory access |
| Timing | At MMU translation | At CPU memory access |

---

## 19.4 Memory Protection

### Protection Bits
- Protection bit per frame: read-only / read-write
- Execute-only bits possible

### Valid/Invalid Bit
- **Valid (1)**: Page in address space, legal
- **Invalid (0)**: Page not in address space / on disk
- Alternative: PTLR (Page Table Length Register)

---

## 19.5 Valid/Invalid Bit & Demand Paging

### Demand Paging
- Mark pages **invalid** intentionally
- Page fault triggers OS to load page
- Pure demand paging: start process with no pages in memory

### Shared Pages
- **Code sharing**: Read-only (reentrant) code shared (text editors, compilers)
- **Reentrant code**: Non-self-modifying, reusable simultaneously
- **Example**: 40 users, 150KB code + 50KB data → 8,000KB without sharing → 2,150KB with sharing

---

## 19.6 Page Table Structures

### Problem: Page Table Size
```
32-bit, 4KB pages:
Entries = 2^20 = 1,048,576
4-byte PTE → 4 MB per process
```

---

## 19.7 Hierarchical (Multi-Level) Page Tables

### 2-Level Paging (32-bit, 4KB)
```
p1 (10 bits) | p2 (10 bits) | d (12 bits)
    │            │           │
    ▼            ▼           ▼
Page Dir    Page Table    Frame
```
- Only allocate page tables for used regions
- Reduces memory for sparse address spaces

### 64-bit Systems
- 2-level insufficient → 3, 4, or 5-level paging
- Linux x86-64: 4-level (PML4 → PDPT → PD → PT)

---

## 19.8 Hashed Page Tables

- Hash function on virtual page number
- Handle collisions via chaining
- Used when address space > physical memory

---

## 19.7 Inverted Page Table

- One entry **per physical frame** (not per logical page)
- Used in 64-bit systems (PowerPC, UltraSPARC)
- Lookup via hash table (slower than direct indexing)
- Saves enormous memory for sparse 64-bit address spaces

### Inverted PTE Structure
```
struct {
    int pid;        // Owning process
    int vpn;        // Virtual page number
    int frame;      // Physical frame
    // ... protection, ref, dirty bits
}
```

### Lookup
```
hash(pid, vpn) → bucket → linear search for (pid, vpn) match
```

### Trade-offs
| Pros | Cons |
|------|------|
| Scales with RAM (not virtual space) | Hash lookup slower than array index |
| One table for all processes | Collisions → chain traversal |
| Saves massive memory for 64-bit | Need separate per-process table for TLB shootdowns |

---

## 19.8 TLB (Translation Lookaside Buffer)

### Purpose
- Hardware cache for page table entries
- **TLB Hit**: Translation in TLB → fast
- **TLB Miss**: Walk page table → slow (2+ memory accesses)

### Structure
- Associative hardware cache (parallel lookup)
- Stores recent `<VPN, PPN>` mappings
- Typical size: 64-512 entries

---

## 19.9 Effective Access Time (EAT)

### Formula
```
EAT = α × (t_TLB + t_RAM) + (1-α) × (t_TLB + 2 × t_RAM)
```
Where:
- α = TLB hit ratio
- t_TLB = TLB lookup time
- t_RAM = Main memory access time

### Example
```
α = 80% (0.80)
t_TLB = 20 ns
t_RAM = 100 ns
EAT = 0.80 × 120 + 0.20 × 220 = 140 ns
```

### With 2-Level Paging on Miss
```
EAT = α(t_TLB + t_RAM) + (1-α)(t_TLB + 3×t_RAM)
```
(outer page table + inner page table + data frame)

### Practice Problems
1. **TLB hit ratio = 90%, t_TLB=10ns, t_RAM=100ns, 2-level paging → EAT?**
2. **32-bit, 4KB pages, TLB size 64, 1000 accesses, 95% hit → memory accesses saved?**
3. **3-level paging, no TLB → memory accesses for one translation?**

---

## 19.9 TLB (Translation Lookaside Buffer)

### Purpose
- Hardware cache for page table entries
- **TLB Hit**: Translation in TLB → fast (bypass page table)
- **TLB Miss**: Walk page table → slow (2+ memory accesses)

### Structure
- Associative hardware cache (parallel lookup)
- Stores recent `<VPN, PPN>` mappings
- Typical size: 64-512 entries

---

## 19.10 Key Takeaways

1. **Multi-level paging** = reduces page table memory; 2-level = 3 memory accesses without TLB
2. **Inverted page table** = one entry per physical frame; scales with RAM not virtual space
3. **TLB** = hardware associative cache for page translations
4. **EAT** = α(t_TLB + t_RAM) + (1-α)(t_TLB + k×t_RAM) where k = page table levels + 1

---

## 19.10 Exam-Relevant MCQ Patterns

- **Q78**: TLB = fast associative cache for virtual-to-physical translations
- **Q79**: EAT calculation with given hit ratio, TLB time, RAM time
- **Q80**: 2-level paging without TLB = 3 memory accesses
- **Q81**: Inverted page table = one entry per physical frame

---

## 19.11 Practice Problems

### Problem 1: EAT Calculation
```
TLB hit ratio = 90%
t_TLB = 10 ns
t_RAM = 100 ns
2-level paging
Calculate EAT.
```

### Problem 2: TLB vs Page Table
```
32-bit system, 4KB pages
TLB size: 64 entries
Page table in memory
Process accesses 1000 pages, TLB hit rate 95%
How many memory accesses saved by TLB?
```

### Problem 3: Multi-Level Page Walk
```
3-level paging, no TLB
How many memory accesses for one virtual address translation?
```

### Problem 4: Inverted Page Table
```
64-bit system, 4KB pages, 16GB RAM
Inverted table entry size: 16 bytes
Size of inverted page table?
```

### Problem 5: TLB Hit Ratio
```
Process runs for 1000 memory references
TLB hits: 920
TLB hit ratio? If TLB doubled, what happens to hit ratio?
```

---

*Next: Topic 20 (Virtual Memory — Demand Paging, Page Faults, Copy-on-Write)*