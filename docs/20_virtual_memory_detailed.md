# Topic 20 (Detailed): Virtual Memory — Demand Paging, Page Faults, Copy-on-Write

**Source**: Lecture 3.6 (Unit 3) + Textbook Ch. 9 (Silberschatz Ch. 9, Stallings Ch. 8)

---

## 20.1 Demand Paging — Core Philosophy

### Traditional vs Demand Paging

| Traditional Paging | Demand Paging |
|--------------------|---------------|
| Load entire process at startup | Load pages **only when referenced** |
| All pages in memory | Only active pages in memory |
| Fast startup, high memory | Slow startup (first access), low memory |
| Simple implementation | Complex (page fault handling) |

### Valid/Invalid Bit in PTE

```
Page Table Entry:
┌─────────────────────────────────────────┐
│ Frame #  | Valid | Prot | Ref | Dirty |  │
│    5     |   1   | RWX  |  1  |   0   |  │
└─────────────────────────────────────────┘

Valid = 1 → Page in physical memory
Valid = 0 → Page on disk OR not allocated
```

### Lazy Loading Benefits

1. **Faster startup** — Don't load unused code
2. **Less memory** — Only working set in RAM
3. **More processes** — Higher degree of multiprogramming
4. **Large programs** — Can run programs larger than physical RAM

---

## 20.2 Page Fault Handling — Complete Flow

```
CPU executes instruction
        │
        ▼
MMU translates virtual address
        │
        ├──── Valid = 1 ────► Access memory (fast path)
        │
        └──── Valid = 0 ────► PAGE FAULT TRAP
                              │
                              ▼
                     OS Page Fault Handler
                              │
                              ▼
                 ┌─────────────────────────────┐
                 │ 1. Check if valid access:   │
                 │    - Within VMA?            │
                 │    - Correct permissions?   │
                 │    - Stack growth?          │
                 └─────────────────────────────┘
                              │
                              ▼ (if invalid → SIGSEGV)
                 ┌─────────────────────────────┐
                 │ 2. Find free frame:         │
                 │    - Free list?             │
                 │    - Page replacement?      │
                 └─────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────────┐
                 │ 3. If victim dirty:         │
                 │    - Write to swap          │
                 │    - Wait for I/O           │
                 └─────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────────┐
                 │ 4. Read requested page:     │
                 │    - From executable?       │
                 │    - From swap?             │
                 │    - Zero-filled?           │
                 └─────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────────┐
                 │ 5. Update PTE:              │
                 │    - Frame #                │
                 │    - Valid = 1              │
                 │    - Ref = 1, Dirty = 0     │
                 └─────────────────────────────┘
                              │
                              ▼
                    Restart faulting instruction
```

---

## 20.3 Minor vs Major Page Faults

| Aspect | Minor Page Fault | Major Page Fault |
|--------|------------------|------------------|
| **Definition** | Page in RAM but PTE invalid | Page must be read from disk |
| **Causes** | COW, shared library, free list, zero page | First access, swapped out |
| **Disk I/O** | **None** | **Required** |
| **Latency** | Microseconds | Milliseconds |
| **Example** | fork() COW, shared library text | First page access, swapped out |

```
Minor Fault Flow:
Page Fault → PTE invalid but page in RAM → Update PTE → Restart

Major Fault Flow:
Page Fault → Page on disk → Disk I/O → Update PTE → Restart
```

---

## 20.4 Copy-on-Write (COW) — Complete Mechanism

### Why COW?

```
Traditional fork():
- Copy ALL pages → Slow, memory-hungry
- Child often exec()s immediately → Waste!

fork() with COW:
- Share pages read-only → Fast, memory-efficient
- On write → Copy only that page
- Child exec()s → No copies needed!
```

### COW Mechanism

```
BEFORE fork():
Parent: Page A (RW) ─┐
                     ├──→ Physical Page A
Parent: Page B (RW) ─┘

AFTER fork() with COW:
Parent: Page A (RO) ─┐
                     ├──→ Physical Page A (shared, ref count=2)
Parent: Page B (RO) ─┘
Child:  Page A (RO) ─┘
Child:  Page B (RO) ─┘

WHEN CHILD WRITES to Page A:
1. Page Fault (protection violation)
2. OS allocates new physical page A'
3. Copies content from A to A'
4. Updates child's PTE: Frame=A', RW, Valid=1
5. Decrements ref count of A
6. Restarts instruction

AFTER COW:
Parent: Page A (RW) → Physical Page A
Child:  Page A (RW) → Physical Page A'
```

### COW Implementation Details

```c
// Simplified kernel COW logic
void handle_cow_fault(vaddr_t vaddr) {
    pte_t *pte = get_pte(current->mm, vaddr);
    
    if (!pte_present(pte)) {
        // Major fault - handle normally
        do_page_fault(vaddr);
        return;
    }
    
    // Check if COW page
    if (pte_cow(pte)) {
        // Allocate new page
        page_t *new_page = alloc_page();
        if (!new_page) OOM();
        
        // Copy content
        copy_page(new_page, pte_page(pte));
        
        // Update PTE
        pte_clear_cow(pte);
        pte_set_page(pte, new_page);
        pte_set_writable(pte);
        pte_set_dirty(pte);
        
        // Decrement ref count of old page
        dec_page_ref(pte_page(pte));
        
        // Flush TLB
        flush_tlb(vaddr);
        
        return; // Restart instruction
    }
    
    // Not COW - regular protection fault
    do_sigsegv(vaddr);
}
```

### COW Example: fork() + exec()

```c
// Parent
pid = fork();

if (pid == 0) {
    // Child
    // All pages shared COW
    // If child calls exec():
    //   - New address space created
    //   - Old COW pages discarded
    //   - NO copies made!
    execl("/bin/ls", "ls", NULL);
} else {
    // Parent continues
    wait(NULL);
}
```

**Without COW**: fork() copies all pages → exec() throws them away → HUGE waste!
**With COW**: fork() shares pages → exec() discards references → ZERO waste!

---

## 20.5 Dirty Bit (Modify Bit)

### Purpose

| Value | Meaning | Action on Replacement |
|-------|---------|----------------------|
| **0 (Clean)** | Page not modified | Overwrite immediately (no disk write) |
| **1 (Dirty)** | Page modified | **Must write back to disk first** |

### Impact on Page Fault Time

```
Clean page replacement:
1. Select victim
2. Overwrite frame with new page
3. Update PTE
Time: ~100ns (memory only)

Dirty page replacement:
1. Select victim
2. Write victim to swap (disk I/O)
3. Wait for I/O completion
4. Overwrite frame with new page
5. Update PTE
Time: ~10ms (100,000x slower!)
```

### Write-Back Strategies

| Strategy | Description |
|----------|-------------|
| **Write-back on evict** | Write dirty page when replaced (standard) |
| **Periodic write-back** | Background daemon writes dirty pages periodically |
| **Write-through** | Write to disk on every store (slow, for critical data) |

---

## 20.6 Complete Demand Paging Simulator

```c
/*
 * File: demand_paging.c
 * Simulates demand paging with page fault handling
 * Compile: gcc -o demand_paging demand_paging.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define PAGE_SIZE 4096
#define VIRTUAL_PAGES 64
#define PHYSICAL_FRAMES 16
#define SWAP_SLOTS 64

typedef enum { INVALID, IN_MEMORY, ON_DISK } page_state_t;

typedef struct {
    int frame;          // Physical frame # (if IN_MEMORY)
    int disk_block;     // Swap slot (if ON_DISK)
    page_state_t state;
    int ref_bit;        // Reference bit
    int dirty_bit;      // Dirty bit
    int prot;           // Protection bits
    int last_access;    // For LRU
} PTE;

typedef struct {
    int pid;
    int page;
    int frame;
    int dirty;
} FrameInfo;

PTE page_table[VIRTUAL_PAGES];
FrameInfo frames[PHYSICAL_FRAMES];
int free_frames[PHYSICAL_FRAMES];
int free_count;
int swap_map[SWAP_SLOTS];  // Which (pid, page) in each swap slot
int time_counter = 0;

void init_system() {
    for (int i = 0; i < VIRTUAL_PAGES; i++) {
        page_table[i].state = INVALID;
        page_table[i].frame = -1;
        page_table[i].disk_block = -1;
        page_table[i].ref_bit = 0;
        page_table[i].dirty_bit = 0;
        page_table[i].prot = 0x7; // RWX
    }
    
    for (int i = 0; i < PHYSICAL_FRAMES; i++) {
        frames[i].pid = -1;
        frames[i].page = -1;
        frames[i].frame = i;
        frames[i].dirty = 0;
        free_frames[i] = i;
    }
    free_count = PHYSICAL_FRAMES;
    
    for (int i = 0; i < SWAP_SLOTS; i++) {
        swap_map[i] = -1;
    }
}

int allocate_frame() {
    if (free_count > 0) {
        return free_frames[--free_count];
    }
    return -1; // Need page replacement
}

int allocate_swap_slot() {
    for (int i = 0; i < SWAP_SLOTS; i++) {
        if (swap_map[i] == -1) {
            swap_map[i] = 1; // Mark occupied
            return i;
        }
    }
    return -1; // Swap full
}

void free_swap_slot(int slot) {
    if (slot >= 0 && slot < SWAP_SLOTS) {
        swap_map[slot] = -1;
    }
}

void simulate_disk_write(int frame) {
    // Simulate disk I/O latency
    printf("    [DISK WRITE] Frame %d to swap\n", frame);
}

void simulate_disk_read(int swap_slot, int frame) {
    // Simulate disk I/O latency
    printf("    [DISK READ] Swap slot %d to frame %d\n", swap_slot, frame);
}

int select_victim_lru() {
    int oldest = -1;
    int victim = -1;
    for (int i = 0; i < PHYSICAL_FRAMES; i++) {
        if (frames[i].pid != -1) {
            // In real system, would check page_table[pid][page].last_access
            // Simplified: pick first dirty frame, else first frame
        }
    }
    // Simplified: return first frame (FIFO-like)
    for (int i = 0; i < PHYSICAL_FRAMES; i++) {
        if (frames[i].pid != -1) return i;
    }
    return 0;
}

void handle_page_fault(int pid, int vpage, int is_write) {
    printf("\n[PAGE FAULT] PID=%d, Virtual Page=%d, Write=%d\n", pid, vpage, is_write);
    time_counter++;
    
    PTE *pte = &page_table[vpage];
    
    // Check if valid access (simplified)
    if (pte->state == INVALID) {
        // First access - allocate zero-filled page
        printf("  First access to page %d\n", vpage);
        
        int frame = allocate_frame();
        if (frame == -1) {
            // Need page replacement
            int victim = select_victim_lru();
            FrameInfo *victim_info = &frames[victim];
            
            if (victim_info->dirty) {
                // Write to swap
                int swap_slot = allocate_swap_slot();
                simulate_disk_write(victim_info->frame);
                victim_info->dirty = 0;
                
                // Update victim's PTE
                // In real system, would find victim's PTE and update
            }
            
            // Use victim's frame
            frames[victim].pid = pid;
            frames[victim].page = vpage;
            frames[victim].dirty = is_write;
            
            pte->frame = victim;
            pte->state = IN_MEMORY;
            pte->ref_bit = 1;
            pte->dirty_bit = is_write;
            
            printf("  Replaced frame %d, loaded page %d\n", victim, vpage);
        } else {
            // Zero-filled page
            frames[frame].pid = pid;
            frames[frame].page = vpage;
            frames[frame].dirty = is_write;
            
            pte->frame = frame;
            pte->state = IN_MEMORY;
            pte->ref_bit = 1;
            pte->dirty_bit = is_write;
            
            printf("  Allocated new frame %d for page %d\n", frame, vpage);
        }
    } else if (pte->state == ON_DISK) {
        // Major page fault - read from swap
        printf("  Major fault: Page on disk\n");
        
        int frame = allocate_frame();
        if (frame == -1) {
            // Page replacement needed (same as above)
            int victim = select_victim_lru();
            frames[victim].pid = pid;
            frames[victim].page = vpage;
            frames[victim].dirty = is_write;
            pte->frame = victim;
            pte->state = IN_MEMORY;
            pte->ref_bit = 1;
            pte->dirty_bit = is_write;
            simulate_disk_read(pte->disk_block, victim);
        } else {
            frames[frame].pid = pid;
            frames[frame].page = vpage;
            frames[frame].dirty = is_write;
            pte->frame = frame;
            pte->state = IN_MEMORY;
            pte->ref_bit = 1;
            pte->dirty_bit = is_write;
            simulate_disk_read(pte->disk_block, frame);
        }
    }
    
    // Clear disk block since now in memory
    pte->disk_block = -1;
}

void access_memory(int pid, int vpage, int is_write) {
    if (vpage < 0 || vpage >= VIRTUAL_PAGES) {
        printf("Invalid page %d\n", vpage);
        return;
    }
    
    PTE *pte = &page_table[vpage];
    
    if (pte->state == IN_MEMORY && pte->frame >= 0) {
        // HIT
        if (is_write) {
            page_table[vpage].dirty_bit = 1;
            frames[pte->frame].dirty = 1;
        }
        page_table[vpage].ref_bit = 1;
        page_table[vpage].last_access = time_counter++;
        printf("Hit: PID=%d, Page=%d, Frame=%d, Write=%d\n", 
               pid, vpage, pte->frame, is_write);
    } else {
        // PAGE FAULT
        handle_page_fault(pid, vpage, is_write);
    }
}

void print_stats() {
    int in_mem = 0, on_disk = 0, invalid = 0;
    int dirty = 0;
    
    for (int i = 0; i < VIRTUAL_PAGES; i++) {
        switch (page_table[i].state) {
            case IN_MEMORY: in_mem++; if (page_table[i].dirty_bit) dirty++; break;
            case ON_DISK: on_disk++; break;
            case INVALID: invalid++; break;
        }
    }
    
    printf("\n=== Memory Stats ===\n");
    printf("In memory: %d, On disk: %d, Invalid: %d\n", in_mem, on_disk, invalid);
    printf("Dirty pages: %d\n", dirty);
    printf("Free frames: %d\n", free_count);
}

int main() {
    init_system();
    
    // Simulate process accessing memory
    printf("=== Demand Paging Simulation ===\n");
    
    // Process 0 accesses pages 0,1,2,3 (first time)
    for (int i = 0; i < 4; i++) {
        access_memory(0, i, 0); // Read
    }
    
    // Process 0 writes to page 1
    access_memory(0, 1, 1);
    
    // Process 0 accesses page 0 again (hit)
    access_memory(0, 0, 0);
    
    // Fill up memory
    for (int i = 4; i < 20; i++) {
        access_memory(0, i, 0);
    }
    
    print_stats();
    
    return 0;
}
```

---

## 20.7 Virtual Memory Address Translation

### 32-bit, 4KB Pages

```
Virtual Address (32 bits):
┌──────────────────────────────────────┐
│  Page Number (20 bits) | Offset (12) │
└──────────────────────────────────────┘

Offset bits = log2(page_size) = log2(4096) = 12
Page Number bits = 32 - 12 = 20
```

### Multi-Level Page Tables

```
2-Level (32-bit, 4KB):
Virtual:  p1(10) | p2(10) | d(12)
                 │      │     │
                 ▼      ▼     ▼
            Page Dir  Page Table  Frame

Page Directory (1024 entries) → 1024 Page Tables (each 1024 entries)
Only allocate page tables for used regions!
```

### Page Table Size Calculation

```
32-bit, 4KB pages, 4-byte PTE:
Entries = 2^20 = 1,048,576
Size = 2^20 × 4 bytes = 4 MB per process
```

---

## 20.8 TLB (Translation Lookaside Buffer)

### Purpose
Hardware cache for page table entries.

### TLB Hit/Miss

```
TLB Hit:  VPN → TLB → PPN → Physical Address (fast)
TLB Miss: VPN → TLB (miss) → Page Table Walk → PPN → Update TLB → Physical Address
```

### Effective Access Time (EAT)

```
EAT = α × (t_TLB + t_RAM) + (1-α) × (t_TLB + k × t_RAM)

Where:
α = TLB hit ratio
t_TLB = TLB lookup time
t_RAM = Main memory access time
k = page table levels + 1 (data access)
```

### Example Calculation

```
Given:
TLB hit ratio (α) = 80% = 0.80
TLB access time = 20 ns
Memory access time = 100 ns
Single-level paging (k=2 on miss)

EAT = 0.80 × (20 + 100) + 0.20 × (20 + 2×100)
    = 0.80 × 120 + 0.20 × 220
    = 96 + 44 = 140 ns
```

### Two-Level Paging EAT

```
Without TLB: 3 memory accesses (outer table + inner table + data)
With TLB miss on 2-level: TLB + 3×RAM

EAT = α(t_TLB + t_RAM) + (1-α)(t_TLB + 3×t_RAM)
```

---

## 20.9 Inverted Page Table

### Motivation
64-bit address space → 2^52 pages → traditional page table impossibly large!

### Structure
- **One entry per PHYSICAL FRAME** (not per virtual page)
- Size scales with **physical RAM**, not virtual space

### Entry Format
```
struct inverted_pte {
    int pid;        // Owning process
    int vpn;        // Virtual page number
    int frame;      // Physical frame
    // ... protection, ref, dirty bits
};
```

### Lookup
```
hash(pid, vpn) → bucket → linear search for (pid, vpn) match
```

### Trade-offs

| Pros | Cons |
|------|------|
| Scales with RAM (not virtual space) | Hash lookup slower than array index |
| One table for all processes | Collisions → chain traversal |
| Saves massive memory for 64-bit | Need separate per-process page table for TLB shootdowns |

---

## 20.10 Memory-Mapped Files (mmap)

### System Call
```c
#include <sys/mman.h>

void *mmap(void *addr, size_t len, int prot, int flags, int fd, off_t offset);
munmap(void *addr, size_t len);
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `addr` | Hint address (NULL = kernel chooses) |
| `len` | Length of mapping |
| `prot` | PROT_READ, PROT_WRITE, PROT_EXEC, PROT_NONE |
| `flags` | MAP_SHARED (changes to file), MAP_PRIVATE (COW), MAP_ANONYMOUS |
| `fd` | File descriptor from open() |
| `offset` | Offset into file (page-aligned) |

### MAP_SHARED vs MAP_PRIVATE

| MAP_SHARED | MAP_PRIVATE |
|------------|-------------|
| Changes written to file | Changes NOT written to file (COW) |
| Visible to other processes | Private to this process |
| Used for IPC, databases | Used for copy-on-write |

### Example: Fast File I/O
```c
int fd = open("large_file.dat", O_RDWR);
void *map = mmap(NULL, file_size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

// Access file as memory
int *data = (int*)map;
data[1000] = 42;  // Directly modifies file!

munmap(map, file_size);
close(fd);
```

---

## 20.11 Complete Exam-Focused Summary

| Concept | Key Points |
|---------|------------|
| **Demand Paging** | Load pages on reference (lazy loading) |
| **Page Fault** | Trap → check validity → find frame → read from disk → update PTE → restart |
| **Minor Fault** | Resolves in RAM (COW, shared lib); **Major Fault** = disk I/O |
| **COW** | fork() shares pages read-only; write triggers private copy |
| **Dirty Bit** | If 0, no write-back needed on replacement |
| **Page Table** | Maps VPN → PPN; PTE has Valid, Prot, Ref, Dirty |
| **Multi-level** | Reduces memory; 2-level = 3 memory accesses without TLB |
| **Inverted** | One entry per physical frame; scales with RAM |
| **TLB** | Hardware associative cache for translations |
| **EAT** | α(t_TLB + t_RAM) + (1-α)(t_TLB + k×t_RAM) |
| **mmap()** | File I/O as memory access; MAP_SHARED vs MAP_PRIVATE |

---

## 20.12 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Demand paging** | Load pages on reference (lazy loading) |
| **Page fault first event** | MMU generates trap to OS |
| **COW fork** | Protection violation trap → OS copies page → restarts instruction |
| **Minor vs Major fault** | Minor = no disk I/O; Major = disk read |
| **Dirty bit = 0** | No write-back needed on replacement |
| **32-bit, 4KB** | p=20 bits, d=12 bits; page table = 4 MB |
| **2-level paging (no TLB)** | 3 memory accesses |
| **TLB hit ratio 80%** | EAT = 140 ns (with t_TLB=20, t_RAM=100) |
| **Inverted page table** | One entry per physical frame |

---

## 20.13 Practice Problems

### Problem 1: Page Fault Trace
```
Process accesses pages: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5
Frames: 3
Page replacement: LRU
```
Trace page faults. Which are major vs minor?

### Problem 2: COW Scenario
```
Parent forks child.
Child writes to page 5.
Parent reads page 5.
```
Trace COW mechanism. How many physical pages for page 5?

### Problem 3: EAT Calculation
```
TLB hit ratio = 90%
t_TLB = 10 ns
t_RAM = 100 ns
2-level paging
```
Calculate EAT.

### Problem 4: Page Table Size
```
64-bit system, 4KB pages, 8-byte PTE
```
Size of single-level page table? Why inverted table needed?

### Problem 5: mmap() Usage
```
Process mmaps a 1GB file with MAP_PRIVATE.
Writes to offset 100MB.
```
What happens? Is file modified?

---

*Next: Topic 22 (NUMA, Memory Locality & Enhanced Clock Replacement)*