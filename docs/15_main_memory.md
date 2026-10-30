# Topic 15: Main Memory — Hardware, Address Translation, Dynamic Loading/Linking, mmap

**Source**: Lecture 3.1 (Unit 3) + Textbook Ch. 8 (Silberschatz Ch. 8, Stallings Ch. 7)

---

## 15.1 Address Translation

### Logical vs Physical Address
```
Logical Address (CPU) → MMU → Physical Address (Memory)
```

### Hardware Support
- **Base/Limit Registers**: Simple relocation + protection
  - Base = starting physical address
  - Limit = range/size of logical address space
  - Legal: `0 ≤ Logical Address < Limit`
  - Physical = `Base + Logical Address`
  - If `Logical ≥ Limit` → **Hardware Trap** (Addressing/Segmentation fault)

- **Memory Management Unit (MMU)**: Hardware for translation
- **Page Table Base Register (PTBR)**: Points to current process page table

---

## 15.2 OS Support

### Memory Allocation Strategies
| Strategy | Description |
|----------|-------------|
| **First Fit** | Allocate first hole that is big enough (fastest) |
| **Best Fit** | Allocate smallest hole that is big enough (leaves smallest leftover) |
| **Worst Fit** | Allocate largest hole (leaves largest leftover; worst utilization) |

### Memory Protection
- Valid/invalid bits in page tables
- Read/Write/Execute permission bits

### Shared Pages
- Code sharing between processes
- Copy-on-write (COW) for fork()

---

## 15.3 Dynamic Loading & Linking

### Dynamic Loading
- Load routine **only when called** (not at startup)
- Reduces memory footprint, faster startup

### Dynamic Linking
- Linking **postponed until execution** (shared libraries)
- Single library copy in memory shared by multiple processes
- **Shared Libraries**: `.so` files on Linux, `.dll` on Windows

---

## 15.4 Memory-Mapped Files (`mmap()`)

```c
#include <sys/mman.h>

void *mmap(void *addr, size_t len, int prot, int flags, int fd, off_t offset);
// Map file into memory — treats file I/O as memory access

munmap(void *addr, size_t len);  // Unmap
```

### Parameters
| Parameter | Description |
|-----------|-------------|
| `addr` | Hint address (NULL = let kernel choose) |
| `len` | Length of mapping |
| `prot` | Protection: `PROT_READ`, `PROT_WRITE`, `PROT_EXEC`, `PROT_NONE` |
| `flags` | `MAP_SHARED` (changes visible to others, written to file) / `MAP_PRIVATE` (COW, changes not written to file) |
| `fd` | File descriptor from `open()` |
| `offset` | Offset into file (page-aligned) |

### Use Cases
- Fast file I/O (memory access instead of read/write syscalls)
- Shared memory between processes (`MAP_SHARED` + `MAP_ANONYMOUS`)
- Loading executables (dynamic linker uses mmap)
- Large data files (databases, video)

---

## 15.5 Key Takeaways

1. **Base/Limit** = simple relocation + protection
2. **MMU** = hardware translation unit
3. **Dynamic Loading** = load on demand
4. **Dynamic Linking** = shared libraries at runtime
5. **mmap()** = file I/O as memory access; `MAP_SHARED` vs `MAP_PRIVATE`
6. **First/Best/Worst Fit** = contiguous allocation strategies

---

## 15.6 Exam-Relevant MCQ Patterns

- Covered in Unit 3 MCQs (Q71-Q100)