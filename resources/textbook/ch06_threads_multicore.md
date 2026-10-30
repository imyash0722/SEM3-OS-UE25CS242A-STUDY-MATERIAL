# Chapter 6: Threads & Multicore Programming

**Textbook References**: [Silberschatz 10e, Ch. 4] • [Stallings 9e, Ch. 4] • [Stevens & Rago 3e, Ch. 11-12]

---

## 6.1 Thread Concept [Silberschatz 10e, §4.1]

### Thread vs Process [Silberschatz 10e, §4.1.1]
| Aspect | Process | Thread |
|--------|---------|--------|
| **Memory** | Isolated address space | Shared (code, data, heap, files) |
| **Private** | PID, address space, FD table | TID, PC, registers, stack, errno |
| **Creation cost** | High (~30× thread) | Low |
| **Context switch** | Slow (~5× thread) | Fast |
| **Protection** | Strong (fault isolates) | None (bug crashes all) |

> **Silberschatz**: "A thread is a basic unit of CPU utilization; it comprises a thread ID, a program counter, a register set, and a stack." [Silberschatz 10e, §4.1.1]

### Thread Structure
```
Thread = (TID, Program Counter, Register Set, Private Stack)
```

### Process Architecture [Silberschatz 10e, Fig. 4.1]
```
SINGLE-THREADED                    MULTITHREADED
┌─────────────────────┐           ┌─────────────────────┐
│ Code | Data | Files │           │ Code | Data | Files │  ← SHARED
├─────────────────────┤           ├─────────────────────┤
│ Registers | Stack   │           │ Regs | Regs | Regs  │
│             │       │           │ Stack|Stack|Stack  │  ← PER-THREAD
└─────────────────────┘           └─────────────────────┘
```

> **Silberschatz Fig. 4.1**: "Single-threaded and multithreaded process architecture" [Silberschatz 10e, Fig. 4.1]

---

## 6.2 Benefits of Multithreading [Silberschatz 10e, §4.2]

| Benefit | Description | [Silberschatz 10e, §4.2] |
|---------|-------------|--------------------------|
| **Responsiveness** | UI stays responsive while background thread computes | |
| **Resource Sharing** | Threads share memory/files automatically — no IPC needed | |
| **Economy** | Thread create ≈ 30× faster than process; context switch ≈ 5× faster | |
| **Scalability** | Threads run on multiple cores simultaneously | |

> **Silberschatz**: "The benefits of multithreading can be broken down into four major categories: responsiveness, resource sharing, economy, and scalability." [Silberschatz 10e, §4.2]

### Real-World Examples [Silberschatz 10e, §4.2]
- **Web Browser**: Network thread, render thread, audio thread, UI thread
- **Word Processor**: Input thread, spell-check thread, autosave thread

---

## 6.3 Multithreading Models [Silberschatz 10e, §4.3; Stallings 9e, §4.3]

| Model | User:Kernel | Parallelism | Blocking Issue | Used By |
|-------|-------------|-------------|----------------|---------|
| **Many-to-One (M:1)** | Many:1 | ❌ No | One blocks → all block | Old Solaris, Green threads |
| **One-to-One (1:1)** | 1:1 | ✅ Yes | No blocking propagation | **Linux, Windows, macOS** |
| **Many-to-Many (M:N)** | Many:Many | ✅ Yes | Flexible multiplexing | Old Solaris |
| **Two-Level (Hybrid)** | Hybrid | ✅ Yes | Critical threads bound 1:1 | IRIX, HP-UX, Solaris 8- |

> **Silberschatz Fig. 4.5-4.8**: "Multithreading models" [Silberschatz 10e, Fig. 4.5-4.8]

```
1:1 Model (Modern Standard):
User:  T1  T2  T3  T4
        │  │  │  │
Kernel: KT1 KT2 KT3 KT4
```

> **Silberschatz**: "The one-to-one model is the most common model used in modern operating systems." [Silberschatz 10e, §4.3.2]

---

## 6.4 POSIX Pthreads API [Silberschatz 10e, §4.4; Stevens & Rago 3e, Ch. 11]

### Thread Creation [Stevens & Rago 3e, §11.3]
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

> **Stevens & Rago**: "The pthread_create() function creates a new thread of control that executes concurrently with the calling thread." [Stevens & Rago 3e, §11.3]

### Critical: Stack-Escape Bug [Stevens & Rago 3e, §11.3]
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

### Thread Join — Synchronization & Cleanup [Stevens & Rago 3e, §11.4]
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
// Fork-Join Pattern [Silberschatz 10e, Fig. 4.3]
pthread_t threads[N];
for (int i = 0; i < N; i++)
    pthread_create(&threads[i], NULL, worker, &args[i]);

for (int i = 0; i < N; i++)
    pthread_join(threads[i], &results[i]);  // Collect results
```

> **Silberschatz Fig. 4.3**: "Fork-join parallel pattern" [Silberschatz 10e, Fig. 4.3]

---

### `pthread_exit()` vs `exit()` vs `return` in `main()` [Stevens & Rago 3e, §11.4]

| Call | Effect |
|------|--------|
| `pthread_exit(val)` | **Current thread only** dies; process lives if other threads exist |
| `return val` in thread func | Same as `pthread_exit(val)` |
| `exit(val)` or `return` in `main()` | **Entire process dies** — all threads killed instantly |
| `pthread_exit()` in `main()` | Main thread dies, **other threads keep running** |

---

## 6.5 Thread Attributes & Synchronization [Silberschatz 10e, §4.4; Stevens & Rago 3e, §11.5]

### Scheduling Scopes [Silberschatz 10e, §4.4.2]
| Scope | Model | Behavior |
|-------|-------|----------|
| **PCS (Process-Contention)** | M:1, M:N | User-level library schedules; competition within process only |
| **SCS (System-Contention)** | 1:1 | Kernel schedules directly on CPUs; competition system-wide |

```c
pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setscope(&attr, PTHREAD_SCOPE_SYSTEM);  // Linux default
```

> **Silberschatz**: "The contention scope defines the set of threads against which a thread competes for CPU time." [Silberschatz 10e, §4.4.2]

### Mutex (Mutual Exclusion Lock) [Stevens & Rago 3e, §11.6]
```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_lock(&lock);   // Blocks if busy
// CRITICAL SECTION
pthread_mutex_unlock(&lock); // Must be called by owner
```

### Condition Variables (Wait for Predicate) [Stevens & Rago 3e, §11.7]
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

## 6.6 Thread Cancellation [Stevens & Rago 3e, §11.8]

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

## 6.7 Thread Pools [Silberschatz 10e, §4.5]

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

> **Silberschatz**: "A thread pool provides a more efficient way to manage threads... it reduces the overhead of creating and destroying threads." [Silberschatz 10e, §4.5]

---

## 6.8 Key Takeaways
- **Thread** = lightweight execution unit sharing process resources [Silberschatz 10e, §4.1]
- **1:1 model** = modern standard (Linux, Windows, macOS) [Silberschatz 10e, §4.3.2]
- **Pthreads** = POSIX standard; `pthread_create`, `join`, `exit`, `mutex`, `cond` [Stevens & Rago 3e, Ch. 11]
- **Stack-escape bug** = never pass local stack address to new thread [Stevens & Rago 3e, §11.3]
- **Join prevents zombies** = always join non-detached threads [Stevens & Rago 3e, §11.4]
- **Shared vs Private** = globals/heap shared; stack/registers/PC private [Silberschatz 10e, §4.2]
- **SCS (System scope)** = Linux default; threads compete globally [Silberschatz 10e, §4.4.2]
- **Thread pools** = reuse threads, bound resources, lower latency [Silberschatz 10e, §4.5]
- **Deferred cancellation** = safe; async cancellation = dangerous [Stevens & Rago 3e, §11.8]

---

**Further Reading**: [Silberschatz 10e, Ch. 4] • [Stallings 9e, Ch. 4] • [Stevens & Rago 3e, Ch. 11-12]