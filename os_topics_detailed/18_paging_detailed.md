# Topic 18 (Detailed): Paging

**Source**: Lecture 3.4 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8, Stallings Ch. 7)

---

## 18.1 Core Idea

**Key Idea**: Fixed-size frames (physical) + pages (logical) → **No external fragmentation**

---

## 18.2 Paging Basics

### Basic Method
- Divide physical memory into **fixed-size frames**
- Divide logical memory into **same-size pages**
- Page size = frame size (hardware-defined)
- Track all free frames
- Run program of N pages → find N free frames → load
- **Page table** translates logical → physical
- **Internal fragmentation** still exists (last page)

### Page Size
- Hardware-defined: 512 bytes to 1 GB
- Common: 4KB, 8KB
- `getconf PAGESIZE` displays system page size

---

## 18.2 Address Structure

### 32-bit, 4KB Pages
```
Page Number (20 bits) | Page Offset (12 bits)
```

### General Formula
- Page size = 2^d bytes
- Offset bits = d
- Page number bits = address_bits - d

---

## 18.3 Page Table

**Maps page → frame**

### Page Table Entry (PTE)
```
| Frame # | Valid | Prot | Ref | Dirty | ...
```

### PTE Bits
| Bit | Meaning |
|-----|---------|
| **Valid** | Page in memory? (1=yes, 0=on disk/not allocated) |
| **Protection** | Read/Write/Execute permissions |
| **Reference** | Page accessed recently (for LRU/Clock) |
| **Dirty** | Page modified (needs write-back on replacement) |

---

## 18.4 Page Table Size Calculation

### Example: 32-bit, 4KB pages, 4-byte PTE
```
Number of entries = 2^(32-12) = 2^20 = 1,048,576
Size = 2^20 × 4 bytes = 4 MB per process
```

---

## 18.5 Paging Example (Silberschatz)

```
Page size = 2,048 bytes
Process size = 72,766 bytes
Pages = 35 + 1,086 bytes
Internal fragmentation = 2,048 - 1,086 = 962 bytes
Worst case fragmentation = 1 frame - 1 byte
```

---

## 18.6 Free Frames & Frame Table
- OS manages physical memory via **frame table**
- Tracks free/allocated frames
- Page table used by CPU dispatcher for context switch
- Paging increases context-switch time

---

## 18.7 Two-Memory-Access Problem
Without TLB: every access needs 2 memory accesses (page table + data)

---

## 18.8 TLB (Translation Lookaside Buffer)

### Purpose
- Hardware cache for page table entries
- **TLB Hit**: Translation in TLB → fast (bypass page table)
- **TLB Miss**: Walk page table → slow (2+ memory accesses)

### Structure
- Associative hardware cache (parallel lookup)
- Stores recent `<VPN, PPN>` mappings
- Typical size: 64-512 entries
- **ASID** (Address Space ID): Distinguishes processes in TLB

---

## 18.9 Effective Access Time (EAT)

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
α = 80% (0.80), t_TLB = 20 ns, t_RAM = 100 ns
EAT = 0.80 × 120 + 0.20 × 220 = 140 ns
```

### With 2-Level Paging on Miss
```
EAT = α(t_TLB + t_RAM) + (1-α)(t_TLB + 3×t_RAM)
```

---

## 18.9 Multi-Level Page Tables

### 2-Level (32-bit, 4KB pages)
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

## 18.10 Inverted Page Table

- One entry **per physical frame** (not per logical page)
- Used in 64-bit systems (PowerPC, UltraSPARC)
- Lookup via hash table (slower than direct indexing)
- Saves enormous memory for sparse 64-bit address spaces

---

## 18.10 TLB Details

### TLB vs CPU Cache
| Aspect | TLB | CPU Cache |
|--------|-----|-----------|
| Purpose | Speed up address translation | Speed up memory access |
| Timing | At MMU translation | At CPU memory access |

### Memory Protection
- Protection bits per frame (read-only, read-write, execute-only)
- **Valid/Invalid bit**: `valid` = in address space; `invalid` = not in space / on disk
- PTLR (Page Table Length Register) alternative

### Valid/Invalid Bit
- `valid` = page in memory (memory resident)
- `invalid` = page on disk / not in address space
- Demand Paging: mark invalid intentionally to trigger page fault

### Shared Pages
- **Code sharing**: Read-only (reentrant) code shared (text editors, compilers)
- **COW**: fork() shares pages read-only; write triggers copy

---

## 18.11 Effective Access Time (EAT) Problems

### Problem 1
```
TLB hit ratio = 90%
t_TLB = 5 ns, t_RAM = 100 ns
2-level paging
Calculate EAT.
```

### Problem 2
```
32-bit, 4KB pages, TLB size 64
Process accesses 1000 pages, TLB hit 95%
Memory accesses saved?
```

### Problem 3
```
3-level paging, no TLB
Memory accesses for one translation?
```

---

## 18.12 Key Takeaways

1. **Paging** = fixed-size frames + pages → no external fragmentation
2. **Address split** = Page Number | Offset
3. **Page Table** = maps page → frame; PTE has Valid, Prot, Ref, Dirty bits
4. **32-bit, 4KB** → p=20 bits, d=12 bits; page table = 4 MB
5. **Multi-level** = reduce memory for sparse addresses
6. **Inverted** = one entry per frame; scales with physical RAM
7. **TLB** = hardware associative cache for page translations
8. **EAT** = α(t_TLB + t_RAM) + (1-α)(t_TLB + k×t_RAM)

---

## 18.13 Exam-Relevant MCQ Patterns

- **Q76**: 32-bit, 4KB pages → p=20, d=12
- **Q77**: Page table size = 2^20 × 4 bytes = 4 MB
- **Q78**: TLB = hardware cache for page translations
- **Q79**: EAT = α(TLB+RAM) + (1-α)(TLB+2×RAM)
- **Q80**: 2-level paging without TLB = 3 memory accesses
- **Q81**: Inverted page table = one entry per physical frame

---

## 18.14 Practice Problems

### Problem 1: Address Bits
```
32-bit address, 8KB pages
Calculate page number bits and offset bits.
```

### Problem 2: Page Table Size
```
64-bit system, 4KB pages, 8-byte PTE
Size of single-level page table?
```

### Problem 3: Multi-Level
```
32-bit, 4KB pages, 2-level
How many entries in page directory? In each page table?
```

### Problem 4: Inverted Page Table
```
Physical memory: 4GB, Page size: 4KB
How many entries in inverted page table?
```

### Problem 5: PTE Bits
```
Given PTE: Frame=5, Valid=1, Prot=RWX, Ref=1, Dirty=0
Is page in memory? Is it clean or dirty? Can it be executed?
```

---

*Next: Topic 19 (Page Table Structures, TLB & Effective Access Time)*