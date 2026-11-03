# Topic 16 (Detailed): Swapping & Fragmentation

**Source**: Lecture 3.2 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8)

---

## 16.1 Swapping

### Concept
- Process swapped temporarily out of memory to backing store, then back for continued execution
- Total physical memory space of processes can exceed physical memory
- **Backing store**: Fast disk large enough for all memory images; direct access required

### Swapping Variants
| Variant | Description |
|--------|-------------|
| **Roll out, roll in** | Priority-based; lower-priority swapped out for higher-priority |
| **Standard** | Swapping disabled normally; enabled when memory > threshold |

### Swapping Details
- **Backing store**: Fast disk, direct access to memory images
- **Transfer time**: Major part of swap time; proportional to memory size
- **Ready queue**: Processes with memory images on disk

### Context Switch with Swapping
```
Example: 100MB process, 50MB/sec disk
Swap out = 100/50 = 2 sec
Swap in = 2 sec
Total context switch = 4 seconds (just swapping)
```
- 3GB process → 60 seconds swap time!
- **Optimization**: Swap only used memory via `request_memory()`/`release_memory()`

### Swapping Constraints
- **Pending I/O**: Can't swap out (I/O would go to wrong process) → double buffering
- **Standard swapping** rarely used in modern OS; modified versions common
- Swapping disabled normally; enabled when memory > threshold

---

## 16.2 Contiguous Memory Allocation

### Memory Layout
```
Low addr ──► [OS: interrupt vector, kernel] ──► [User Processes] ──► High addr
```

### Hardware Support
- **Base register**: Smallest physical address
- **Limit register**: Logical address range (address < limit)
- **MMU**: Maps logical → physical dynamically
- **Dispatcher**: Loads base/limit registers during context switch

### Memory Protection
- Every CPU address checked against base/limit
- Protects OS and other users' programs
- Allows dynamic OS size (e.g., load device drivers on demand)

---

## 16.3 Partition Allocation

### Fixed Partitions (IBM OS/360)
- Memory divided into fixed-size partitions
- One process per partition
- Degree of multiprogramming = number of partitions
- **Internal fragmentation**: allocated > requested

### Variable Partitions (Modern)
- Partitions sized to process needs
- Hole = block of available memory
- OS maintains table of allocated/free partitions
- Process allocated from sufficiently large hole
- On exit: partition freed, adjacent free holes combined

### Example Problem
```
Processes: 5=100MB, 8=400MB, 2=200MB, 9=200MB, 10=100MB
Process 5 terminates → can 11=200MB be accommodated?
```

---

## 16.4 Dynamic Storage Allocation Strategies

| Strategy | Description | Pros/Cons |
|----------|-------------|-----------|
| **First Fit** | First hole big enough | Fast; good utilization |
| **Best Fit** | Smallest hole big enough | Smallest leftover; must search all |
| **Worst Fit** | Largest hole | Largest leftover; poor utilization |

### Example
```
Partitions: 300, 600, 350, 200, 750, 125 KB
Processes: 115, 500, 358, 200, 375 KB
```

### 50% Rule (First Fit)
- N allocated blocks → ~0.5N blocks lost to fragmentation
- ~1/3 memory unusable: `(0.5N)/(N+0.5N) = 1/3`

---

## 16.5 Fragmentation

| Type | Description | Solution |
|------|-------------|----------|
| **Internal** | Allocated > requested; unused within partition | Paging (fixed frames) |
| **External** | Total free space exists but not contiguous | Paging; Compaction |

### Compaction
- Shuffle memory to create one large free block
- Requires dynamic relocation (execution-time binding)
- **Problem**: CPU overhead of moving 8GB RAM!
- **I/O issue**: Latch job during I/O; use OS buffers

---

## 16.6 Key Takeaways

1. **Swapping** = medium-term scheduler moves processes between RAM and disk
2. **External fragmentation** = free but non-contiguous; solved by paging
3. **Internal fragmentation** = allocated > requested; paging has internal frag on last page
4. **50% rule** = 0.5N blocks lost for N allocated blocks
5. **Compaction** = move processes to create large contiguous free space

---

## 16.7 Exam-Relevant MCQ Patterns

- **Q73**: Best Fit → smallest leftover hole
- **Q74**: 50% rule → 0.5N blocks lost (1/3 memory unusable)
- **Q75**: Paging eliminates external fragmentation but has internal fragmentation on last page

---

## 16.8 Practice Problems

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