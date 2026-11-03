# Topic 17 (Detailed): Segmentation

**Source**: Lecture 3.3 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8)

---

## 17.1 Segmentation Basics

### Concept
- Memory-management scheme supporting **programmer's view of memory**
- Program = collection of **segments** (logical units):
  - Main program, procedure, function, method, object
  - Local/global variables, common block, stack, symbol table, arrays

### Programmer's View
```
Logical address = <segment-number s, offset d>
```
- Segment = logical unit (code, data, stack, etc.)
- Addresses: segment name + offset within segment

---

## 17.2 Segmentation Architecture

### Logical Address
```
<segment-number s, offset d>
```

### Segment Table
Each entry contains:
- **Segment base**: Starting physical address of segment
- **Segment limit**: Length of segment

### Registers
- **STBR** (Segment Table Base Register): Points to segment table in memory
- **STLR** (Segment Table Length Register): Number of segments used
  - Valid segment: `s < STLR`

---

## 17.3 Address Translation

```
Logical:  s (segment #) | d (offset)
                │
                ▼
        Segment Table[s] → Base, Limit
                │
                ├── Check: d < Limit? → if not → Trap (Segmentation Fault)
                │
                ▼
           Physical = Base + d
```

### Example
```
Segment Table:
Seg 0: Base=219, Limit=600
Seg 1: Base=2300, Limit=14
Seg 2: Base=90, Limit=100
Seg 3: Base=1327, Limit=580
Seg 4: Base=1952, Limit=96

Logical → Physical:
0,430  → 219+430=649        ✓
1,10   → 2300+10=2310       ✓
2,500  → Limit=100, offset=500 → TRAP!
3,400  → 1327+400=1727      ✓
4,112  → Limit=96, offset=112 → TRAP!
```

---

## 17.3 Segmentation vs Paging

| Metric / Concept | Paging | Segmentation |
|------------------|--------|--------------|
| **Division Unit** | Fixed-size blocks (pages/frames) | Variable-size logical blocks (code, stack, heap) |
| **Programmer View** | Invisible (physical abstraction) | Visible (logical modules) |
| **Internal Fragmentation** | Yes (on last page) | No |
| **External Fragmentation** | No (pages map anywhere) | Yes (variable segments leave holes) |
| **Hardware Table** | Page Table (Page → Frame) | Segment Table (Segment Base + Limit) |

---

## 17.4 Shared Segments
- Two processes can have segments with same base address
- Segments mapped to both → shared memory

---

## 17.5 Linux Angle: Flat Memory Model
- **Legacy x86**: Explicit segmentation registers (CS, DS, SS)
- **Modern Linux (x86-64)**: Flat memory model
  - Kernel sets all segment bases to `0x00000000`
  - Limit = maximum addressable space
  - Effectively neutralizes segmentation

---

## 17.4 Key Takeaways

1. **Segmentation** = variable-size logical units matching programmer view
2. **Logical address** = `<segment#, offset>`
3. **Segment table** = Base + Limit per segment
4. **External fragmentation** = yes (unlike paging)
5. **Segmentation fault** = offset ≥ limit

---

## 17.5 Exam-Relevant MCQ Patterns

- **Q82**: Fundamental difference — paging fixed/transparent, segmentation variable/visible
- **Q83**: Segmentation address translation — offset ≥ limit → trap (segmentation fault)

---

## 17.6 Practice Problems

### Problem 1: Address Translation
```
Segment Table:
Seg 0: Base=1000, Limit=500
Seg 1: Base=5000, Limit=1000

Logical <0, 200> → Physical?
Logical <1, 1200> → Trap?
```

### Problem 2: Fragmentation
```
Why does segmentation have external fragmentation but paging doesn't?
```

### Problem 3: Programmer View
```
Why is segmentation considered "visible" to the programmer?
```

### Problem 4: Segment Table
```
What does each entry in segment table contain?
```

### Problem 5: Segmentation Fault
```
When does a segmentation fault occur in segmentation?
```

---

*Next: Topic 18 (Paging)*