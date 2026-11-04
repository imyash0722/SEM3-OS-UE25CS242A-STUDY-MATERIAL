# Topic 32: RAID Structure

**Source**: Lecture 4.8 (Unit 4) + Textbook Ch. 12 (Silberschatz Ch. 12, Stallings Ch. 13)

---

## 32.1 RAID Basics

### What is RAID?
- **RAID** = **Redundant Array of Independent (Inexpensive) Disks**
- Multiple disks working together as a single storage unit
- Addresses: **Performance** + **Reliability**

### Why RAID?
| Problem | RAID Solution |
|---------|---------------|
| Single large disk expensive | Use multiple smaller disks |
| Single disk failure = catastrophic | Redundancy via redundancy |
| Slow single-disk access | Parallel I/O across disks |
| Data loss on failure | Redundancy (mirroring/parity) |

### RAID Goals
| Goal | Technique |
|------|-----------|
| **Large capacity** | Combine multiple disks |
| **Performance** | Striping (parallel I/O) |
| **Reliability** | Redundancy (mirroring/parity) |

---

## 32.2 Fundamental Techniques

### 32.1 Striping
- **Data split across multiple disks**
- **Block-level striping** (most common): Consecutive blocks on different disks
- **Bit-level striping**: Bits spread across disks (rare)

```
Block 0 → Disk 0
Block 1 → Disk 1
Block 2 → Disk 2
Block 3 → Disk 3
Block 4 → Disk 0
...
```

### Benefits of Striping
| Benefit | Description |
|---------|-------------|
| **Parallel I/O** | Multiple disks read/write simultaneously |
| **Higher throughput** | Aggregate bandwidth of all disks |
| **Parallel requests** | Different blocks served by different disks |

---

## 32.2 Mirroring (Shadowing)

### Concept
- **Exact copy** of data on two separate disks
- **RAID 1** = Mirroring

### Trade-offs
| Aspect | Benefit | Cost |
|--------|---------|------|
| **Read** | ✅ Parallel reads from both | |
| **Write** | ❌ Write to both (slower) | |
| **Reliability** | ✅ Complete redundancy | 2× disk cost |
| **Rebuild** | ✅ Fast (copy from good disk) | |

---

## 32.3 RAID Reliability Metrics

### MTTF (Mean Time To Failure)
- **Single disk MTTF**: 100,000 hours
- **Array of N disks**: MTTF_array = MTTF_disk / N
- **Example**: 100 disks × 100,000 hrs = 1,000 hours (41.6 days)

### MTTR (Mean Time To Repair)
- Time to replace failed disk + restore data

### Data Loss Probability
- Depends on: MTTF, MTTR, RAID level
- **Independent failures** assumed (not power/correlated)

---

## 32.4 RAID Levels

### RAID 0: Striping (No Redundancy)
| Aspect | Detail |
|--------|--------|
| **Technique** | Block-level striping |
| **Redundancy** | ❌ None |
| **Capacity** | N × disk size |
| **Read/Write** | ✅ Fast (parallel) |
| **Failure** | Any disk loss = total data loss |
| **MTTF** | Lowest (1/N of single disk) |
| **Use Case** | Performance-critical, non-critical data |

---

### RAID 1: Mirroring (Shadowing)
| Aspect | Detail |
|--------|--------|
| **Technique** | Exact copy on 2+ disks |
| **Redundancy** | ✅ Full (100%) |
| **Capacity** | N/2 × disk size (50% usable) |
| **Read** | ✅ Parallel from both |
| **Write** | ❌ Both disks (slower) |
| **Cost** | Highest (2× disks) |
| **Rebuild** | Fast (copy from good disk) |

---

### RAID 4: Block Striping + Dedicated Parity
| Aspect | Detail |
|--------|--------|
| **Striping** | Block-level |
| **Parity** | Dedicated parity disk |
| **Write Penalty** | High (parity disk bottleneck) |
| **Read** | Fast (parallel data disks) |
| **Write** | Slow (parity disk bottleneck) |

---

### RAID 5: Block-Interleaved Distributed Parity
| Aspect | Detail |
|--------|--------|
| **Striping** | Block-level |
| **Parity** | **Distributed** across all disks |
| **Parity Distribution** | Rotates across disks |
| **Write Penalty** | ✅ No bottleneck (parallel) |
| **Failure Tolerance** | 1 disk |
| **Capacity** | (N-1) × disk size |

### RAID 5 Parity Layout (4 Disks)
```
Block:     0    1    2    3
Disk 0:    D0   D1   D2   P3
Disk 1:    D4   D5   P2   D3
Disk 2:    D8   P1   D5   D6
Disk 3:    P0   D9   D10  D11
```
- Parity rotates across disks
- No single parity bottleneck

### Write Penalty
| Operation | Disk Accesses |
|-----------|---------------|
| **Read** | 1 (data) |
| **Write (small)** | 4 (read old data, read old parity, write new data, write new parity) |
| **Write (full stripe)** | N (optimal) |

---

### RAID 6: P+Q Dual Parity
| Aspect | Detail |
|--------|--------|
| **Parity** | Two independent parity schemes (P + Q) |
| **Failure Tolerance** | **2 disks** |
| **Write Penalty** | Higher than RAID 5 (2 parities) |
| **Capacity** | (N-2) × disk size |
| **Use Case** | High reliability, large arrays |

---

## 32.5 RAID Level Comparison

| Level | Technique | Redundancy | Capacity | Read | Write | Failure Tolerance |
|-------|-----------|------------|----------|------|-------|-------------------|
| **RAID 0** | Striping | ❌ None | N× | ⚡ Fast | ⚡ Fast | 0 disks |
| **RAID 1** | Mirroring | ✅ Full (2×) | N/2 | ⚡ Parallel | ⚠️ 2 writes | N-1 disks |
| **RAID 4** | Striping + Dedicated Parity | Parity disk | (N-1)× | ⚡ Fast | 🐢 Parity bottleneck | 1 disk |
| **RAID 5** | Striping + Distributed Parity | Distributed Parity | (N-1)× | ⚡ Fast | ⚡ Good (parallel) | 1 disk |
| **RAID 6** | Striping + Dual Parity | P+Q Parity | (N-2)× | ⚡ Fast | ⚠️ Dual parity calc | 2 disks |
| **RAID 10 (1+0)** | Mirror + Stripe | Mirror | N/2 | ⚡ Parallel | ⚡ Fast | N/2 disks |

---

## 32.6 RAID 10 (1+0) vs RAID 01 (0+1)

### RAID 10 (1+0): Mirror then Stripe
```
Mirror pairs → Stripe across pairs
Disk 1 ↔ Disk 2 (mirror)
Disk 3 ↔ Disk 4 (mirror)
Stripe across pairs

Failure: 1 disk lost → pair survives
```

### RAID 01 (0+1): Stripe then Mirror
```
Stripe first → Mirror the stripe
Stripe A ↔ Stripe B (mirror)

Failure: 1 disk lost → entire stripe fails
```

### Comparison
| Aspect | RAID 10 (1+0) | RAID 01 (0+1) |
|--------|---------------|---------------|
| **Single Disk Failure** | Pair survives | Entire stripe lost |
| **Rebuild** | Fast (copy from mirror) | Slow (entire stripe) |
| **Reliability** | ✅ Better | ⚠️ Worse |

---

## 32.6 RAID Level Comparison Summary

| Level | Redundancy | Capacity | Read | Write | Fail Tolerance | Cost |
|-------|------------|----------|------|-------|----------------|------|
| **0** | None | 100% | ⚡⚡⚡ | ⚡⚡⚡ | 0 | $ |
| **1** | Mirror | 50% | ⚡⚡ | ⚡ | N-1 | $$$ |
| **4** | Dedicated Parity | (N-1)/N | ⚡⚡ | 🐢 | 1 | $$ |
| **5** | Distributed Parity | (N-1)/N | ⚡⚡ | ⚡⚡ | 1 | $$ |
| **6** | Dual Parity | (N-2)/N | ⚡⚡ | ⚡ | 2 | $$$ |
| **10** | Mirror+Stripe | 50% | ⚡⚡ | ⚡⚡ | N/2 | $$$ |

---

## 32.7 RAID Implementation

### Software RAID
- **OS manages** RAID (Linux mdadm, Windows Storage Spaces)
- **CPU overhead** for parity calc
- **Flexible**, no special hardware

### Hardware RAID
- **Dedicated controller** with cache, battery backup
- **Offloads** parity calculation
- **Transparent** to OS
- **Better performance**, battery-backed cache

---

## 32.7 Key Takeaways

1. **RAID 0** = Speed only, no redundancy
2. **RAID 1** = Mirroring; simple, expensive, fast reads
3. **RAID 4** = Dedicated parity (bottleneck)
4. **RAID 5** = **Best balance**; distributed parity; 1 disk failure
5. **RAID 6** = Dual parity; 2 disk failures; enterprise
5. **RAID 10** = Best performance + reliability; expensive
6. **RAID 0+1 vs 1+0** = 1+0 preferred (better failure handling)

---

## 32.8 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **RAID 0** | Striping, no redundancy |
| **RAID 1** | Mirroring; 50% capacity; 2 writes |
| **RAID 4 vs 5** | 4 = dedicated parity (bottleneck); 5 = distributed |
| **RAID 5 write** | Read old data + old parity, write new data + new parity (4 I/Os) |
| **RAID 6** | Dual parity (P+Q); tolerates 2 failures |
| **RAID 10 vs 01** | 10 = mirror then stripe (better); 01 = stripe then mirror |
| **RAID 5 capacity** | (N-1) × disk size |
| **RAID 6 capacity** | (N-2) × disk size |
| **RAID 10 capacity** | 50% (N/2) |

---

## 32.8 Practice Problems

### Problem 1: Capacity Calculation
```
6 disks, 2TB each.
RAID 0? RAID 1? RAID 5? RAID 6? RAID 10?
```

### Problem 2: RAID 5 Write
```
4-disk RAID 5. Write 4KB block.
How many physical I/Os? What data read/written?
```

### Problem 3: Failure Tolerance
```
8-disk array. Which RAID levels survive 2 simultaneous failures?
```

### Problem 4: Write Penalty
```
RAID 5 small write = 4 I/Os (read old data, read old parity, write new data, write new parity)
RAID 6 small write = ? I/Os
```

### Problem 5: Rebuild Time
```
RAID 1 vs RAID 5 vs RAID 10: Which rebuilds fastest after 1 disk failure?
```

---

*Next: Topic 33 (System & Network Threats / Program Threats)*