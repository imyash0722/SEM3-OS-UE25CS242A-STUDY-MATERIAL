# Topic 29: File System — Free Space Management, Efficiency & Performance

**Source**: Lecture 4.5 (Unit 4) + Textbook Ch. 11 (Silberschatz Ch. 11, Stallings Ch. 12)

---

## 29.1 Free Space Management

### Purpose
- **Reuse disk space** from deleted files for new files
- **Free-space list** tracks all free disk blocks
- **On file create**: search free list, allocate, remove from list
- **On file delete**: add blocks back to free list

---

## 29.1 Free Space Management Methods

### 1. Bit Vector (Bitmap)

#### Structure
- **1 bit per block**: 1 = free, 0 = allocated
- **Size**: N blocks → N bits = N/8 bytes

#### Example
```
Disk blocks: 2,3,4,5,8,9,10,11,12,13,17,18,25,26,27 free
Bitmap:      001111001111110001100000011100000...
                ↑↑↑↑    ↑↑↑↑↑↑      ↑↑↑    ↑↑↑
                2-5      8-13         17-18   25-27
```

#### Size Calculation
```
N blocks → N bits = N/8 bytes

Example: 1TB disk, 4KB blocks
Blocks = 1TB / 4KB = 2^30 blocks
Bitmap = 2^30 bits = 2^27 bytes = 128 MB
```

#### Advantages
| Advantage | Description |
|-----------|-------------|
| **Simplicity** | Simple bit operations |
| **Fast search** | Find first free / n consecutive free blocks |
| **Space efficient** | 1 bit per block |

#### Finding Free Blocks
```c
// Find first free block
for (i = 0; i < bitmap_size; i++) {
    if (bitmap[i] != 0xFF) {  // not all 1s
        // find first 0 bit in bitmap[i]
    }
}

// Find n consecutive free blocks
// Scan for n consecutive 1 bits
```

---

## 29.2 Linked List

### Structure
- **Linked list** of all free blocks
- **Head pointer** in superblock (cached in memory)
- Each free block contains **pointer to next free block**

### Example
```
Free blocks: 2,3,4,5,8,9,10,11,12,13,17,18,25,26,27
Free list head → Block 2 → Block 3 → Block 4 → ... → Block 27 → NULL
```

### Disadvantages
| Issue | Impact |
|-------|--------|
| **I/O overhead** | Must read each block to traverse |
| **Not cacheable** | Each block on disk; can't cache entire list |
| **Slow traversal** | O(n) disk I/O to traverse |

---

## 29.2 Grouping (Modified Linked List)

### Concept
- Store **addresses of n free blocks** in first free block
- First n-1 entries = actual free blocks
- **n-th entry** = pointer to next group block

### Example (n=4)
```
Free block 2: [3, 4, 5, → 8]
Block 8:      [9, 10, 11, → 12]
Block 12:     [13, 14, 15, → 17]
```

### Advantages
| Advantage | Description |
|-----------|-------------|
| **Faster access** | n free block addresses per I/O |
| **Less I/O** | Fewer disk reads to traverse |
| **Scalable** | n can be tuned (e.g., 100-1000) |

---

## 29.3 Counting (Run-Length Encoding)

### Concept
- Store **(start block, count)** for contiguous free runs
- Efficient when many contiguous free blocks (common with contiguous allocation)

### Structure
```
Free List Entry = (Start Block, Count)
```

### Example
```
Free blocks: 2-5, 8-13, 17-18, 25-27
List: (2, 4), (8, 6), (17, 2), (25, 3)
```

### Data Structure
- **Balanced tree** (AVL, B-tree) for efficient lookup/insert/delete
- Better than linked list for large numbers of runs

---

## 29.2 Bit Vector vs Other Methods

| Method | Space | Search Speed | Best For |
|--------|-------|--------------|----------|
| **Bit Vector** | N/8 bytes | Fast (bit ops) | General purpose |
| **Linked List** | N pointers | Slow (I/O) | Few free blocks |
| **Grouping** | N/n pointers | Fast | Large free space |
| **Counting** | 2×runs | Fast (tree) | Contiguous free space |

---

## 29.2 Summary: Choosing a Method

| Scenario | Recommended Method |
|----------|-------------------|
| **General purpose** | Bit Vector |
| **Very few free blocks** | Linked List |
| **Many contiguous free** | Counting / Grouping |
| **Very large disk** | Bit Vector (if memory allows) or Grouping |

---

## 29.3 Efficiency & Performance

### Factors Affecting Efficiency
| Factor | Impact |
|--------|--------|
| **Disk allocation algorithm** | Contiguous/Linked/Indexed affects fragmentation |
| **Directory algorithms** | Linear vs hashed vs B-tree |
| **Directory entry data** | What metadata stored inline |
| **Metadata allocation** | Pre-allocation vs on-demand |

### Factors Affecting Performance
| Factor | Impact |
|--------|--------|
| **Data/metadata proximity** | Keep related data close |
| **Buffer cache** | Separate memory for frequent blocks |
| **Page cache** | Virtual memory caching (more efficient) |
| **Free-behind / Read-ahead** | Sequential access optimization |

---

## 29.3 Buffer Cache vs Page Cache

### Buffer Cache (Traditional)
- **Separate memory section** for file system blocks
- Caches file-system-oriented blocks
- **Separate from virtual memory**

### Page Cache (Modern)
- **Virtual memory techniques** to cache file data as pages
- **Unified virtual memory**: single cache for process pages + file data
- **Used by**: Linux, Windows, Solaris

### Comparison
| Aspect | Buffer Cache | Page Cache |
|--------|-------------|------------|
| **Granularity** | FS blocks (e.g., 4KB) | VM pages (e.g., 4KB) |
| **Integration** | Separate from VM | Unified with VM |
| **Efficiency** | Lower | Higher (VM integration) |
| **Systems** | Traditional Unix | Linux, Windows, Solaris |

### Unified Virtual Memory
```
Process Pages ←→ Page Cache ←→ Disk
```
- Single page cache for both process memory and file data
- Eliminates double buffering
- Better memory utilization

---

## 29.3 I/O Without vs With Unified Buffer Cache

### Without Unified Cache
```
read()/write() → Buffer Cache → Disk
mmap() → Page Cache → Disk
```
- **Two separate caches** → double buffering
- Data copied between caches

### With Unified Buffer Cache
```
read()/write()/mmap() → Unified Page Cache → Disk
```
- **Single cache** for all I/O
- No double buffering
- Better memory utilization

---

## 29.3 Sequential Access Optimization

### Free-Behind
- **When**: Sequential read
- **Action**: Remove page from buffer after next page requested
- **Rationale**: Previous pages unlikely to be reused
- **Benefit**: Frees buffer space for new pages

### Read-Ahead
- **When**: Sequential read detected
- **Action**: Read requested page + several subsequent pages
- **Rationale**: Next pages likely needed soon
- **Benefit**: Single disk transfer for multiple pages

### Comparison
| Technique | Trigger | Action | Benefit |
|-----------|---------|--------|---------|
| **Free-behind** | Next page requested | Evict previous page | Free buffer space |
| **Read-ahead** | Sequential pattern | Pre-fetch N pages | Reduce seek/latency |

### Combined Effect
```
Sequential read:  Read page 1 → Read-ahead 2,3,4 → Free-behind 1
                    → Read 2 → Read-ahead 3,4,5 → Free-behind 2
```

---

## 29.4 Key Takeaways

1. **Free Space Methods**: Bit vector (fast), Linked list (simple), Grouping (fast traversal), Counting (contiguous runs)
2. **Bit Vector** = best general purpose; **Counting** = best for contiguous allocation
3. **Buffer Cache** → **Page Cache** → **Unified VM** = evolution of I/O caching
4. **Unified VM** = single cache for process pages + file data
5. **Free-behind** = evict read pages during sequential access
6. **Read-ahead** = prefetch sequential pages
7. **Performance** = keep data/metadata close; use cache effectively

---

## 29.4 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Bit vector** | 1 bit per block; 1=free, 0=allocated |
| **Bit vector size** | N blocks = N/8 bytes |
| **Linked list free space** | Slow traversal; each block on disk |
| **Grouping** | Store n free addresses in first block |
| **Counting** | (start, count) for contiguous runs; use tree |
| **Buffer vs Page cache** | Buffer = FS blocks; Page = VM pages; Unified = both |
| **Free-behind** | Evict page after next page read |
| **Read-ahead** | Prefetch next N pages on sequential read |

---

## 29.4 Practice Problems

### Problem 1: Bit Vector Size
```
Disk: 2TB, Block size: 4KB
Calculate bit vector size in MB.
```

### Problem 2: Method Selection
```
System with 1TB disk, 90% full, contiguous allocation used.
Which free space method? Why?
```

### Problem 3: Buffer vs Page Cache
```
Explain why unified page cache is more efficient than separate buffer + page caches.
```

### Problem 4: Read-Ahead
```
Process reads 100MB file sequentially, 4KB pages.
Read-ahead = 4 pages. How many disk seeks without/with read-ahead?
```

### Problem 5: Free Space Method Choice
```
System A: 10TB, mostly empty, contiguous allocation
System B: 500GB, 95% full, indexed allocation
Choose free space method for each.
```

---

*Next: Topic 30 (Mass Storage Structure & Disk Scheduling)*