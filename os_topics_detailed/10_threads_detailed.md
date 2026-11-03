# Topic 10 (Detailed): Threads & Multicore Programming

**Source**: Lectures 2 & 4 (Unit 2) + Textbook Ch. 6 (Silberschatz Ch. 4, Stallings Ch. 4, Stevens & Rago Ch. 11-12)

---

## 10.1 Thread Concept

### Thread vs Process

| Aspect | Process | Thread |
|--------|---------|--------|
| **Memory** | Isolated address space | Shared (code, data, heap, files) |
| **Private** | PID, address space, FD table | TID, PC, registers, stack, errno |
| **Creation cost** | High (~30× thread) | Low |
| **Context switch** | Slow (~5× thread) | Fast |
| **Protection** | Strong (fault isolates) | None (bug crashes all) |

> **Silberschatz**: "A thread is a basic unit of CPU utilization; it comprises a thread ID, a program counter, a register set, and a stack."

### Thread Structure

```
Thread = (TID, Program Counter, Register Set, Private Stack)
```

### Process Architecture

```
SINGLE-THREADED                    MULTITHREADED
┌─────────────────────┐           ┌─────────────────────┐
│ Code | Data | Files │           │ Code | Data | Files │  ← SHARED
├─────────────────────┤           ├─────────────────────┤
│ Registers | Stack   │           │ Regs | Regs | Regs  │
│             │       │           │ Stack|Stack|Stack  │  ← PER-THREAD
└─────────────────────┘           └─────────────────────┘
```

---

## 10.2 Benefits of Multithreading

| Benefit | Description |
|---------|-------------|
| **Responsiveness** | UI stays responsive while background thread computes |
| **Resource Sharing** | Threads share memory/files automatically — no IPC needed |
| **Economy** | Thread create ≈ 30× faster than process; context switch ≈ 5× faster |
| **Scalability** | Threads run on multiple cores simultaneously |

### Real-World Examples
- **Web Browser**: Network thread, render thread, audio thread, UI thread
- **Word Processor**: Input thread, spell-check thread, autosave thread

---

## 10.3 Multithreading Models

| Model | User:Kernel | Parallelism | Blocking Issue | Used By |
|-------|-------------|-------------|----------------|---------|
| **Many-to-One (M:1)** | Many:1 | ❌ No | One blocks → all block | Old Solaris, Green threads |
| **One-to-One (1:1)** | 1:1 | ✅ Yes | No blocking propagation | **Linux, Windows, macOS** |
| **Many-to-Many (M:N)** | Many:Many | ✅ Yes | Flexible multiplexing | Old Solaris |
| **Two-Level (Hybrid)** | Hybrid | ✅ Yes | Critical threads bound 1:1 | IRIX, HP-UX, Solaris 8- |

```
1:1 Model (Modern Standard):
User:  T1  T2  T3  T4
        │  │  │  │
Kernel: KT1 KT2 KT3 KT4
```

> **Silberschatz**: "The one-to-one model is the most common model used in modern operating systems."

---

## 10.4 POSIX Pthreads API

### Thread Creation

```c
#include <pthread.h>

int pthread_create(
    pthread_t *thread,           // OUT: thread ID
    const pthread_attr_t *attr,  // Attributes (NULL = defaults)
    void *(*start_routine)(void *), // Function pointer
    void *arg                    // Single argument (void*)
);

// Thread function signature:
void *my_thread_func(void *arg) {
    // do work
    return NULL;  // or pthread_exit(retval)
}
```

> **Stevens & Rago**: "The pthread_create() function creates a new thread of control that executes concurrently with the calling thread."

### Critical: Stack-Escape Bug

```c
// ❌ WRONG - passes address of LOCAL variable
void start_thread(int value) {
    pthread_create(&tid, NULL, worker, &value); // DANGER!
    // if start_thread() returns before worker runs...
    // value is gone! Stack frame destroyed!
}

// ✅ CORRECT - allocate on heap
void start_thread(int value) {
    int *arg = malloc(sizeof(int));
    *arg = value;
    pthread_create(&tid, NULL, worker, arg);
    // worker must free(arg) when done
}

// ✅ CORRECT - pass from main() stack (main never returns)
int main() {
    int value = 42;  // lives until program ends
    pthread_create(&tid, NULL, worker, &value);
    pthread_join(tid, NULL);
}
```

**Rule**: Argument pointer must remain valid until thread finishes using it.

---

### Thread Join — Synchronization & Cleanup

```c
int pthread_join(pthread_t thread, void **retval);
// Blocks until 'thread' terminates
// retval receives return value
```

**Why join?**
1. **Wait for result** — main needs worker's output
2. **Prevent zombie threads** — unjoined threads leak resources (TCB, stack)
3. **Orderly shutdown** — ensure workers done before exit

```c
// Fork-Join Pattern [Silberschatz Fig. 4.3]
pthread_t threads[N];
for (int i = 0; i < N; i++)
    pthread_create(&threads[i], NULL, worker, &args[i]);

for (int i = 0; i < N; i++)
    pthread_join(threads[i], &results[i]);  // Collect results
```

---

### `pthread_exit()` vs `exit()` vs `return` in `main()`

| Call | Effect |
|------|--------|
| `pthread_exit(val)` | **Current thread only** dies; process lives if other threads exist |
| `return val` in thread func | Same as `pthread_exit(val)` |
| `exit(val)` or `return` in `main()` | **Entire process dies** — all threads killed instantly |
| `pthread_exit()` in `main()` | Main thread dies, **other threads keep running** |

---

## 10.5 Thread Attributes & Synchronization

### Scheduling Scopes

| Scope | Model | Behavior |
|-------|-------|----------|
| **PCS (Process-Contention)** | M:1, M:N | User-level library schedules; competition within process only |
| **SCS (System-Contention)** | 1:1 | Kernel schedules directly on CPUs; competition system-wide |

```c
pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setscope(&attr, PTHREAD_SCOPE_SYSTEM);  // Linux default
```

> **Silberschatz**: "The contention scope defines the set of threads against which a thread competes for CPU time."

### Mutex (Mutual Exclusion Lock)

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_lock(&lock);   // Blocks if busy
// CRITICAL SECTION
pthread_mutex_unlock(&lock); // Must be called by owner
```

### Condition Variables (Wait for Predicate)

```c
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

// Waiter
pthread_mutex_lock(&mutex);
while (!condition) pthread_cond_wait(&cond, &mutex);
// Condition is true, mutex held
pthread_mutex_unlock(&mutex);

// Signaler
pthread_mutex_lock(&mutex);
condition = true;
pthread_cond_signal(&cond);  // or broadcast
pthread_mutex_unlock(&mutex);
```

---

## 10.6 Thread Cancellation

| Mode | Behavior | Danger |
|------|----------|--------|
| **Asynchronous** | Thread killed immediately at any instruction | May hold mutex → deadlock; may have malloc'd memory → leak |
| **Deferred (default)** | Thread checks at **cancellation points** (`pthread_testcancel()`, `pthread_join()`, `pthread_cond_wait()`, `read()`, `write()`) | Safe — thread cleans up before exiting |

```c
// Deferred cancellation example
void *worker(void *arg) {
    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE, NULL);
    pthread_setcanceltype(PTHREAD_CANCEL_DEFERRED, NULL);

    while (true) {
        do_work_chunk();
        pthread_testcancel();  // Explicit cancellation point
    }
}
```

---

## 10.7 Thread Pools

**Problem**: Creating/destroying threads per request = overhead + unbounded resource use

**Architecture**:
```c
// Startup: create fixed pool
for (i = 0; i < POOL_SIZE; i++)
    pthread_create(&pool[i], NULL, worker_loop, &queue);

// Worker loop
void *worker_loop(void *arg) {
    while (true) {
        Task *t = queue_pop(&queue);  // Blocks if empty
        execute(t);
        // Thread returns to pool, doesn't die
    }
}

// Submit work
queue_push(&queue, new_task);  // Wakes one worker
```

**Used everywhere**: nginx, Apache, Java `ExecutorService`, C++ `std::thread_pool`

> **Silberschatz**: "A thread pool provides a more efficient way to manage threads... it reduces the overhead of creating and destroying threads."

---

## 10.8 Complete Thread Programs

### Program 1: Parallel Sum with Fork-Join

```c
/*
 * File: parallel_sum.c
 * Parallel array summation using fork-join
 * Compile: gcc -o parallel_sum parallel_sum.c -lpthread
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

typedef struct {
    int *array;
    int start;
    int end;
    long long sum;
} Task;

void *sum_worker(void *arg) {
    Task *t = (Task*)arg;
    long long local_sum = 0;
    for (int i = t->start; i < t->end; i++) {
        local_sum += t->array[i];
    }
    t->sum = local_sum;
    return NULL;
}

int main() {
    const int SIZE = 10000000;
    const int THREADS = 4;
    
    int *array = malloc(SIZE * sizeof(int));
    for (int i = 0; i < SIZE; i++) array[i] = 1;  // Sum = SIZE
    
    pthread_t threads[THREADS];
    Task tasks[THREADS];
    int chunk = SIZE / THREADS;
    
    for (int i = 0; i < THREADS; i++) {
        tasks[i].array = array;
        tasks[i].start = i * chunk;
        tasks[i].end = (i == THREADS - 1) ? SIZE : (i + 1) * chunk;
        tasks[i].sum = 0;
        pthread_create(&threads[i], NULL, sum_worker, &tasks[i]);
    }
    
    long long total = 0;
    for (int i = 0; i < THREADS; i++) {
        pthread_join(threads[i], NULL);
        total += tasks[i].sum;
        printf("Thread %d: sum = %lld\n", i, tasks[i].sum);
    }
    
    printf("Total: %lld (expected: %d)\n", total, SIZE);
    free(array);
    return 0;
}
```

---

### Program 2: Mutex Counter (Race Condition Demo)

```c
/*
 * File: mutex_counter.c
 * Demonstrates race condition and mutex fix
 * Compile: gcc -o mutex_counter mutex_counter.c -lpthread
 */

#include <stdio.h>
#include <pthread.h>
#include <stdlib.h>

#define THREADS 4
#define ITERATIONS 1000000

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

**Without mutex**: Race condition → lost updates → counter < expected
**With mutex**: Correct synchronization → counter = expected

---

### Program 3: Condition Variable (Producer-Consumer)

```c
/*
 * File: condvar_producer_consumer.c
 * Producer-consumer with condition variables
 * Compile: gcc -o condvar_pc condvar_producer_consumer.c -lpthread
 */

#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

#define BUFFER_SIZE 5

int buffer[BUFFER_SIZE];
int in = 0, out = 0, count = 0;

pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t not_full = PTHREAD_COND_INITIALIZER;
pthread_cond_t not_empty = PTHREAD_COND_INITIALIZER;

void *producer(void *arg) {
    int id = *(int*)arg;
    for (int i = 1; i <= 10; i++) {
        pthread_mutex_lock(&mutex);
        
        while (count == BUFFER_SIZE) {
            printf("[Producer %d] Buffer full, waiting...\n", id);
            pthread_cond_wait(&not_full, &mutex);
        }
        
        buffer[in] = i;
        in = (in + 1) % BUFFER_SIZE;
        count++;
        printf("[Producer %d] Produced %d (count=%d)\n", id, i, count);
        
        pthread_cond_signal(&not_empty);
        pthread_mutex_unlock(&mutex);
        
        usleep(100000);
    }
    return NULL;
}

void *consumer(void *arg) {
    int id = *(int*)arg;
    for (int i = 1; i <= 10; i++) {
        pthread_mutex_lock(&mutex);
        
        while (count == 0) {
            printf("[Consumer %d] Buffer empty, waiting...\n", id);
            pthread_cond_wait(&not_empty, &mutex);
        }
        
        int item = buffer[out];
        out = (out + 1) % BUFFER_SIZE;
        count--;
        printf("[Consumer %d] Consumed %d (count=%d)\n", id, item, count);
        
        pthread_cond_signal(&not_full);
        pthread_mutex_unlock(&mutex);
        
        usleep(150000);
    }
    return NULL;
}

int main() {
    pthread_t prod[2], cons[2];
    int prod_ids[2] = {1, 2};
    int cons_ids[2] = {1, 2};
    
    for (int i = 0; i < 2; i++) {
        pthread_create(&prod[i], NULL, producer, &i);
        pthread_create(&cons[i], NULL, consumer, &i);
    }
    
    for (int i = 0; i < 2; i++) {
        pthread_join(prod[i], NULL);
        pthread_join(cons[i], NULL);
    }
    return 0;
}
```

---

### Program 4: Thread Pool

```c
/*
 * File: thread_pool.c
 * Simple thread pool implementation
 * Compile: gcc -o thread_pool thread_pool.c -lpthread
 */

#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <unistd.h>

#define POOL_SIZE 4
#define QUEUE_SIZE 100

typedef struct {
    void (*func)(void*);
    void *arg;
} Task;

Task queue[QUEUE_SIZE];
int q_head = 0, q_tail = 0, q_count = 0;

pthread_mutex_t q_mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t q_not_empty = PTHREAD_COND_INITIALIZER;
pthread_cond_t q_not_full = PTHREAD_COND_INITIALIZER;

int shutdown = 0;

void queue_push(Task t) {
    pthread_mutex_lock(&q_mutex);
    while (q_count == QUEUE_SIZE && !shutdown) {
        pthread_cond_wait(&q_not_full, &q_mutex);
    }
    if (shutdown) { pthread_mutex_unlock(&q_mutex); return; }
    
    queue[q_tail] = t;
    q_tail = (q_tail + 1) % QUEUE_SIZE;
    q_count++;
    pthread_cond_signal(&q_not_empty);
    pthread_mutex_unlock(&q_mutex);
}

Task queue_pop() {
    pthread_mutex_lock(&q_mutex);
    while (q_count == 0 && !shutdown) {
        pthread_cond_wait(&q_not_empty, &q_mutex);
    }
    if (shutdown && q_count == 0) {
        pthread_mutex_unlock(&q_mutex);
        Task empty = {NULL, NULL};
        return empty;
    }
    
    Task t = queue[q_head];
    q_head = (q_head + 1) % QUEUE_SIZE;
    q_count--;
    pthread_cond_signal(&q_not_full);
    pthread_mutex_unlock(&q_mutex);
    return t;
}

void *worker(void *arg) {
    int id = *(int*)arg;
    while (1) {
        Task t = queue_pop();
        if (t.func == NULL && shutdown) break;
        if (t.func) {
            printf("[Worker %d] Executing task\n", id);
            t.func(t.arg);
        }
    }
    printf("[Worker %d] Exiting\n", id);
    return NULL;
}

void example_task(void *arg) {
    int n = *(int*)arg;
    printf("  Task %d executing\n", n);
    usleep(100000);
}

int main() {
    pthread_t pool[POOL_SIZE];
    int ids[POOL_SIZE];
    
    for (int i = 0; i < POOL_SIZE; i++) {
        ids[i] = i;
        pthread_create(&pool[i], NULL, worker, &ids[i]);
    }
    
    // Submit work
    for (int i = 0; i < 20; i++) {
        int *arg = malloc(sizeof(int));
        *arg = i;
        Task t = {example_task, arg};
        queue_push(t);
    }
    
    sleep(2);
    shutdown = 1;
    pthread_cond_broadcast(&q_not_empty);
    pthread_cond_broadcast(&q_not_full);
    
    for (int i = 0; i < POOL_SIZE; i++) {
        pthread_join(pool[i], NULL);
    }
    
    printf("All done\n");
    return 0;
}
```

---

## 10.8 Variable Sharing in Threads

```c
int global = 0;           // SHARED (data segment)
static int static_var = 0; // SHARED (data segment)

void *thread_func(void *arg) {
    int local = 1;           // PRIVATE (stack)
    static int static_local = 1; // SHARED (data segment)
    
    // global, static_var, static_local shared across threads
    // local is private to this thread
}
```

| Variable Type | Location | Shared? |
|---------------|----------|---------|
| Global | Data segment | ✅ Yes |
| Static global | Data segment | ✅ Yes |
| Static local | Data segment | ✅ Yes |
| Local (stack) | Stack | ❌ No (per-thread) |
| malloc() heap | Heap | ✅ Yes |
| Thread-local storage | TLS | ❌ No (per-thread) |

---

## 10.9 Complete Exam-Focused Summary

| Concept | Key Points |
|---------|------------|
| **Thread** | Lightweight execution unit sharing process resources |
| **1:1 model** | Modern standard (Linux, Windows, macOS) |
| **Pthreads** | POSIX standard; `pthread_create`, `join`, `exit`, `mutex`, `cond` |
| **Stack-escape bug** | Never pass local stack address to new thread |
| **Join prevents zombies** | Always join non-detached threads |
| **Shared vs Private** | Globals/heap shared; stack/registers/PC private |
| **SCS (System scope)** | Linux default; threads compete globally |
| **Thread pools** | Reuse threads, bound resources, lower latency |
| **Deferred cancellation** | Safe; async cancellation = dangerous |

---

## 10.10 Common Pitfalls

| Pitfall | Wrong | Correct |
|---------|-------|---------|
| Stack-escape | `pthread_create(&tid, NULL, f, &local_var);` | `int *p = malloc(...); pthread_create(..., p);` |
| Missing join | `pthread_create(...);` no join | `pthread_join(tid, NULL);` |
| Mutex not unlocked | `lock(); if (err) return;` | `lock(); if (err) { unlock(); return; } unlock();` |
| Condition without loop | `if (!cond) wait();` | `while (!cond) wait();` |
| Signal before unlock | `signal(); unlock();` | `unlock(); signal();` |
| exit() in thread | `exit(0);` kills all threads | `pthread_exit(NULL);` |
| Detached thread leaks | Create detached, no cleanup | Join OR cleanup handler |

---

## 10.11 Practice Problems

### Problem 1: Race Condition
```c
// counter++ without mutex - trace the race
```
Show how counter gets wrong value.

### Problem 2: Condition Variable
```c
// Producer-consumer with bounded buffer using cond vars
```
Write complete code.

### Problem 3: Thread Pool
```c
// Submit 100 tasks to 4-thread pool
```
Implement queue and workers.

### Problem 4: Cancellation
```c
// Long-running thread that can be cancelled safely
```
Use deferred cancellation with cleanup handlers.

### Problem 5: Thread-Local Storage
```c
// Each thread needs its own error buffer
```
Use `__thread` or `pthread_key_create`.

---

*Next: Topic 9 (IPC — Shared Memory & Message Passing)*