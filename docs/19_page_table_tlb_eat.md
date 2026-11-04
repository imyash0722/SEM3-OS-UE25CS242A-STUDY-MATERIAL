# Topic 19: Page Table Structures, TLB & Effective Access Time (EAT)

**Source**: Lecture 3.5 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8, Stallings Ch. 7)

---

## 19.1 Multi-Level Page Tables

### 2-Level (32-bit, 4KB pages)
```
p1 (10 bits) | p2 (10 bits) | d (12 bits)
    │            │           │
    ▼            ▼           ▼
Page Dir    Page Table    Frame
```

**Without TLB**: 1 memory access requires **3 physical memory accesses** (outer table, inner table, data frame)

---

## 19.2 Inverted Page Table

- One entry **per physical frame** (not per logical page)
- Used in 64-bit systems (PowerPC, UltraSPARC)
- Lookup via hash table (slower than direct indexing)
- Saves enormous memory for sparse 64-bit address spaces

---

## 19.3 TLB (Translation Lookaside Buffer)

### Purpose
- Hardware cache for page table entries
- **TLB Hit**: Translation in TLB → fast (bypass page table)
- **TLB Miss**: Walk page table → slow (2+ memory accesses)

### Structure
- Associative hardware cache (parallel lookup)
- Stores recent `<VPN, PPN>` mappings
- Typical size: 64-512 entries

---

## 19.4 Effective Access Time (EAT)

### Formula
```
EAT = α × (t_TLB + t_RAM) + (1-α) × (t_TLB + 2 × t_RAM)
```

Where:
- α = TLB hit ratio
- t_TLB = TLB lookup time
- t_RAM = Main memory access time

### Example
- α = 80% (0.80)
- t_TLB = 20 ns
- t_RAM = 100 ns

```
EAT = 0.80 × (20 + 100) + 0.20 × (20 + 2×100)
    = 0.80 × 120 + 0.20 × 220
    = 96 + 44 = 140 ns
```

### With 2-Level Paging on Miss
```
EAT = α(t_TLB + t_RAM) + (1-α)(t_TLB + 3×t_RAM)
```
(outer page table + inner page table + data frame)

---

## 19.3 TLB (Translation Lookaside Buffer)

### Purpose
- Hardware cache for page table entries
- **TLB Hit**: Translation in TLB → fast (bypass page table)
- **TLB Miss**: Walk page table → slow (2+ memory accesses)

### Structure
- Associative hardware cache (parallel lookup)
- Stores recent `<VPN, PPN>` mappings
- Typical size: 64-512 entries

---

## 19.4 Effective Access Time (EAT)

### Formula
```
EAT = α × (t_TLB + t_RAM) + (1-α) × (t_TLB + 2 × t_RAM)
```

Where:
- α = TLB hit ratio
- t_TLB = TLB lookup time
- t_RAM = Main memory access time

### Example
- α = 80% (0.80)
- t_TLB = 20 ns
- t_RAM = 100 ns

```
EAT = 0.80 × (20 + 100) + 0.20 × (20 + 2×100)
    = 0.80 × 120 + 0.20 × 220
    = 96 + 44 = 140 ns
```

### With 2-Level Paging on Miss
```
EAT = α(t_TLB + t_RAM) + (1-α)(t_TLB + 3×t_RAM)
```
(outer page table + inner page table + data frame)

---

## 19.5 Key Takeaways

1. **Multi-level paging** = reduces page table memory; 2-level = 3 memory accesses without TLB
2. **Inverted page table** = one entry per physical frame; scales with RAM not virtual space
3. **TLB** = hardware associative cache for page translations
4. **EAT** = α(t_TLB + t_RAM) + (1-α)(t_TLB + k×t_RAM) where k = page table levels + 1

---

## 19.6 Exam-Relevant MCQ Patterns

- **Q78**: TLB = fast associative cache for virtual-to-physical translations
- **Q79**: EAT calculation with given hit ratio, TLB time, RAM time
- **Q80**: 2-level paging without TLB = 3 memory accesses
- **Q81**: Inverted page table = one entry per physical frame

---

## 19.6 Practice Problems

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