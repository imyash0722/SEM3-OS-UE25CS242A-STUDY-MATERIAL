# Topic 17 (Detailed): Segmentation

**Source**: Lecture 3.3 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8)

---

## 17.1 Segmentation Basics

### Logical Address

```
<segment-number, offset>
```

### Segment Table

- Base + Limit per segment
- Supports user view of memory (code, data, stack segments)

### Characteristics

| Aspect | Details |
|--------|---------|
| **Division Unit** | Variable-size logical blocks (code, stack, heap) |
| **Programmer View** | Visible — matches modular programming |
| **Internal Fragmentation** | No |
| **External Fragmentation** | Yes (variable segments leave holes) |
| **Hardware Table** | Segment Table (Segment Base + Limit) |

---

## 17.2 Address Translation

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

---

## 17.3 Segmentation vs Paging

| Metric / Concept | Paging | Segmentation |
|------------------|--------|--------------|
| **Division Unit** | Fixed-size blocks (pages / frames) | Variable-size logical blocks (code, stack, heap) |
| **Programmer View** | Invisible (physical abstraction) | Visible (logical modules) |
| **Internal Fragmentation** | Yes (on last page) | No |
| **External Fragmentation** | No (pages map anywhere) | Yes (variable segments leave holes) |
| **Hardware Table** | Page Table (Page → Frame) | Segment Table (Segment Base + Limit) |

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

## 17.5 Practice Problems

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

### Problem 3: Segment Table
```
What does each entry in segment table contain?
```

### Problem 4: Segmentation Fault
```
When does a segmentation fault occur in segmentation?
```

---

*Next: Topic 18 (Paging)*