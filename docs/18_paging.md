# Topic 18: Paging

**Source**: Lecture 3.4 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8, Stallings Ch. 7)

---

## 18.1 Core Idea

**Key Idea**: Fixed-size frames (physical) + pages (logical) → **No external fragmentation**

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

## 18.5 Multi-Level Page Tables

### 2-Level Paging (32-bit, 4KB pages)
```
Page Dir Index (10) | Page Table Index (10) | Offset (12)
```

- Only allocate page tables for used regions
- Reduces memory for sparse address spaces

---

## 18.6 Inverted Page Table

- One entry **per physical frame** (not per logical page)
- Saves memory for 64-bit address spaces
- Slower lookup (hash table)

---

## 18.7 Key Takeaways

1. **Paging** = fixed-size frames + pages → no external fragmentation
2. **Address split** = Page Number | Offset
3. **Page Table** = maps page → frame; PTE has Valid, Prot, Ref, Dirty bits
3. **32-bit, 4KB** → p=20 bits, d=12 bits; page table = 4 MB
4. **Multi-level** = reduce memory for sparse addresses
5. **Inverted** = one entry per frame; scales with physical RAM

---

## 18.8 Exam-Relevant MCQ Patterns

- **Q76**: 32-bit, 4KB pages → p=20, d=12
- **Q77**: Page table size = 2^20 × 4 bytes = 4 MB
- **Q78**: TLB = hardware cache for page translations
- **Q79**: EAT = α(TLB+RAM) + (1-α)(TLB+2×RAM)
- **Q80**: 2-level paging without TLB = 3 memory accesses
- **Q81**: Inverted page table = one entry per physical frame

---

## 18.8 Practice Problems

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