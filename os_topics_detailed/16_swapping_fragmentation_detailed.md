# Topic 16 (Detailed): Swapping & Fragmentation

**Source**: Lecture 3.2 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8)

---

## 16.1 Swapping

- Move processes between RAM and backing store (swap space)
- Medium-term scheduler (swapper) manages this
- **Swap Out**: Process → Disk (free memory)
- **Swap In**: Disk → Process (resume execution)

---

## 16.2 Fragmentation

| Type | Description | Solution |
|------|-------------|----------|
| **External** | Free memory holes scattered; total memory exists but non-contiguous | Compaction, paging |
| **Internal** | Allocated block slightly larger than requested | Paging (fixed-size frames) |

### 50% Rule (External Fragmentation)

For N allocated blocks under First Fit: ~0.5N blocks lost to fragmentation
→ roughly 1/3 of total memory becomes unusable

### Compaction

- Move all processes to one end → large free block
- Expensive, needs **dynamic relocation** (base/limit registers)

---

## 16.3 Key Takeaways

1. **Swapping** = medium-term scheduler moves processes between RAM and disk
2. **External fragmentation** = free but non-contiguous; solved by compaction or paging
3. **Internal fragmentation** = allocated > requested; paging has internal frag on last page
4. **50% rule** = 0.5N blocks lost for N allocated blocks
5. **Compaction** = move processes to create large contiguous free space

---

## 16.4 Exam-Relevant MCQ Patterns

- **Q73**: Best Fit → smallest leftover hole
- **Q74**: 50% rule → 0.5N blocks lost (1/3 memory unusable)
- **Q75**: Paging eliminates external fragmentation but has internal fragmentation on last page

---

## 16.5 Practice Problems

### Problem 1: Swapping
```
When does swap out occur? When does swap in occur?
```

### Problem 2: Fragmentation
```
Given memory map with holes, identify internal vs external fragmentation.
```

### Problem 3: 50% Rule
```
20 allocated blocks under First Fit.
How many blocks lost to fragmentation? What % of memory?
```

### Problem 4: Compaction
```
When is compaction needed? What hardware support is required?
```

### Problem 5: Paging vs Fragmentation
```
Why does paging eliminate external fragmentation but have internal fragmentation?
```

---

*Next: Topic 17 (Segmentation)*