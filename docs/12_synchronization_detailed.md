# Topic 12 (Detailed): Process Synchronization — Complete Programs with Comments

**Source**: Lectures 7-9 (Unit 2) + Textbook Ch. 6 (Silberschatz Ch. 5, 6, Stallings Ch. 5, 6, Stevens & Rago Ch. 10, 11)

---

## 12.1 The Critical Section Problem

### What is a Race Condition?

```c
// counter++ is NOT atomic! It compiles to:
load  counter → register
inc   register
store register → counter

// Two threads doing counter++ simultaneously:
Thread A: load 5     (register=5)
Thread B: load 5     (register=5)  ← PREEMPTION!
Thread A: inc  → 6
Thread A: store 6  (counter=6)
Thread B: inc  → 6
Thread B: store 6  (counter=6)  ← LOST UPDATE! Should be 7.
```

### Critical Section Requirements (ALL THREE Must Hold)

| Requirement | Definition |
|-------------|------------|
| **Mutual Exclusion** | Only ONE thread in critical section at a time |
| **Progress** | If CS free, some waiting thread enters (no deadlock) |
| **Bounded Waiting** | No starvation — limit on how many others can cut in line |

```c
// Generic critical section structure
do {
    // ENTRY SECTION: Request permission
    
    // CRITICAL SECTION: Mutate shared data
    
    // EXIT SECTION: Release permission
    
    // REMAINDER SECTION: Non-critical work
} while (true);
```

---

## 12.2 Software Solutions (Why They Fail)

### Peterson's Algorithm (2 Processes Only)

```c
boolean flag[2] = {false, false};
int turn;

void process_i() {
    int j = 1 - i;  // Other process
    
    flag[i] = true;      // "I want in"
    turn = j;            // "You go first"
    
    while (flag[j] && turn == j);  // Spin wait
    
    // CRITICAL SECTION
    
    flag[i] = false;     // "I'm done"
}
```

**Why it fails on modern CPUs:**
- Compiler/CPU reorder instructions: `turn = j` may execute BEFORE `flag[i] = true`
- Store buffers: writes not immediately visible to other cores
- **Fix requires memory barriers** → architecture-specific, not portable

---

## 12.3 Hardware Atomic Instructions

### Test-and-Set (TSL) — x86 `XCHG`, ARM `LDREX/STREX`

```c
// Atomic: read old value, write true, return old value
boolean test_and_set(boolean *target) {
    boolean rv = *target;  // Atomic read
    *target = TRUE;        // Atomic write
    return rv;
}
```

### Compare-and-Swap (CAS) — x86 `CMPXCHG`

```c
// Atomic: if *addr == expected, write new_val; return old value
int compare_and_swap(int *addr, int expected, int new_val) {
    int old = *addr;
    if (*addr == expected) *addr = new_val;
    return old;  // All atomic
}
```

### Building a Spinlock from TSL

```c
boolean lock = false;

void acquire_lock() {
    while (test_and_set(&lock)) ;  // Spin until we get it
}

void release_lock() {
    lock = false;  // Simple store
}
```

**Problem**: No bounded waiting — thread can starve.

---

## 12.4 Bounded-Waiting Spinlock (Circular Queue)

```c
boolean waiting[N] = {false};
boolean lock = false;

void acquire_lock(int i) {
    waiting[i] = true;
    boolean key = true;
    while (waiting[i] && key) {
        key = test_and_set(&lock);
    }
    waiting[i] = false;
    
    // CRITICAL SECTION
}

void release_lock(int i) {
    int j = (i + 1) % N;
    while (j != i && !waiting[j]) j = (j + 1) % N;
    
    if (j == i) lock = false;       // Nobody waiting
    else waiting[j] = false;        // Wake next waiter
}
```

**Guarantees bounded waiting**: Each waiter served in turn (max N-1 others before you).

---

## 12.5 POSIX Synchronization API (Real Code)

### Mutex (Blocking, Not Spinning)

```c
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>

// Shared counter
int counter = 0;
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void *increment(void *arg) {
    int iterations = *(int*)arg;
    
    for (int i = 0; i < iterations; i++) {
        pthread_mutex_lock(&lock);
        // CRITICAL SECTION
        int temp = counter;
        temp++;
        counter = temp;
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}

int main() {
    const int THREADS = 4;
    const int ITERATIONS = 1000000;
    
    pthread_t threads[THREADS];
    
    for (int i = 0; i < THREADS; i++) {
        pthread_create(&threads[i], NULL, increment, &ITERATIONS);
    }
    
    for (int i = 0; i < THREADS; i++) {
        pthread_join(threads[i], NULL);
    }
    
    printf("Expected: %d, Actual: %d\n", THREADS * ITERATIONS, counter);
    pthread_mutex_destroy(&lock);
    return 0;
}
```

### Condition Variables (Wait for Predicate)

```c
#include <pthread.h>
#include <stdio.h>

pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
int buffer = 0;
int has_data = 0;

void *producer(void *arg) {
    for (int i = 1; i <= 10; i++) {
        pthread_mutex_lock(&mutex);
        
        // Wait for buffer to be empty
        while (has_data) {
            pthread_cond_wait(&cond, &mutex);
        }
        
        buffer = i;
        has_data = 1;
        printf("Produced: %d\n", i);
        
        pthread_cond_signal(&cond);  // Wake consumer
        pthread_mutex_unlock(&mutex);
    }
    return NULL;
}

void *consumer(void *arg) {
    for (int i = 1; i <= 10; i++) {
        pthread_mutex_lock(&mutex);
        
        // Wait for buffer to have data
        while (!has_data) {
            pthread_cond_wait(&cond, &mutex);
        }
        
        int val = buffer;
        has_data = 0;
        printf("Consumed: %d\n", val);
        
        pthread_cond_signal(&cond);  // Wake producer
        pthread_mutex_unlock(&mutex);
    }
    return NULL;
}

int main() {
    pthread_t prod, cons;
    pthread_create(&prod, NULL, producer, NULL);
    pthread_create(&cons, NULL, consumer, NULL);
    pthread_join(prod, NULL);
    pthread_join(cons, NULL);
    return 0;
}
```

---

## 12.6 Semaphores (Dijkstra's Generalization)

### Semaphore Operations

```c
#include <semaphore.h>

// Initialize: pshared=0 (threads), value=initial count
sem_t sem;
sem_init(&sem, 0, 1);  // Binary semaphore (mutex)

// P() / wait() - acquire
sem_wait(&sem);  // Blocks if value == 0

// V() / signal() - release
sem_post(&sem);  // Increments, wakes one waiter

// Cleanup
sem_destroy(&sem);
```

### Semaphore Value Meaning

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

## 12.7 Classical Problems — Complete Solutions

### Problem 1: Producer-Consumer (Bounded Buffer)

```c
/*
 * File: producer_consumer.c
 * Complete solution with 3 semaphores
 * Buffer size = 10
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define BUFFER_SIZE 10

int buffer[BUFFER_SIZE];
int in = 0, out = 0;

// Semaphores
sem_t empty;   // Counts empty slots (initially BUFFER_SIZE)
sem_t full;    // Counts filled slots (initially 0)
sem_t mutex;   // Binary semaphore for buffer access (initially 1)

void *producer(void *arg) {
    int id = *(int*)arg;
    
    for (int i = 1; i <= 20; i++) {
        int item = id * 100 + i;  // Unique item
        
        sem_wait(&empty);    // 1. Wait for EMPTY SLOT
        sem_wait(&mutex);    // 2. Get EXCLUSIVE ACCESS
        
        buffer[in] = item;
        printf("[Producer %d] Produced item %d at index %d\n", id, item, in);
        in = (in + 1) % BUFFER_SIZE;
        
        sem_post(&mutex);    // 3. Release buffer
        sem_post(&full);     // 4. Signal: ITEM AVAILABLE
        
        usleep(100000);  // Simulate work
    }
    return NULL;
}

void *consumer(void *arg) {
    int id = *(int*)arg;
    
    for (int i = 1; i <= 20; i++) {
        sem_wait(&full);     // 1. Wait for ITEM
        sem_wait(&mutex);    // 2. Get EXCLUSIVE ACCESS
        
        int item = buffer[out];
        printf("[Consumer %d] Consumed item %d from index %d\n", id, item, out);
        out = (out + 1) % BUFFER_SIZE;
        
        sem_post(&mutex);    // 3. Release buffer
        sem_post(&empty);    // 4. Signal: SLOT FREE
        
        usleep(150000);  // Simulate work
    }
    return NULL;
}

int main() {
    // Initialize semaphores
    sem_init(&empty, 0, BUFFER_SIZE);  // 10 empty slots
    sem_init(&full, 0, 0);             // 0 filled slots
    sem_init(&mutex, 0, 1);            // 1 = unlocked
    
    pthread_t prod[2], cons[2];
    int prod_ids[2] = {1, 2};
    int cons_ids[2] = {1, 2};
    
    // Create threads
    for (int i = 0; i < 2; i++) {
        pthread_create(&prod[i], NULL, producer, &prod_ids[i]);
        pthread_create(&cons[i], NULL, consumer, &cons_ids[i]);
    }
    
    // Wait for completion
    for (int i = 0; i < 2; i++) {
        pthread_join(prod[i], NULL);
        pthread_join(cons[i], NULL);
    }
    
    // Cleanup
    sem_destroy(&empty);
    sem_destroy(&full);
    sem_destroy(&mutex);
    
    return 0;
}
```

**CRITICAL ORDER** (Producer):
```
sem_wait(&empty);   // Wait for slot FIRST
sem_wait(&mutex);   // Then get mutex
```

**WRONG ORDER** (causes deadlock when buffer full):
```
sem_wait(&mutex);   // Hold mutex
sem_wait(&empty);   // Wait for slot while holding mutex → DEADLOCK!
```

---

### Problem 2: Readers-Writers (Reader Preference)

```c
/*
 * File: readers_writers.c
 * Multiple readers allowed, writers exclusive
 */

#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

sem_t rw_mutex;  // Writer exclusion + first/last reader gate
sem_t mutex;     // Protects read_count
int read_count = 0;
int shared_data = 0;

void *reader(void *arg) {
    int id = *(int*)arg;
    
    for (int i = 0; i < 5; i++) {
        // Entry section
        sem_wait(&mutex);
        read_count++;
        if (read_count == 1) {
            sem_wait(&rw_mutex);  // First reader locks out writers
        }
        sem_post(&mutex);
        
        // READING
        printf("[Reader %d] Reading data = %d\n", id, shared_data);
        usleep(100000);
        
        // Exit section
        sem_wait(&mutex);
        read_count--;
        if (read_count == 0) {
            sem_post(&rw_mutex);  // Last reader unlocks writers
        }
        sem_post(&mutex);
        
        usleep(200000);
    }
    return NULL;
}

void *writer(void *arg) {
    int id = *(int*)arg;
    
    for (int i = 0; i < 3; i++) {
        sem_wait(&rw_mutex);  // Exclusive access
        
        // WRITING
        shared_data++;
        printf("[Writer %d] Wrote data = %d\n", id, shared_data);
        usleep(300000);
        
        sem_post(&rw_mutex);
        usleep(500000);
    }
    return NULL;
}

int main() {
    sem_init(&rw_mutex, 0, 1);
    sem_init(&mutex, 0, 1);
    
    pthread_t readers[3], writers[2];
    int r_ids[3] = {1, 2, 3};
    int w_ids[2] = {1, 2};
    
    for (int i = 0; i < 3; i++) pthread_create(&readers[i], NULL, reader, &r_ids[i]);
    for (int i = 0; i < 2; i++) pthread_create(&writers[i], NULL, writer, &w_ids[i]);
    
    for (int i = 0; i < 3; i++) pthread_join(readers[i], NULL);
    for (int i = 0; i < 2; i++) pthread_join(writers[i], NULL);
    
    sem_destroy(&rw_mutex);
    sem_destroy(&mutex);
    return 0;
}
```

**Starvation Note**: This implementation starves writers if readers keep coming.
**Fix**: Writer preference or fair queuing (Linux `qrwlock`).

---

### Problem 3: Dining Philosophers — 3 Deadlock-Free Solutions

```c
/*
 * File: dining_philosophers.c
 * All 3 solutions implemented
 */

#include <stdio.h>
#include <pthread.h>
#include <semaphore.h>
#include <unistd.h>

#define N 5

// ============================================================
// SOLUTION 1: Capacity Limiting (Semaphore = N-1 = 4)
// ============================================================
sem_t chopstick1[N];
sem_t seats;  // Max 4 at table

void *philosopher1(void *arg) {
    int id = *(int*)arg;
    int left = id;
    int right = (id + 1) % N;
    
    for (int i = 0; i < 3; i++) {
        sem_wait(&seats);              // Reserve seat (max 4)
        sem_wait(&chopstick1[left]);   // Pick left
        sem_wait(&chopstick1[right]);  // Pick right
        
        printf("[Phil %d] Eating (Solution 1)\n", id);
        usleep(200000);
        
        sem_post(&chopstick1[left]);
        sem_post(&chopstick1[right]);
        sem_post(&seats);              // Free seat
        
        printf("[Phil %d] Thinking\n", id);
        usleep(100000);
    }
    return NULL;
}

// ============================================================
// SOLUTION 2: Asymmetric (Odd/Even Pick Order)
// ============================================================
sem_t chopstick2[N];

void *philosopher2(void *arg) {
    int id = *(int*)arg;
    int left = id;
    int right = (id + 1) % N;
    
    for (int i = 0; i < 3; i++) {
        if (id % 2 == 0) {  // Even: right first
            sem_wait(&chopstick2[right]);
            sem_wait(&chopstick2[left]);
        } else {  // Odd: left first
            sem_wait(&chopstick2[left]);
            sem_wait(&chopstick2[right]);
        }
        
        printf("[Phil %d] Eating (Solution 2)\n", id);
        usleep(200000);
        
        sem_post(&chopstick2[left]);
        sem_post(&chopstick2[right]);
        
        usleep(100000);
    }
    return NULL;
}

// ============================================================
// SOLUTION 3: Atomic Acquisition (Monitor/Mutex)
// ============================================================
sem_t chopstick3[N];
pthread_mutex_t table_mutex = PTHREAD_MUTEX_INITIALIZER;

void *philosopher3(void *arg) {
    int id = *(int*)arg;
    int left = id;
    int right = (id + 1) % N;
    
    for (int i = 0; i < 3; i++) {
        pthread_mutex_lock(&table_mutex);
        // Check if BOTH available atomically
        int left_val, right_val;
        sem_getvalue(&chopstick3[left], &left_val);
        sem_getvalue(&chopstick3[right], &right_val);
        
        if (left_val > 0 && right_val > 0) {
            sem_wait(&chopstick3[left]);
            sem_wait(&chopstick3[right]);
        } else {
            pthread_mutex_unlock(&table_mutex);
            usleep(10000);  // Back off
            continue;
        }
        pthread_mutex_unlock(&table_mutex);
        
        printf("[Phil %d] Eating (Solution 3)\n", id);
        usleep(200000);
        
        sem_post(&chopstick3[left]);
        sem_post(&chopstick3[right]);
        usleep(100000);
    }
    return NULL;
}

// ============================================================
// Test harness
// ============================================================
void run_solution(int sol_num, void *(*phil_func)(void*)) {
    sem_t chopsticks[N];
    for (int i = 0; i < N; i++) sem_init(&chopsticks[i], 0, 1);
    
    if (sol_num == 1) sem_init(&seats, 0, 4);
    if (sol_num == 3) pthread_mutex_init(&table_mutex, NULL);
    
    pthread_t threads[N];
    int ids[N] = {0, 1, 2, 3, 4};
    
    printf("\n=== Solution %d ===\n", sol_num);
    for (int i = 0; i < N; i++) {
        pthread_create(&threads[i], NULL, phil_func, &ids[i]);
    }
    
    sleep(3);  // Let them run
    
    for (int i = 0; i < N; i++) pthread_cancel(threads[i]);
    for (int i = 0; i < N; i++) pthread_join(threads[i], NULL);
    
    for (int i = 0; i < N; i++) sem_destroy(&chopsticks[i]);
    if (sol_num == 1) sem_destroy(&seats);
    if (sol_num == 3) pthread_mutex_destroy(&table_mutex);
}

int main() {
    run_solution(1, philosopher1);
    run_solution(2, philosopher2);
    run_solution(3, philosopher3);
    return 0;
}
```

---

## 12.8 Priority Inversion & Inheritance

### The Problem

```
HIGH (H) needs mutex held by LOW (L)
    H blocks
MEDIUM (M) becomes ready → preempts L
    L can't run → can't release mutex → H blocked by M indirectly!
```

### Priority Inheritance Protocol

```c
#include <pthread.h>
#include <stdio.h>
#include <unistd.h>

pthread_mutex_t mutex;
pthread_mutexattr_t attr;

void *high_priority(void *arg) {
    printf("[HIGH] Trying to lock mutex...\n");
    pthread_mutex_lock(&mutex);
    printf("[HIGH] Got mutex, doing work...\n");
    sleep(2);
    pthread_mutex_unlock(&mutex);
    printf("[HIGH] Released mutex\n");
    return NULL;
}

void *low_priority(void *arg) {
    printf("[LOW] Locking mutex first...\n");
    pthread_mutex_lock(&mutex);
    printf("[LOW] Got mutex, doing long work...\n");
    sleep(5);  // Long critical section
    pthread_mutex_unlock(&mutex);
    printf("[LOW] Released mutex\n");
    return NULL;
}

void *medium_priority(void *arg) {
    sleep(1);  // Let low get mutex first
    printf("[MEDIUM] Running CPU-intensive work (no mutex)...\n");
    sleep(3);
    printf("[MEDIUM] Done\n");
    return NULL;
}

int main() {
    // Enable priority inheritance
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_setprotocol(&attr, PTHREAD_PRIO_INHERIT);
    pthread_mutex_init(&mutex, &attr);
    
    pthread_t high, low, medium;
    
    // Create with priorities (requires root for real-time)
    pthread_create(&low, NULL, low_priority, NULL);
    sleep(1);  // Ensure low gets mutex
    pthread_create(&medium, NULL, medium_priority, NULL);
    pthread_create(&high, NULL, high_priority, NULL);
    
    pthread_join(high, NULL);
    pthread_join(low, NULL);
    pthread_join(medium, NULL);
    
    pthread_mutex_destroy(&mutex);
    pthread_mutexattr_destroy(&attr);
    return 0;
}
```

**Without inheritance**: Medium blocks Low → High waits forever indirectly.
**With inheritance**: Low inherits High's priority → Medium can't preempt → Low finishes → High proceeds.

---

## 12.9 Modern Synchronization Stack

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

**Futex (Fast Userspace Mutex)**:
- Uncontended lock/unlock: **entirely in userspace** via atomic CAS
- Contended: syscall to `futex_wait` / `futex_wake`
- Avoids syscall overhead for common case

---

## 12.10 Complete Exam-Focused Summary

| Concept | Key Points |
|---------|------------|
| **Race condition** | Non-atomic read-modify-write + preemption |
| **Critical section** | Mutual Exclusion, Progress, Bounded Waiting |
| **Peterson's algorithm** | 2-process software solution; fails on modern CPUs |
| **TSL / CAS** | Hardware atomic instructions; foundation of all locks |
| **Spinlock vs Mutex** | Spinlock=busy wait (short CS); Mutex=block (long CS) |
| **Semaphore** | Integer + wait queue; P()=wait, V()=signal |
| **Binary vs Counting** | Binary=0/1 (mutex); Counting=resource pool |
| **Producer-Consumer** | 3 semaphores: mutex + empty + full |
| **Readers-Writers** | read_count tracks readers; first/last gates writers |
| **Dining Philosophers** | 3 solutions: capacity=4, asymmetric, atomic acquisition |
| **Priority inversion** | Medium blocks Low blocks High → fix: priority inheritance |
| **Futex** | Uncontended in userspace; contended via syscall |

---

## 12.11 Common Pitfalls

| Pitfall | Wrong | Correct |
|---------|-------|---------|
| Semaphore order | `wait(mutex); wait(empty);` | `wait(empty); wait(mutex);` |
| Missing while loop | `if (!cond) wait();` | `while (!cond) wait();` |
| Signal before unlock | `signal(); unlock();` | `unlock(); signal();` |
| Forgot destroy | `sem_init(...);` | `sem_destroy(&sem);` |
| exit() in thread | `exit(0);` | `pthread_exit(NULL);` |

---

*Next: Topic 13 (Deadlocks) with complete Banker's Algorithm trace and prevention code*