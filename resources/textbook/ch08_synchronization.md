# Chapter 8: Process Synchronization (Part 1)

**Textbook References**: [Silberschatz 10e, Ch. 5, 6] • [Stallings 9e, Ch. 5, 6] • [Stevens & Rago 3e, Ch. 10, 11]

---

## 8.1 The Concurrency Problem [Silberschatz 10e, §6.1]

### Race Condition [Silberschatz 10e, §6.1.1]
```c
// counter++ compiles to 3 instructions:
register = counter;    // LOAD
register = register + 1;  // INC
counter = register;    // STORE

// Interleaving (counter starts at 5):
Thread A: LOAD 5          counter=5
Thread A: INC 6
Thread B: LOAD 5          ← PREEMPTION! counter still 5
Thread B: INC 4
Thread B: STORE 4         counter=4
Thread A: STORE 6         counter=6  ← LOST UPDATE! Should be 5.
```

**Race Condition**: Outcome depends on timing of execution — non-deterministic, hard to reproduce.

> **Silberschatz**: "A race condition occurs when multiple processes access and manipulate the same data concurrently, and the outcome of the execution depends on the particular order in which the access takes place." [Silberschatz 10e, §6.1.1]

### Kernel Example: PID Allocation [Silberschatz 10e, Fig. 6.1]
```
P0: fork() → read next_pid (2615)
P1: fork() → read next_pid (2615)  ← both get same PID!
Both write back 2616 → duplicate PIDs assigned
```

---

## 8.2 Critical Section Problem [Silberschatz 10e, §6.2]

### Requirements (ALL must hold) [Silberschatz 10e, §6.2.1]
| Requirement | Meaning |
|-------------|---------|
| **Mutual Exclusion** | Only one thread in CS at a time |
| **Progress** | If CS free, some waiting thread enters (no deadlock) |
| **Bounded Waiting** | No starvation — limit on how many times others can cut in line |

### Process Structure [Silberschatz 10e, §6.2.2]
```c
do {
    /* ENTRY SECTION */  // Request permission
    /* CRITICAL SECTION */  // Mutate shared data
    /* EXIT SECTION */   // Notify done
    /* REMAINDER SECTION */
} while (true);
```

---

## 8.3 Software Approaches (Why They Fail) [Silberschatz 10e, §6.3]

### Peterson's Algorithm (2 Processes) [Silberschatz 10e, §6.3.1]
```c
boolean flag[2] = {false, false};
int turn;

Process i:
flag[i] = true;
turn = j;
while (flag[j] && turn == j);  // spin
// CRITICAL SECTION
flag[i] = false;
```

**Assumption**: `load`/`store` atomic and execute in program order.

**Reality on modern CPUs**:
```
Compiler/CPU may reorder:
  turn = j;        →  moves BEFORE flag[i] = true
  flag[i] = true;

Or writes sit in store buffer (not visible to other cores yet)
```
**Result**: Both threads enter CS → mutual exclusion violated.

**Fix**: Memory barriers (`mfence`, `dmb`, `sync`) — but now architecture-specific.

> **Silberschatz**: "Peterson's algorithm is a classic software-based solution to the critical-section problem for two processes." [Silberschatz 10e, §6.3.1]

---

## 8.4 Hardware Atomic Instructions [Silberschatz 10e, §6.4]

Modern CPUs provide **indivisible** read-modify-write instructions.

### test_and_set (TSL) — x86 `XCHG`, ARM `LDREX/STREX` [Silberschatz 10e, §6.4.1]
```c
boolean test_and_set(boolean *target) {
    boolean rv = *target;  // atomic read
    *target = TRUE;        // atomic write
    return rv;             // return old value
}
```

### compare_and_swap (CAS) — x86 `CMPXCHG`, ARM `CAS` [Silberschatz 10e, §6.4.2]
```c
int compare_and_swap(int *addr, int expected, int new_val) {
    int old = *addr;
    if (*addr == expected) *addr = new_val;
    return old;  // all atomic
}
```

**Key**: Single bus cycle — no interleaving possible.

> **Silberschatz**: "Modern computer architectures provide special atomic hardware instructions." [Silberschatz 10e, §6.4]

---

## 8.5 Building Spinlocks from Atomics [Silberschatz 10e, §6.5]

### TSL Spinlock [Silberschatz 10e, §6.5.1]
```c
boolean lock = false;

while (test_and_set(&lock)) ;  // spin until we get false (lock was free)
// CRITICAL SECTION
lock = false;  // release
```

### CAS Spinlock [Silberschatz 10e, §6.5.2]
```c
int lock = 0;

while (compare_and_swap(&lock, 0, 1) != 0) ;  // spin until 0→1 succeeds
// CRITICAL SECTION
lock = 0;
```

### Evaluation [Silberschatz 10e, §6.5.3]
| Property | TSL Spinlock | CAS Spinlock |
|----------|--------------|--------------|
| Mutual Exclusion | ✅ | ✅ |
| Progress | ✅ | ✅ |
| **Bounded Waiting** | ❌ (starvation possible) | ❌ |

**Problem**: No queue — whoever wins the race gets the lock. A thread can starve forever.

---

## 8.6 Bounded-Waiting Spinlock [Silberschatz 10e, §6.6]

```c
boolean waiting[N] = {false};
boolean lock = false;

// Process i:
waiting[i] = true;
key = true;
while (waiting[i] && key) {
    key = test_and_set(&lock);  // try to get lock
}
waiting[i] = false;

// CRITICAL SECTION

// Hand off to next waiter (circular queue)
j = (i + 1) % N;
while (j != i && !waiting[j]) j = (j + 1) % n;

if (j == i) lock = false;       // nobody waiting
else waiting[j] = false;        // wake next waiter
```

**Guarantees bounded waiting**: Each waiter served in turn (max N-1 others before you).

> **Silberschatz**: "This algorithm satisfies all three critical-section requirements." [Silberschatz 10e, §6.6]

---

## 8.7 From Spinlocks to Blocking Mutexes [Silberschatz 10e, §6.7]

### Spinlock vs Mutex [Silberschatz 10e, §6.7.1]
| | Spinlock | Mutex (Blocking) |
|---|----------|------------------|
| **Wait behavior** | Busy loop (burns CPU) | `block()` → yield CPU, scheduler runs other thread |
| **Context switch** | None | Yes (costly) |
| **Best for** | Very short CS, multicore | Longer CS, uniprocessor, general use |

### Mutex Implementation (Conceptual) [Silberschatz 10e, §6.7.2]
```c
typedef struct {
    boolean available;
    queue<thread> waiters;
} mutex;

acquire(mutex *m) {
    if (test_and_set(&m->available) == false) return;  // fast path
    // contended: enqueue self, block()
    enqueue(&m->waiters, current_thread);
    block();  // scheduler switches away
}

release(mutex *m) {
    if (m->waiters.empty()) {
        m->available = true;
    } else {
        thread *next = dequeue(&m->waiters);
        wakeup(next);  // handoff directly (no lock release gap)
    }
}
```

---

## 8.8 POSIX Mutex & Semaphore API [Stevens & Rago 3e, Ch. 10, 11]

### Mutex [Stevens & Rago 3e, §10.3]
```c
#include <pthread.h>

// Static init
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

// Dynamic init
pthread_mutex_t lock;
pthread_mutex_init(&lock, NULL);

// Use
pthread_mutex_lock(&lock);   // blocks if busy
// CRITICAL SECTION
pthread_mutex_unlock(&lock); // must be called by owner

// Cleanup
pthread_mutex_destroy(&lock);
```

### Semaphores (Dijkstra's Generalization) [Silberschatz 10e, §6.8; Stevens & Rago 3e, §10.4]
- **Semaphore S**: Integer + wait queue
- **P() / wait()**: "Proberen" (test) — acquire resource
- **V() / signal()**: "Verhogen" (increment) — release resource

```c
#include <semaphore.h>

// Init: pshared=0 (threads), !=0 (processes, in shared memory)
sem_t sem;
sem_init(&sem, 0, 10);  // 10 available slots

// Wait (P)
sem_wait(&sem);         // blocks if value == 0

// Signal (V)
sem_post(&sem);         // increments, wakes one waiter

// Cleanup
sem_destroy(&sem);
```

### Semaphore Value Meaning [Silberschatz 10e, §6.8.2]
| Value | Meaning |
|-------|---------|
| `S > 0` | `S` resources available |
| `S = 0` | No resources, no waiters |
| `S < 0` | `|S|` threads blocked waiting |

### Types
| Type | Range | Use Case |
|------|-------|----------|
| **Binary** | 0 or 1 | Mutual exclusion (mutex equivalent) |
| **Counting** | ≥ 0 | Resource pools (DB connections, buffer slots) |

---

## 8.9 Classical Problem: Producer-Consumer with Semaphores [Silberschatz 10e, §6.9.1]

```c
sem_t empty = N;   // counting: N free slots
sem_t full = 0;    // counting: 0 filled slots
sem_t mutex = 1;   // binary: protect buffer

// PRODUCER
produce(item);
sem_wait(&empty);      // 1. Wait for FREE SLOT (blocks if full)
sem_wait(&mutex);      // 2. Get EXCLUSIVE ACCESS
add_to_buffer(item);
sem_post(&mutex);      // 3. Release buffer
sem_post(&full);       // 4. Signal: one more item available

// CONSUMER
sem_wait(&full);       // 1. Wait for ITEM (blocks if empty)
sem_wait(&mutex);      // 2. Get EXCLUSIVE ACCESS
item = remove_from_buffer();
sem_post(&mutex);      // 3. Release buffer
sem_post(&empty);      // 4. Signal: one more slot free
consume(item);
```

**Critical Order**: Wait on **counting semaphore FIRST**, then **mutex**.
- Reverse → deadlock (hold mutex while waiting for slot)

---

## 8.10 Readers-Writers Problem [Silberschatz 10e, §6.9.2]

### Rules
| Operation | Allowed Concurrently? |
|-----------|----------------------|
| Multiple Readers | ✅ Yes |
| Multiple Writers | ❌ No |
| Reader + Writer | ❌ No |

### Solution: Reader Preference [Silberschatz 10e, §6.9.2]
```c
sem_t rw_mutex = 1;  // Writer exclusion + first/last reader gate
sem_t mutex = 1;     // Protects read_count
int read_count = 0;  // Active readers

// Writer (Simple)
wait(rw_mutex);
// ... write ...
signal(rw_mutex);

// Reader (Tricky)
wait(mutex);
read_count++;
if (read_count == 1) wait(rw_mutex);  // First reader locks out writers
signal(mutex);

// ... READ ...

wait(mutex);
read_count--;
if (read_count == 0) signal(rw_mutex);  // Last reader unlocks writers
signal(mutex);
```

### Starvation Variants [Silberschatz 10e, §6.9.2]
| Variation | Who Starves |
|-----------|-------------|
| **Reader Preference** | Writers — if readers keep coming, `read_count` never hits 0 |
| **Writer Preference** | Readers — new readers wait behind queued writers |

### Linux Solutions
| Mechanism | How It Works |
|-----------|--------------|
| `rwlock_t` | Simple RW spinlock, reader-biased |
| `qrwlock` | Fair FIFO queue — no starvation |
| **RCU (Read-Copy-Update)** | **Readers NEVER block** — zero overhead reads! |

### RCU Magic [Silberschatz 10e, §6.9.2]
```
Writer:
  1. Allocate new copy of data
  2. Modify copy
  3. Atomic pointer swap (new → live)
  4. Wait for "grace period" (all pre-existing readers done)
  5. Free old copy

Reader:
  1. Read pointer (no lock!)
  2. Access data
  3. Done
```
**Used in**: Linux VFS, networking, RCU-protected linked lists

---

## 8.11 Dining Philosophers [Silberschatz 10e, §6.9.3]

### Problem [Silberschatz 10e, §6.9.3]
- 5 philosophers, 5 chopsticks (shared between neighbors)
- Need **2 chopsticks** to eat
- Cycle: Think → Pick left → Pick right → Eat → Put both → Think

### Naive Solution (Deadlocks!)
```c
wait(chopstick[i]);           // Left
wait(chopstick[(i+1)%5]);     // Right
// eat
signal(chopstick[i]);
signal(chopstick[(i+1)%5]);
```

**Deadlock**: All 5 pick up left simultaneously → all wait for right forever.

### Deadlock-Free Solutions [Silberschatz 10e, §6.9.3]

#### 1. Capacity Limiting (Semaphore = 4)
```c
sem_t seats = 4;  // Max 4 at table

wait(seats);          // Reserve seat
wait(chopstick[i]);
wait(chopstick[(i+1)%5]);
// eat
signal(chopstick[i]);
signal(chopstick[(i+1)%5]);
signal(seats);        // Free seat
```
**Why it works**: With 4 philosophers and 5 chopsticks, at least one can always get both.

#### 2. Asymmetric (Odd/Even)
```c
if (i % 2 == 0) {          // Even: right first
    wait(chopstick[(i+1)%5]);
    wait(chopstick[i]);
} else {                    // Odd: left first
    wait(chopstick[i]);
    wait(chopstick[(i+1)%5]);
}
// eat (same for both)
signal(chopstick[i]);
signal(chopstick[(i+1)%5]);
```
**Why it works**: Breaks circular wait — adjacent philosophers grab in opposite order.

#### 3. Atomic Acquisition (Monitor)
```c
// Inside a mutex (only one philosopher checks at a time):
wait(table_mutex);
if (chopstick[i] && chopstick[(i+1)%5]) {
    take_both();
}
signal(table_mutex);
```
**Why it works**: Check-and-acquire is atomic — no partial state possible.

---

## 8.12 Priority Inversion & Inheritance [Silberschatz 10e, §6.10; Stevens & Rago 3e, §10.7]

### The Problem [Silberschatz 10e, §6.10]
```
P1 (High) needs mutex held by P3 (Low)
    P1 blocks
P2 (Medium) becomes ready → preempts P3
    P3 can't run → can't release mutex → P1 blocked by P2 indirectly!
```

### Priority Inheritance Protocol [Silberschatz 10e, §6.10; Stevens & Rago 3e, §10.7]
```
When P1 (High) blocks on mutex held by P3 (Low):
    P3 temporarily inherits P1's priority
    P2 (Medium) can no longer preempt P3
    P3 finishes CS, releases mutex
    P3 drops to Low priority
    P1 acquires mutex, runs
```

**Implemented in**: Linux `pthread_mutexattr_setprotocol(PTHREAD_PRIO_INHERIT)`, Windows, VxWorks (fixed Mars Pathfinder)

> **Silberschatz**: "The priority inheritance protocol is a technique for preventing priority inversion." [Silberschatz 10e, §6.10]

---

## 8.13 Modern Synchronization Stack

```
APPLICATION CODE
    │
    ▼
pthread_mutex_lock() / sem_wait() / pthread_cond_wait()
    │
    ▼
LIBRARY (glibc/pthreads)
    │  - Fast path: atomic CAS in userspace (futex)
    │  - Slow path: syscall (futex_wait / futex_wake)
    ▼
KERNEL
    │  - Wait queues
    │  - Scheduler integration
    │  - Priority inheritance
    ▼
HARDWARE
    │  - test_and_set / compare_and_swap
    │  - Cache coherency (MESI protocol)
    │  - Memory barriers
```

**Modern optimization**: `futex` (Fast Userspace Mutex) — uncontended lock/unlock **entirely in userspace** via atomic CAS. Syscall only on contention.

---

## Key Takeaways
- **Race conditions** = non-atomic read-modify-write + preemption [Silberschatz 10e, §6.1]
- **Critical section** needs: Mutual Exclusion, Progress, Bounded Waiting [Silberschatz 10e, §6.2]
- **Software algorithms (Peterson)** fail on modern CPUs due to reordering/store buffers [Silberschatz 10e, §6.3]
- **Hardware atomics** (TSL, CAS) provide indivisible RMW — foundation of all locks [Silberschatz 10e, §6.4]
- **Spinlocks** = busy-wait on atomic; good for short CS, bad for long/uniprocessor [Silberschatz 10e, §6.5]
- **Mutexes/Semaphores** = blocking (yield CPU) + wait queues — general purpose [Silberschatz 10e, §6.7-8]
- **Semaphores** generalize mutexes: counting = resource pools [Silberschatz 10e, §6.8]
- **Producer-consumer**: 3 semaphores (mutex + empty + full) [Silberschatz 10e, §6.9.1]
- **Readers-Writers**: `read_count` tracks readers; first/last reader gates writers [Silberschatz 10e, §6.9.2]
- **RCU**: Readers never block — extreme read scalability [Silberschatz 10e, §6.9.2]
- **Priority inversion**: medium blocks low blocks high → fix with priority inheritance [Silberschatz 10e, §6.10]
- **Real code**: Use `pthread_mutex`, `sem_t`, `pthread_cond` — not raw atomics

---

**Further Reading**: [Silberschatz 10e, Ch. 5, 6] • [Stallings 9e, Ch. 5, 6] • [Stevens & Rago 3e, Ch. 10, 11]