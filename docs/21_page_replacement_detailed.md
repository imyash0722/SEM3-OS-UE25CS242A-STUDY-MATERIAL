# Topic 21 (Detailed): Page Replacement — Complete Traces, Belady's Anomaly, Clock Algorithm

**Source**: Lecture 3.7 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 21.1 Page Replacement Problem

When a page fault occurs and no free frames exist, OS must choose a **victim frame** to evict.

```
Page Fault → No free frames → Choose victim → Write if dirty → Read new page → Update PTE → Restart
```

**Goal**: Minimize page faults.

---

## 21.2 Reference String Example

We'll trace all algorithms on this string (from slides):

```
Reference String: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
```

---

## 21.3 FIFO (First-In, First-Out)

### Algorithm
- Circular queue of frames
- Victim = oldest loaded page
- Simple pointer: `victim = (victim + 1) % num_frames`

### Trace: 3 Frames

| Ref | Frames (oldest→newest) | Fault? | Notes |
|-----|------------------------|--------|-------|
| 1   | [1]                    | ✅     |       |
| 2   | [1, 2]                 | ✅     |       |
| 3   | [1, 2, 3]              | ✅     | Full  |
| 4   | [4, 2, 3] ←evict 1     | ✅     |       |
| 1   | [4, 1, 3] ←evict 2     | ✅     |       |
| 2   | [4, 1, 2] ←evict 3     | ✅     |       |
| 5   | [5, 1, 2] ←evict 4     | ✅     |       |
| 1   | [5, 1, 2]              | ❌     | Hit!  |
| 2   | [5, 1, 2]              | ❌     | Hit!  |
| 3   | [5, 3, 2] ←evict 1     | ✅     |       |
| 4   | [5, 3, 4] ←evict 2     | ✅     |       |
| 5   | [5, 3, 4]              | ❌     | Hit!  |

**Total Faults: 9**

### Trace: 4 Frames (Belady's Anomaly!)

| Ref | Frames | Fault? |
|-----|--------|--------|
| 1   | [1]    | ✅     |
| 2   | [1,2]  | ✅     |
| 3   | [1,2,3]| ✅     |
| 4   | [1,2,3,4]| ✅   |
| 1   | [1,2,3,4]| ❌    |
| 2   | [1,2,3,4]| ❌    |
| 5   | [5,2,3,4]←evict 1| ✅ |
| 1   | [5,1,3,4]←evict 2| ✅ |
| 2   | [5,1,2,4]←evict 3| ✅ |
| 3   | [5,1,2,3]←evict 4| ✅ |
| 4   | [5,4,2,3]←evict 1| ✅ |
| 5   | [5,4,2,3]         | ❌    |

**Total Faults: 10** → **More frames = MORE faults!**

---

## 21.4 Optimal (OPT / MIN)

### Algorithm
- **Theoretical**: Replace page not used for longest time in **future**
- Impossible in practice (needs future knowledge)
- Used as **benchmark**

### Trace: 3 Frames

| Ref | Future Refs | Frames | Fault? | Reason |
|-----|-------------|--------|--------|--------|
| 1   | 1,2,5,1,2,3,4,5 | [1] | ✅ |       |
| 2   | 2,3,4,1,2,5,1,2 | [1,2] | ✅ |       |
| 3   | 3,4,1,2,5,1,2   | [1,2,3] | ✅ |       |
| 4   | 4,1,2,5,1,2,3   | [4,2,3] ←evict 1 | ✅ | 1 used at pos 5 |
| 1   | 1,2,5,1,2       | [4,1,3] ←evict 2 | ✅ | 2 used at pos 6 |
| 2   | 2,5,1,2         | [4,1,2] ←evict 3 | ✅ | 3 used at pos 10 |
| 5   | 5,1,2,3,4       | [4,1,5] ←evict 2 | ✅ | 2 used at pos 9 |
| 1   | 1,2,3,4         | [4,1,5] | ❌ | Hit |
| 2   | 2,3,4           | [4,2,5] ←evict 1 | ✅ | 1 used at pos 12 |
| 3   | 3,4             | [4,2,3] ←evict 5 | ✅ | 5 used at pos 12 |
| 4   | 4               | [4,2,3] | ❌ | Hit |
| 5   | (none)          | [5,2,3] ←evict 4 | ✅ | 4 used at pos 11 |

**Total Faults: 7** (optimal)

---

## 21.5 LRU (Least Recently Used)

### Algorithm
- Replace page not used for longest time in **past**
- **Stack algorithm** → immune to Belady's Anomaly

### Trace: 3 Frames (Using Timestamps)

| Ref | Frames (with timestamps) | Fault? | Action |
|-----|--------------------------|--------|--------|
| 1   | [1@1]                    | ✅     |        |
| 2   | [1@1, 2@2]               | ✅     |        |
| 3   | [1@1, 2@2, 3@3]          | ✅     |        |
| 4   | [4@4, 2@2, 3@3] ←evict 1 | ✅     | 1 oldest (t=1) |
| 1   | [4@4, 1@5, 3@3] ←evict 2 | ✅     | 2 oldest (t=2) |
| 2   | [4@4, 1@5, 2@6] ←evict 3 | ✅     | 3 oldest (t=3) |
| 5   | [4@4, 1@5, 5@7] ←evict 2 | ✅     | 2 oldest (t=5? wait...) |

Let me redo with proper timestamps:

```
Time 1: Ref 1 → [1@1]                    Fault
Time 2: Ref 2 → [1@1, 2@2]               Fault
Time 3: Ref 3 → [1@1, 2@2, 3@3]          Fault
Time 4: Ref 4 → [4@4, 2@2, 3@3]          Fault (evict 1@1)
Time 5: Ref 1 → [4@4, 1@5, 3@3]          Fault (evict 2@2)
Time 6: Ref 2 → [4@4, 1@5, 2@6]          Fault (evict 3@3)
Time 7: Ref 5 → [5@7, 1@5, 2@6]          Fault (evict 4@4)
Time 8: Ref 1 → [5@7, 1@8, 2@6]          Hit (update 1@8)
Time 9: Ref 2 → [5@7, 1@8, 2@9]          Hit (update 2@9)
Time 10: Ref 3 → [5@7, 3@10, 2@9]        Fault (evict 1@8)
Time 11: Ref 4 → [4@11, 3@10, 2@9]       Fault (evict 5@7)
Time 12: Ref 5 → [4@11, 3@10, 5@12]      Fault (evict 2@9)
```

**Total Faults: 10**

---

## 21.6 Clock (Second-Chance) Algorithm

### Algorithm
- Circular list of frames with **reference bit (R)**
- Hand sweeps around:
  - If R=0 → victim (replace)
  - If R=1 → R=0, give second chance, advance hand

### Trace: 3 Frames

```
Initial: all R=0

Ref 1: [1@R=1]           Fault, set R=1
Ref 2: [1@1, 2@1]        Fault, set R=1
Ref 3: [1@1, 2@1, 3@1]   Fault, set R=1
Ref 4: Hand at 1@1→R=1→set 0, advance
       Hand at 2@1→R=1→set 0, advance
       Hand at 3@1→R=1→set 0, advance
       Hand at 1@0→VICTIM! Replace with 4@1
       Frames: [4@1, 2@0, 3@0]
Ref 1: Hand at 2@0→VICTIM! Replace with 1@1
       Frames: [4@1, 1@1, 3@0]
Ref 2: Hand at 3@0→VICTIM! Replace with 2@1
       Frames: [4@1, 1@1, 2@1]
Ref 5: Hand at 4@1→set 0, advance
       Hand at 1@1→set 0, advance
       Hand at 2@1→set 0, advance
       Hand at 4@0→VICTIM! Replace with 5@1
       Frames: [5@1, 1@0, 2@0]
Ref 1: Hit! Set R=1 → [5@1, 1@1, 2@0]
Ref 2: Hit! Set R=1 → [5@1, 1@1, 2@1]
Ref 3: Hand at 5@1→set 0, advance
       Hand at 1@1→set 0, advance
       Hand at 2@1→set 0, advance
       Hand at 5@0→VICTIM! Replace with 3@1
       Frames: [3@1, 1@0, 2@0]
Ref 4: Hand at 1@0→VICTIM! Replace with 4@1
       Frames: [3@1, 4@1, 2@0]
Ref 5: Hand at 2@0→VICTIM! Replace with 5@1
       Frames: [3@1, 4@1, 5@1]
```

**Faults: 9** (same as FIFO for this string, but no Belady's Anomaly!)

---

## 21.7 Enhanced Clock (With Dirty Bit)

### 4 Priority Classes (Best → Worst)

| Priority | (Ref, Dirty) | Reason |
|----------|--------------|--------|
| **1 (Best)** | (0, 0) | Not referenced, clean → no write-back |
| **2** | (0, 1) | Not referenced, dirty → needs write-back |
| **3** | (1, 0) | Referenced, clean → recently used |
| **4 (Worst)** | (1, 1) | Referenced and dirty |

### Algorithm
1. Scan for (0,0) — if found, replace
2. If not found, scan for (0,1) — clear ref, advance
3. If not found, scan for (1,0) — clear ref, advance
4. If not found, scan for (1,1) — clear ref, advance
5. Repeat from step 1

**Linux uses variant** of enhanced clock.

---

## 21.7 Complete Page Replacement Simulator

```c
/*
 * File: page_replacement.c
 * Complete simulator for FIFO, OPT, LRU, Clock, Enhanced Clock
 * Compile: gcc -o page_replacement page_replacement.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define MAX_FRAMES 10
#define MAX_REFS 100

typedef struct {
    int page;
    int ref_bit;
    int dirty_bit;
    int timestamp;  // For LRU
    int loaded_time; // For FIFO
} Frame;

int refs[] = {1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5};
int n_refs = 12;

void print_frames(Frame frames[], int n, int time) {
    printf("  [");
    for (int i = 0; i < n; i++) {
        if (frames[i].page == -1) printf(" - ");
        else printf(" %d(R=%d,D=%d) ", frames[i].page, frames[i].ref_bit, frames[i].dirty_bit);
    }
    printf("]\n");
}

/* FIFO */
int fifo(int frames_count) {
    Frame frames[MAX_FRAMES];
    for (int i = 0; i < frames_count; i++) frames[i].page = -1;
    
    int victim = 0;
    int faults = 0;
    int time = 0;
    
    printf("\n=== FIFO (%d frames) ===\n", frames_count);
    
    for (int i = 0; i < n_refs; i++) {
        int page = refs[i];
        bool hit = false;
        
        for (int j = 0; j < frames_count; j++) {
            if (frames[j].page == page) { hit = true; break; }
        }
        
        if (!hit) {
            faults++;
            frames[victim].page = page;
            frames[victim].loaded_time = time++;
            victim = (victim + 1) % frames_count;
            printf("Ref %d: Fault  ", page);
        } else {
            printf("Ref %d: Hit    ", page);
        }
        print_frames(frames, frames_count, time);
    }
    printf("Total faults: %d\n", faults);
    return faults;
}

/* OPT - Optimal */
int opt(int frames_count) {
    Frame frames[MAX_FRAMES];
    for (int i = 0; i < frames_count; i++) frames[i].page = -1;
    
    int faults = 0;
    
    printf("\n=== OPTIMAL (%d frames) ===\n", frames_count);
    
    for (int i = 0; i < n_refs; i++) {
        int page = refs[i];
        bool hit = false;
        
        for (int j = 0; j < frames_count; j++) {
            if (frames[j].page == page) { hit = true; break; }
        }
        
        if (!hit) {
            faults++;
            // Find free frame
            int free_idx = -1;
            for (int j = 0; j < frames_count; j++) {
                if (frames[j].page == -1) { free_idx = j; break; }
            }
            
            if (free_idx != -1) {
                frames[free_idx].page = page;
            } else {
                // Find page used farthest in future
                int victim = -1;
                int farthest = -1;
                
                for (int j = 0; j < frames_count; j++) {
                    int next_use = INT_MAX;
                    for (int k = i + 1; k < n_refs; k++) {
                        if (refs[k] == frames[j].page) {
                            next_use = k;
                            break;
                        }
                    }
                    if (next_use > farthest) {
                        farthest = next_use;
                        victim = j;
                    }
                }
                frames[victim].page = page;
            }
            printf("Ref %d: Fault  ", page);
        } else {
            printf("Ref %d: Hit    ", page);
        }
        print_frames(frames, frames_count, i);
    }
    printf("Total faults: %d\n", faults);
    return faults;
}

/* LRU */
int lru(int frames_count) {
    Frame frames[MAX_FRAMES];
    for (int i = 0; i < frames_count; i++) frames[i].page = -1;
    
    int faults = 0;
    int time = 0;
    
    printf("\n=== LRU (%d frames) ===\n", frames_count);
    
    for (int i = 0; i < n_refs; i++) {
        int page = refs[i];
        bool hit = false;
        int hit_idx = -1;
        
        for (int j = 0; j < frames_count; j++) {
            if (frames[j].page == page) { hit = true; hit_idx = j; break; }
        }
        
        if (!hit) {
            faults++;
            // Find free frame
            int free_idx = -1;
            for (int j = 0; j < frames_count; j++) {
                if (frames[j].page == -1) { free_idx = j; break; }
            }
            
            if (free_idx != -1) {
                frames[free_idx].page = page;
                frames[free_idx].timestamp = time++;
            } else {
                // Find LRU (oldest timestamp)
                int victim = 0;
                int oldest = frames[0].timestamp;
                for (int j = 1; j < frames_count; j++) {
                    if (frames[j].timestamp < oldest) {
                        oldest = frames[j].timestamp;
                        victim = j;
                    }
                }
                frames[victim].page = page;
                frames[victim].timestamp = time++;
            }
            printf("Ref %d: Fault  ", page);
        } else {
            frames[hit_idx].timestamp = time++;
            printf("Ref %d: Hit    ", page);
        }
        print_frames(frames, frames_count, time);
    }
    printf("Total faults: %d\n", faults);
    return faults;
}

/* Clock (Second-Chance) */
int clock_algo(int frames_count) {
    Frame frames[MAX_FRAMES];
    for (int i = 0; i < frames_count; i++) {
        frames[i].page = -1;
        frames[i].ref_bit = 0;
    }
    
    int faults = 0;
    int hand = 0;
    
    printf("\n=== CLOCK (%d frames) ===\n", frames_count);
    
    for (int i = 0; i < n_refs; i++) {
        int page = refs[i];
        bool hit = false;
        int hit_idx = -1;
        
        for (int j = 0; j < frames_count; j++) {
            if (frames[j].page == page) { hit = true; hit_idx = j; break; }
        }
        
        if (!hit) {
            faults++;
            // Find free frame
            int free_idx = -1;
            for (int j = 0; j < frames_count; j++) {
                if (frames[j].page == -1) { free_idx = j; break; }
            }
            
            if (free_idx != -1) {
                frames[free_idx].page = page;
                frames[free_idx].ref_bit = 1;
            } else {
                // Clock sweep
                while (true) {
                    if (frames[hand].ref_bit == 0) {
                        // Victim found
                        frames[hand].page = page;
                        frames[hand].ref_bit = 1;
                        hand = (hand + 1) % frames_count;
                        break;
                    } else {
                        // Second chance
                        frames[hand].ref_bit = 0;
                        hand = (hand + 1) % frames_count;
                    }
                }
            }
            printf("Ref %d: Fault  ", page);
        } else {
            frames[hit_idx].ref_bit = 1;
            printf("Ref %d: Hit    ", page);
        }
        print_frames(frames, frames_count, i);
    }
    printf("Total faults: %d\n", faults);
    return faults;
}

/* Enhanced Clock */
int enhanced_clock(int frames_count) {
    Frame frames[MAX_FRAMES];
    for (int i = 0; i < frames_count; i++) {
        frames[i].page = -1;
        frames[i].ref_bit = 0;
        frames[i].dirty_bit = 0;
    }
    
    int faults = 0;
    int hand = 0;
    
    printf("\n=== ENHANCED CLOCK (%d frames) ===\n", frames_count);
    
    for (int i = 0; i < n_refs; i++) {
        int page = refs[i];
        bool hit = false;
        int hit_idx = -1;
        
        for (int j = 0; j < frames_count; j++) {
            if (frames[j].page == page) { hit = true; hit_idx = j; break; }
        }
        
        if (!hit) {
            faults++;
            // Find free frame
            int free_idx = -1;
            for (int j = 0; j < frames_count; j++) {
                if (frames[j].page == -1) { free_idx = j; break; }
            }
            
            if (free_idx != -1) {
                frames[free_idx].page = page;
                frames[free_idx].ref_bit = 1;
                frames[free_idx].dirty_bit = 0;
            } else {
                // Enhanced clock: 4 passes
                for (int pass = 0; pass < 4; pass++) {
                    int start_hand = hand;
                    bool found = false;
                    
                    do {
                        int r = frames[hand].ref_bit;
                        int d = frames[hand].dirty_bit;
                        
                        // Priority: (0,0) > (0,1) > (1,0) > (1,1)
                        bool match = false;
                        if (pass == 0 && r == 0 && d == 0) match = true;
                        else if (pass == 1 && r == 0 && d == 1) match = true;
                        else if (pass == 2 && r == 1 && d == 0) match = true;
                        else if (pass == 3 && r == 1 && d == 1) match = true;
                        
                        if (match) {
                            frames[hand].page = page;
                            frames[hand].ref_bit = 1;
                            frames[hand].dirty_bit = 0;
                            hand = (hand + 1) % frames_count;
                            found = true;
                            break;
                        } else {
                            // Clear ref bit, advance
                            frames[hand].ref_bit = 0;
                            hand = (hand + 1) % frames_count;
                        }
                    } while (hand != start_hand);
                    
                    if (found) break;
                }
            }
            printf("Ref %d: Fault  ", page);
        } else {
            frames[hit_idx].ref_bit = 1;
            frames[hit_idx].dirty_bit = 1;  // Simulate write
            printf("Ref %d: Hit    ", page);
        }
        print_frames(frames, frames_count, i);
    }
    printf("Total faults: %d\n", faults);
    return faults;
}

int main() {
    // Test with 3 frames and 4 frames to show Belady's Anomaly
    printf("Reference String: ");
    for (int i = 0; i < n_refs; i++) printf("%d ", refs[i]);
    printf("\n");
    
    // 3 frames
    fifo(3);
    opt(3);
    lru(3);
    clock_algo(3);
    enhanced_clock(3);
    
    printf("\n\n=== BELADY'S ANOMALY DEMO ===\n");
    printf("FIFO 3 frames: ");
    fifo(3);
    printf("FIFO 4 frames: ");
    fifo(4);
    printf("LRU 3 frames:  ");
    lru(3);
    printf("LRU 4 frames:  ");
    lru(4);
    printf("OPT 3 frames:  ");
    opt(3);
    printf("OPT 4 frames:  ");
    opt(4);
    
    return 0;
}
```

**Output shows:**
```
FIFO 3 frames: 9 faults
FIFO 4 frames: 10 faults  ← BELADY'S ANOMALY!
LRU 3 frames:  10 faults
LRU 4 frames:  8 faults   ← No anomaly!
OPT 3 frames:  7 faults
OPT 4 frames:  6 faults   ← No anomaly!
```

---

## 21.8 Frame Allocation

### Strategies

| Strategy | Formula | Example: 62 frames, P1(10 pages), P2(127 pages) |
|----------|---------|--------------------------------------------------|
| **Equal** | `frames / processes` | 31 each |
| **Proportional** | `(size_i / total_size) × total_frames` | P1: (10/137)×62 ≈ **4.5 frames** |
| **Priority** | Higher priority → more frames | Depends on priority |
| **Working Set** | Pages used in last Δ time | Dynamic |

### Working Set Model
- **Locality of Reference**: Programs access localized page clusters
- **Working Set Window (Δ)**: Pages referenced in last Δ time units
- **Keep working set in memory** → prevent thrashing

---

## 21.9 Thrashing

### Definition
High paging activity where CPU spends more time swapping than executing.

### Cause
```
Sum of working-set sizes > Total Physical Memory
Σ WSSᵢ > D
```

### Detection
- CPU utilization drops while disk I/O high
- Page fault rate spikes

### Solutions
1. **Working Set Model** — keep working set in memory
2. **Page Fault Frequency (PFF)** — dynamic frame allocation based on fault rate

### PFF Strategy
- Establish **upper and lower page fault rate bounds**
- If process rate > upper bound → grant more frames
- If process rate < lower bound → revoke frames

---

## 21.10 Global vs Local Replacement

| Policy | Behavior | Risk |
|--------|----------|------|
| **Global** | Victim from any process | One bad process steals frames → system-wide thrashing |
| **Local** | Victim from faulting process only | Isolates thrashing to one process |

---

## 21.11 Exam-Focused MCQ Patterns

| Question | Answer |
|----------|--------|
| **Belady's Anomaly string** | `1,2,3,4,1,2,5,1,2,3,4,5` → 3 frames=9, 4 frames=10 |
| **Stack algorithm definition** | n-frame set ⊂ (n+1)-frame set |
| **LRU/OPT immune to Belady's** | Yes, they are stack algorithms |
| **Clock algorithm** | ref=1→set 0, advance; ref=0→replace |
| **Enhanced Clock priority** | (0,0) > (0,1) > (1,0) > (1,1) |
| **Proportional allocation** | (size/S) × total_frames |
| **Global replacement risk** | One process steals frames → thrashing |
| **Thrashing cause** | Σ WSSᵢ > D |
| **Working Set principle** | Locality of Reference |
| **PFF strategy** | Upper/lower fault rate bounds → grant/revoke frames |

---

## 21.12 Practice Problems

### Problem 1: FIFO Trace
```
Ref: 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1
Frames: 3
```
Trace FIFO. How many faults?

### Problem 2: Optimal Trace
```
Ref: 1,2,3,4,1,2,5,1,2,3,4,5
Frames: 3
```
Trace OPT step by step.

### Problem 3: Clock Algorithm
```
Ref: 1,2,3,4,1,2,5,1,2,3,4,5
Frames: 3
```
Trace Clock. Show reference bit changes.

### Problem 4: Belady's Anomaly
Prove FIFO has Belady's Anomaly for string: `1,2,3,4,1,2,5,1,2,3,4,5`

### Problem 5: Frame Allocation
```
Total frames: 64
P1: 16 pages
P2: 48 pages
P3: 32 pages
```
Equal allocation? Proportional allocation?

### Problem 6: Thrashing Detection
```
System: 100 frames
Process working sets: WSS1=40, WSS2=35, WSS3=30
```
Is system thrashing? What to do?

---

*Next: Topic 20 (Virtual Memory) with demand paging, page faults, COW, TLB/EAT*