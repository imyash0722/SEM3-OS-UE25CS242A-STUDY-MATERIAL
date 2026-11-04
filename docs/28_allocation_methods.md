# Topic 28: File System — Allocation Methods

**Source**: Lecture 4.4 (Unit 4) + Textbook Ch. 11 (Silberschatz Ch. 11, Stallings Ch. 12)

---

## 28.1 Overview: Disk Space Allocation

### What is an Allocation Method?
- Determines **how disk blocks are assigned to files**
- Affects: performance, fragmentation, access speed, space utilization

### Three Main Methods
| Method | Description |
|--------|-------------|
| **Contiguous** | File = contiguous blocks |
| **Linked** | File = linked list of blocks |
| **Indexed** | File = index block with pointers |

---

## 28.2 Contiguous Allocation

### Concept
- Each file occupies **contiguous blocks** on disk
- Directory entry stores: **starting block** + **length** (in blocks)

### Advantages
| Advantage | Description |
|-----------|-------------|
| **Best performance** | Sequential & direct access both fast |
| **Simple** | Only starting block + length needed |
| **Direct access** | Block K = start + K |
| **Sequential access** | Natural, no seeks |

### Address Translation
```
Logical Address = Block # (Q) + Offset (R)
Block to access = Start Block + Q
Offset in block = R
```

### Example
```
File starts at block 100, length = 5 blocks
Block 0 → Physical 100
Block 1 → Physical 101
Block 2 → Physical 102
...
Block K → Physical (100 + K)
```

---

## 28.3 Contiguous Allocation Problems

| Problem | Description |
|---------|-------------|
| **External Fragmentation** | Free space scattered in small chunks |
| **Finding Space** | First-fit / Best-fit / Worst-fit needed |
| **File Size Known** | Must know final size at creation |
| **Compaction** | Required to reclaim space; offline (downtime) or online |

### Compaction
- **Offline**: System down; move all files to consolidate free space
- **Online**: System running; complex, affects performance

---

## 28.4 Linked Allocation

### Concept
- Each file = **linked list of blocks**
- Each block contains **pointer to next block**
- Directory entry: **pointer to first block**

### Structure
```
Directory Entry → Block 1 → Block 2 → Block 3 → ... → NULL
                    ↓           ↓           ↓
                 Data+ptr   Data+ptr   Data+ptr
```

### Space Overhead
| Parameter | Calculation |
|-----------|-------------|
| Block size | 512 bytes |
| Pointer size | 4 bytes |
| **Usable data** | 508 bytes per block |
| **Overhead** | ~0.8% per block |

### Clustering
- Group blocks into **clusters** (e.g., 4 blocks = 2KB)
- Allocate clusters instead of individual blocks
- Reduces pointer overhead

---

## 28.5 Linked Allocation: Pros & Cons

### Advantages
| Advantage | Description |
|-----------|-------------|
| **No external fragmentation** | Any free block can be used |
| **No compaction needed** | Free blocks anywhere |
| **Dynamic growth** | File can grow as long as free blocks exist |
| **Simple** | Only first block in directory |

### Disadvantages
| Disadvantage | Description |
|--------------|-------------|
| **No direct access** | Must traverse from start (O(n) seeks) |
| **Sequential only** | Efficient for sequential, poor for random |
| **Space overhead** | Pointer in each block |
| **Reliability** | Broken pointer → rest of file lost |
| **No caching benefit** | Can't cache intermediate blocks effectively |

---

## 28.5 FAT (File Allocation Table)

### Concept
- **FAT** = variation of linked allocation
- **Table at start of volume** indexed by block number
- **Like linked list but faster** (cached in memory)

### FAT Entry Values
| Value | Meaning |
|-------|---------|
| **0** | Free/unused block |
| **1...N-1** | Next block in chain |
| **EOF** | End of file (special marker) |

### FAT Operation
```
To allocate new block to file:
1. Find first 0 in FAT
2. Replace previous EOF with new block address
3. Set new block to EOF
```

### Directory Entry
```
Filename | Start Block | Size | Attributes
```

### FAT Advantages
| Benefit | Description |
|---------|-------------|
| **Faster traversal** | FAT cached in memory |
| **No disk seeks** for traversal | Table in RAM |
| **Simple allocation** | Scan FAT for 0 |

---

## 28.6 Indexed Allocation

### Concept
- **Index block** = special block with pointers to all file blocks
- **Each file** has its own index block
- Directory entry points to **index block**

### Structure
```
Directory Entry → Index Block → [Block 1, Block 2, Block 3, ...]
                                    ↓         ↓         ↓
                                Block 1   Block 2   Block 3
```

### Address Translation
```
Index Block[i] = Physical address of i-th file block
```

### Advantages
| Advantage | Description |
|-----------|-------------|
| **Direct access** | Index block gives direct block pointers |
| **No external fragmentation** | Any free block usable |
| **Fast random access** | O(1) block access via index |

### Disadvantages
| Disadvantage | Description |
|--------------|-------------|
| **Pointer overhead** | Index block full of pointers |
| **Small files waste** | 2-block file needs full index block |
| **Index block size limit** | Max file size limited by index block capacity |

### Overhead Comparison
| Method | Per-block Overhead |
|--------|-------------------|
| **Linked** | 1 pointer per block |
| **Indexed** | 1 pointer per block IN index block |

---

## 28.7 Indexed Allocation Variants

### 1. Linked Index Blocks
- Index blocks linked together for large files
- First index block points to next index block

### 2. Multi-level Index (Unix inode style)
```
Index Block → Indirect Block → Double Indirect → Triple Indirect
```

### 2. Combined Scheme (Unix inode)
```
inode:
  12 Direct pointers
  1 Single indirect pointer
  1 Double indirect pointer
  1 Triple indirect pointer
```

---

## 28.8 Allocation Method Comparison

| Aspect | Contiguous | Linked | Indexed |
|--------|------------|--------|---------|
| **Direct Access** | ✅ Excellent | ❌ Poor | ✅ Excellent |
| **Sequential Access** | ✅ Excellent | ✅ Good | ✅ Good |
| **External Fragmentation** | ❌ Severe | ✅ None | ✅ None |
| **Internal Fragmentation** | ❌ Last block | ⚠️ Per-block pointer | ⚠️ Index block |
| **Space Overhead** | None | 1 ptr/block | Index block |
| **File Growth** | Difficult | Easy | Easy |
| **File Deletion** | Creates holes | Easy | Easy |
| **Max File Size** | Disk size | Disk size | Index block capacity |
| **Reliability** | Good | Poor (broken link) | Good (index damage = loss) |

---

## 28.9 Free Space Management

### Bit Vector (Bitmap)
- **One bit per block**: 1 = free, 0 = allocated
- **Size**: N blocks → N bits = N/8 bytes
- **Example**: 1TB disk, 4KB blocks = 2^30 blocks = 2^27 bits = 128 MB bitmap

### Linked List
- Link all free blocks together
- First free block in superblock

### Grouping
- Store addresses of N free blocks in first free block
- Reduces list traversal

### Counting
- Store (start block, count) for contiguous free runs
- Efficient for contiguous free space

---

## 28.10 Key Takeaways

1. **Contiguous** = best performance, but external fragmentation
2. **Linked** = no external frag, but no direct access
3. **FAT** = linked + cached table for speed
4. **Indexed** = direct access, no external frag, index overhead
5. **Unix inode** = combined direct/indirect indexing
5. **Free space** = bitmap, linked list, grouping, or counting

---

## 28.11 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Contiguous allocation** | Start block + length; direct access = start + offset |
| **External fragmentation** | Contiguous suffers; linked/indexed don't |
| **Linked allocation** | No direct access; pointer overhead; no external frag |
| **FAT** | Table in memory; 0=free; chain of blocks |
| **Indexed allocation** | Index block with pointers; direct access |
| **Small files + indexed** | Wasteful (index block per file) |
| **Unix inode** | 12 direct + 1 indirect + 1 double + 1 triple indirect |
| **External fragmentation** | Contiguous only; solved by paging/compaction |

---

## 28.11 Practice Problems

### Problem 1: Contiguous Allocation
```
File starts at block 5000, length 200 blocks.
What is physical block for logical block 50?
```

### Problem 2: Linked Allocation
```
Block size = 4KB, pointer = 8 bytes.
Usable data per block? Overhead %?
```

### Problem 3: FAT Operation
```
FAT[5] = 0, FAT[6] = 7, FAT[7] = EOF.
File starts at block 5. Add block 6 to file.
Show FAT changes.
```

### Problem 4: Indexed Allocation
```
Index block holds 1024 pointers (4KB block, 4-byte ptrs).
Max file size? Overhead for 3-block file?
```

### Problem 5: Unix Inode
```
12 direct + 1 indirect + 1 double + 1 triple indirect.
Block size 4KB, pointer 8 bytes.
Max file size?
```

---

*Next: Topic 29 (Free Space Management & Efficiency)*