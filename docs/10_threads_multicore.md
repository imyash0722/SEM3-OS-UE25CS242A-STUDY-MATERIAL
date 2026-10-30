# Topic 10: Threads & Multicore Programming

**Source**: Lecture 2 & 4 (Unit 2) + Textbook Ch. 6 (Silberschatz Ch. 4, Stallings Ch. 4, Stevens & Rago Ch. 11-12)

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

## 10.8 Key Takeaways

- **Thread** = lightweight execution unit sharing process resources [Silberschatz §4.1]
- **1:1 model** = modern standard (Linux, Windows, macOS) [Silberschatz §4.3.2]
- **Pthreads** = POSIX standard; `pthread_create`, `join`, `exit`, `mutex`, `cond` [Stevens & Rago Ch. 11]
- **Stack-escape bug** = never pass local stack address to new thread [Stevens & Rago §11.3]
- **Join prevents zombies** = always join non-detached threads [Stevens & Rago §11.4]
- **Shared vs Private** = globals/heap shared; stack/registers/PC private [Silberschatz §4.2]
- **SCS (System scope)** = Linux default; threads compete globally [Silberschatz §4.4.2]
- **Thread pools** = reuse threads, bound resources, lower latency [Silberschatz §4.5]
- **Deferred cancellation** = safe; async cancellation = dangerous [Stevens & Rago §11.8]

---

## 10.9 Exam-Relevant MCQ Patterns

- **Q36**: Thread vs process — threads share heap, globals, files; private: PC, registers, stack
- **Q37**: M:1 vulnerability — one blocking syscall blocks entire process
- **Q38**: 1:1 advantage — true multicore parallelism, blocking doesn't halt others
- **Q39**: M:N — multiplexes user threads onto fewer kernel threads
- **Q40**: Amdahl's Law — S=0.20, N=4 → speedup=2.5x; max=5x
- **Q41**: `demo_threads.c` — local=1 always; static/global accumulate across threads
- **Q42**: `pthread_join()` — blocks parent until worker done, prevents race on shared results
- **Q43**: Pipe descriptors — parent closes `fd[0]`, child closes `fd[1]`
- **Q44**: Ordinary pipe — unidirectional, requires shared ancestry
- **Q45**: FIFO vs pipe — FIFO has filesystem path, unrelated processes
- **Q46**: Shared memory fastest — zero kernel copy after setup
- **Q47**: Message passing — kernel syscall per message, slower but distributed
- **Q48**: Socket = IP + Port
- **Q49**: Race condition definition
- **Q50**: Critical section 3 requirements — Mutual Exclusion, Progress, Bounded Waiting
- **Q51**: Peterson's variables — `turn` + `flag[2]`
- **Q52**: `test_and_set` — returns original, sets to true
- **Q53**: `compare_and_swap` — if equal, sets new; returns original
- **Q54**: Mutex vs semaphore — mutex has ownership; semaphore no ownership
- **Q55**: Spinlock effective on multiprocessor for short CS — avoids context switch overhead
- **Q56**: `sem_init(&mutex, 0, 1)` — 2nd arg 0 = thread-shared; 3rd = binary semaphore
- **Q57**: `demo_semaphore_2.c` vs `3.c` — without sync: interleaved; with: mutual exclusion
- **Q58**: Producer-consumer semaphores — mutex=1, empty=N, full=0
- **Q59**: Wrong order `wait(mutex); wait(empty)` → DEADLOCK when buffer full
- **Q60**: Readers-writers — reader preference starves writers
- **Q61**: Dining philosophers — asymmetric pickup (odd left→right, even right→left)
- **Q62**: Hold and Wait — process holds resource while requesting more
- **Q63**: Eliminate Hold and Wait — request all at once, or release before requesting
- **Q64**: Deadlock prevention — global linear lock ordering
- **Q65**: RAG multi-instance — cycle = necessary but not sufficient
- **Q66**: Banker's Need = Max - Allocation
- **Q67**: Safe state — exists sequence where all can finish
- **Q68**: Unsafe ≠ deadlocked; all deadlocked are unsafe
- **Q69**: Wait-for graph — collapse RAG, cycle = deadlock
- **Q70**: Uncatchable signals — SIGKILL, SIGSTOP