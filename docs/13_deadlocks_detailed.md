# Topic 13 (Detailed): Deadlocks — Complete Banker's Algorithm, Prevention, Detection

**Source**: Lecture 11 (Unit 2) + Textbook Ch. 7 (Silberschatz Ch. 7, Stallings Ch. 6, Stevens & Rago Ch. 10)

---

## 13.1 Deadlock Definition

> **Deadlock**: A set of processes is deadlocked if each process in the set is waiting for an event that only another process in the set can cause.

```
P1 holds A, needs B
P2 holds B, needs A
Neither can proceed. Neither will release. Forever.
```

### System Model
- Resource types: R₁, R₂, ..., Rₘ
- Each type Rᵢ has Wᵢ instances
- Processes request → use → release resources

---

## 13.2 Four Coffman Conditions (Deadlock IFF All 4 True)

| # | Condition | Meaning | Preventable? |
|---|-----------|---------|--------------|
| 1 | **Mutual Exclusion** | Resource non-shareable (printer, mutex) | ❌ Hard (hardware) |
| 2 | **Hold and Wait** | Hold some, request more | ✅ Yes |
| 3 | **No Preemption** | Can't forcibly take resources | ✅ Sometimes |
| 4 | **Circular Wait** | P₀→P₁→...→Pₙ→P₀ | ✅ **Standard method** |

**Deadlock iff all 4 hold simultaneously.**

---

## 13.3 Resource-Allocation Graph (RAG)

### Notation

| Element | Symbol | Meaning |
|---------|--------|---------|
| Process | Circle (○) | P₁, P₂, ... |
| Resource | Rectangle with dots | R₁, R₂, ... (dots = instances) |
| Request Edge | Pᵢ → Rⱼ | Process Pᵢ requests Rⱼ |
| Assignment Edge | Rⱼ → Pᵢ | Instance of Rⱼ allocated to Pᵢ |

### Cycle Theorems

| Graph Has | Single-Instance Resources | Multi-Instance Resources |
|-----------|---------------------------|--------------------------|
| **No cycle** | ✅ No deadlock | ✅ No deadlock |
| **Cycle** | ❌ **Deadlock guaranteed** | ⚠️ **Possible deadlock** |

```
Single-instance cycle = Deadlock:
P1 ──► R1 ──► P2 ──► R2 ──► P1

Multi-instance cycle = Possible deadlock:
P1 ──► R1 (2 instances) ──► P2
     │                    │
     ▼                    ▼
   P3 ◄──── R2 (1 instance) ◄── P4
```

---

## 13.3 Banker's Algorithm (Dijkstra) — Complete Walkthrough

### Data Structures

| Structure | Size | Meaning |
|-----------|------|---------|
| `Available[m]` | Vector | Free instances of each resource |
| `Max[n][m]` | Matrix | Max demand of each process |
| `Allocation[n][m]` | Matrix | Currently held by each process |
| `Need[n][m]` | Matrix | `Max - Allocation` (remaining need) |

---

### Complete Numerical Example (From Slides)

**System**: 5 Processes (P0-P4), 3 Resources A(10), B(5), C(7)

#### Initial State (T₀)

| Process | Allocation (A B C) | Max (A B C) | **Need = Max - Alloc** |
|---------|--------------------|-------------|------------------------|
| P₀ | 0 1 0 | 7 5 3 | **7 4 3** |
| P₁ | 2 0 0 | 3 2 2 | **1 2 2** |
| P₂ | 3 0 2 | 9 0 2 | **6 0 0** |
| P₃ | 2 1 1 | 2 2 2 | **0 1 1** |
| P₄ | 0 0 2 | 4 3 3 | **4 3 1** |

**Available** = Total - ΣAllocation = (10,5,7) - (7,2,5) = **(3, 3, 2)**

---

### Safety Algorithm (Is Current State Safe?)

```python
Work = Available[:]           # (3,3,2)
Finish = [False] * n          # [F,F,F,F,F]

while True:
    found = False
    for i in range(n):
        if not Finish[i] and Need[i] <= Work:  # Element-wise comparison
            Work = Work + Allocation[i]        # They finish, release
            Finish[i] = True
            found = True
            break
    if not found:
        break

return all(Finish)  # True = SAFE
```

#### Step-by-Step Trace

```
Step 1: Work=(3,3,2), Finish=[F,F,F,F,F]
        P₁: Need=(1,2,2) ≤ (3,3,2)? YES
        Work = (3,3,2) + (2,0,0) = (5,3,2)
        Finish[1]=T

Step 2: Work=(5,3,2), Finish=[F,T,F,F,F]
        P₃: Need=(0,1,1) ≤ (5,3,2)? YES
        Work = (5,3,2) + (2,1,1) = (7,4,3)
        Finish[3]=T

Step 3: Work=(7,4,3), Finish=[F,T,F,T,F]
        P₄: Need=(4,3,1) ≤ (7,4,3)? YES
        Work = (7,4,3) + (0,0,2) = (7,4,5)
        Finish[4]=T

Step 4: Work=(7,4,5), Finish=[F,T,F,T,T]
        P₂: Need=(6,0,0) ≤ (7,4,5)? YES
        Work = (7,4,5) + (3,0,2) = (10,4,7)
        Finish[2]=T

Step 5: Work=(10,4,7), Finish=[F,T,T,T,T]
        P₀: Need=(7,4,3) ≤ (10,4,7)? YES
        Work = (10,4,7) + (0,1,0) = (10,5,7)
        Finish[0]=T

ALL TRUE → SAFE STATE ✅
Safe Sequence: ⟨P₁, P₃, P₄, P₂, P₀⟩
```

---

### Resource Request Algorithm

```
Requestᵢ arrives for Request vector:

1. Requestᵢ ≤ Needᵢ?     → No: Error (exceeds claim)
2. Requestᵢ ≤ Available? → No: Wait (insufficient free)
3. PRETEND to allocate:
   Available  -= Requestᵢ
   Allocationᵢ += Requestᵢ
   Needᵢ      -= Requestᵢ
4. Run Safety Algorithm:
   If SAFE   → Commit (grant request)
   If UNSAFE → Rollback, Pᵢ waits
```

---

### Scenario A: P₁ Requests (1, 0, 2)

```
Available = (3,3,2), Need₁ = (1,2,2)

1. (1,0,2) ≤ (1,2,2)? YES
2. (1,0,2) ≤ (3,3,2)? YES

PRETEND:
Available'  = (2,3,0)
Allocation₁' = (3,0,2)
Need₁'      = (0,2,0)

Run Safety with Work=(2,3,0):
  P₁: (0,2,0) ≤ (2,3,0) ✅ → Work=(5,3,2)
  P₃: (0,1,1) ≤ (5,3,2) ✅ → Work=(7,4,3)
  P₄: (4,3,1) ≤ (7,4,3) ✅ → Work=(7,4,5)
  P₀: (7,4,3) ≤ (7,4,5) ✅ → Work=(7,5,5)
  P₂: (6,0,0) ≤ (7,5,5) ✅ → Work=(10,5,7)

SAFE → GRANT ✅
```

---

### Scenario B: P₄ Requests (3, 3, 0)

```
Available = (2,3,0)  (after Scenario A)
Request₄ = (3,3,0)

Request ≤ Available? (3,3,0) ≤ (2,3,0)? ❌ (needs 3 A, only 2 free)

DENY → P₄ waits
```

---

### Scenario C: P₀ Requests (0, 2, 0)

```
Available = (2,3,0)
Request₀ = (0,2,0)

1. (0,2,0) ≤ (7,4,3) ✅
2. (0,2,0) ≤ (2,3,0) ✅

PRETEND:
Available'   = (2,1,0)
Allocation₀' = (0,3,0)
Need₀'       = (7,2,3)

Run Safety with Work=(2,1,0):
  P₀: (7,2,3) ≤ (2,1,0) ❌
  P₁: (0,2,0) ≤ (2,1,0) ❌ (B: 2>1)
  P₂: (6,0,0) ≤ (2,1,0) ❌ (A: 6>2)
  P₃: (0,1,1) ≤ (2,1,0) ❌ (C: 1>0)
  P₄: (4,3,1) ≤ (2,1,0) ❌

NO PROCESS CAN FINISH → UNSAFE ❌

ROLLBACK → DENY → P₀ waits
```

**Key Insight**: Even though resources exist, granting this request traps the system where **no process can ever complete** — unsafe state.

---

## 13.4 Banker's Algorithm Implementation

```c
/*
 * File: bankers_algorithm.c
 * Complete Banker's Algorithm implementation
 * Compile: gcc -o bankers bankers_algorithm.c
 */

#include <stdio.h>
#include <stdbool.h>
#include <string.h>

#define MAX_PROCESSES 10
#define MAX_RESOURCES 5

typedef struct {
    int max[MAX_RESOURCES];
    int allocation[MAX_RESOURCES];
    int need[MAX_RESOURCES];
} Process;

int n_processes, n_resources;
int available[MAX_RESOURCES];
Process processes[MAX_PROCESSES];

void print_state(const char *title) {
    printf("\n=== %s ===\n", title);
    printf("Available: ");
    for (int j = 0; j < n_resources; j++) printf("%d ", available[j]);
    printf("\n\n");
    
    printf("%-8s %-20s %-20s %-20s\n", "Process", "Max", "Allocation", "Need");
    for (int i = 0; i < n_processes; i++) {
        printf("P%-7d ", i);
        for (int j = 0; j < n_resources; j++) printf("%d ", processes[i].max[j]);
        printf("     ");
        for (int j = 0; j < n_resources; j++) printf("%d ", processes[i].allocation[j]);
        printf("     ");
        for (int j = 0; j < n_resources; j++) printf("%d ", processes[i].need[j]);
        printf("\n");
    }
}

bool vector_leq(int a[], int b[], int n) {
    for (int i = 0; i < n; i++) if (a[i] > b[i]) return false;
    return true;
}

void vector_add(int a[], int b[], int n) {
    for (int i = 0; i < n; i++) a[i] += b[i];
}

void vector_sub(int a[], int b[], int n) {
    for (int i = 0; i < n; i++) a[i] -= b[i];
}

bool safety_check(int work[], bool finish[]) {
    // Find a process that can finish
    for (int i = 0; i < n_processes; i++) {
        if (!finish[i] && vector_leq(processes[i].need, work, n_resources)) {
            // Process i can finish
            vector_add(work, processes[i].allocation, n_resources);
            finish[i] = true;
            return true;
        }
    }
    return false;
}

bool is_safe_state() {
    int work[MAX_RESOURCES];
    bool finish[MAX_PROCESSES] = {false};
    
    memcpy(work, available, n_resources * sizeof(int));
    
    // Try to find safe sequence
    for (int count = 0; count < n_processes; count++) {
        if (!safety_check(work, finish)) {
            return false;  // No process can finish, unsafe
        }
    }
    return true;
}

bool request_resources(int pid, int request[]) {
    printf("\n=== Request from P%d ===\n", pid);
    for (int j = 0; j < n_resources; j++) printf("%d ", request[j]);
    printf("\n");
    
    // Check 1: Request ≤ Need
    if (!vector_leq(request, processes[pid].need, n_resources)) {
        printf("DENIED: Request exceeds Need\n");
        return false;
    }
    
    // Check 2: Request ≤ Available
    if (!vector_leq(request, available, n_resources)) {
        printf("DENIED: Request exceeds Available (must wait)\n");
        return false;
    }
    
    // PRETEND to allocate
    int saved_available[MAX_RESOURCES];
    int saved_allocation[MAX_RESOURCES];
    int saved_need[MAX_RESOURCES];
    
    memcpy(saved_available, available, n_resources * sizeof(int));
    memcpy(saved_allocation, processes[pid].allocation, n_resources * sizeof(int));
    memcpy(saved_need, processes[pid].need, n_resources * sizeof(int));
    
    vector_sub(available, request, n_resources);
    vector_add(processes[pid].allocation, request, n_resources);
    vector_sub(processes[pid].need, request, n_resources);
    
    // Check safety
    if (is_safe_state()) {
        printf("GRANTED: Safe state\n");
        return true;
    } else {
        printf("DENIED: Would lead to unsafe state\n");
        // Rollback
        memcpy(available, saved_available, n_resources * sizeof(int));
        memcpy(processes[pid].allocation, saved_allocation, n_resources * sizeof(int));
        memcpy(processes[pid].need, saved_need, n_resources * sizeof(int));
        return false;
    }
}

void compute_need() {
    for (int i = 0; i < n_processes; i++) {
        for (int j = 0; j < n_resources; j++) {
            processes[i].need[j] = processes[i].max[j] - processes[i].allocation[j];
        }
    }
}

int main() {
    // System from slides: 5 processes, 3 resources
    n_processes = 5;
    n_resources = 3;
    
    // Total resources: A=10, B=5, C=7
    int total[] = {10, 5, 7};
    
    // Initial state from slides
    Process init[] = {
        {{7,5,3}, {0,1,0}, {0}},
        {{3,2,2}, {2,0,0}, {0}},
        {{9,0,2}, {3,0,2}, {0}},
        {{2,2,2}, {2,1,1}, {0}},
        {{4,3,3}, {0,0,2}, {0}},
    };
    
    for (int i = 0; i < n_processes; i++) {
        processes[i] = init[i];
        for (int j = 0; j < n_resources; j++) {
            processes[i].need[j] = processes[i].max[j] - processes[i].allocation[j];
        }
    }
    
    // Available = Total - Sum(Allocation)
    for (int j = 0; j < n_resources; j++) {
        int sum = 0;
        for (int i = 0; i < n_processes; i++) sum += processes[i].allocation[j];
        available[j] = total[j] - sum;
    }
    
    print_state("INITIAL STATE");
    
    // Test initial safety
    printf("Initial state is %s\n", is_safe_state() ? "SAFE" : "UNSAFE");
    
    // Scenario A: P1 requests (1,0,2)
    int req1[] = {1, 0, 2};
    request_resources(1, req1);
    print_state("AFTER P1 REQUEST (1,0,2)");
    
    // Scenario B: P4 requests (3,3,0)
    int req2[] = {3, 3, 0};
    request_resources(4, req2);
    print_state("AFTER P4 REQUEST (3,3,0) - should be denied");
    
    // Scenario C: P0 requests (0,2,0)
    int req3[] = {0, 2, 0};
    request_resources(0, req3);
    print_state("AFTER P0 REQUEST (0,2,0) - should be denied");
    
    return 0;
}
```

**Compile & Run:**
```bash
gcc -o bankers bankers_algorithm.c
./bankers
```

---

## 13.5 Deadlock Prevention Strategies

### Negating Each Coffman Condition

| Condition | Prevention Method | Drawback |
|-----------|-------------------|----------|
| **Mutual Exclusion** | Make all resources shareable | Impossible for printers, mutexes |
| **Hold and Wait** | Request ALL at once, OR release all before new request | Low utilization, starvation |
| **No Preemption** | If request fails, force-release ALL held | Only works for saveable state |
| **Circular Wait** | **Global resource ordering** | **Standard practical method** |

### Resource Ordering (The Practical One)

```c
/*
 * File: deadlock_prevention.c
 * Global linear lock ordering prevents circular wait
 */

#include <pthread.h>
#include <stdio.h>

// Resources assigned numbers:
#define LOCK_DISK     1
#define LOCK_PRINTER  2
#define LOCK_TAPE     3
#define LOCK_NETWORK  4

pthread_mutex_t locks[5];  // Index by resource number

// RULE: Always acquire locks in INCREASING order
void safe_operation_1() {
    pthread_mutex_lock(&locks[LOCK_DISK]);
    pthread_mutex_lock(&locks[LOCK_PRINTER]);
    // ... work ...
    pthread_mutex_unlock(&locks[LOCK_PRINTER]);
    pthread_mutex_unlock(&locks[LOCK_DISK]);
}

void safe_operation_2() {
    pthread_mutex_lock(&locks[LOCK_PRINTER]);
    pthread_mutex_lock(&locks[LOCK_TAPE]);
    // ... work ...
    pthread_mutex_unlock(&locks[LOCK_TAPE]);
    pthread_mutex_unlock(&locks[LOCK_PRINTER]);
}

// VIOLATION: Would create cycle
void unsafe_operation() {
    pthread_mutex_lock(&locks[LOCK_PRINTER]);
    pthread_mutex_lock(&locks[LOCK_DISK]);  // WRONG ORDER!
    // ...
}

int main() {
    for (int i = 1; i <= 4; i++) pthread_mutex_init(&locks[i], NULL);
    
    // Test safe operations
    pthread_t t1, t2;
    pthread_create(&t1, NULL, (void*)safe_operation_1, NULL);
    pthread_create(&t2, NULL, (void*)safe_operation_2, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    
    for (int i = 1; i <= 4; i++) pthread_mutex_destroy(&locks[i]);
    return 0;
}
```

**Proof**: Cycle requires `F(R₀) < F(R₁) < ... < F(R₀)` — mathematical impossibility.

---

## 13.6 Deadlock Detection

### Wait-For Graph (Single-Instance Resources)

```c
/*
 * Collapse RAG by removing resource nodes:
 * RAG: P1 → R1 → P2 → R2 → P1
 * WFG: P1 → P2 → P1  (cycle = deadlock)
 */

// Detection: DFS cycle detection in WFG
// O(n²) - run periodically
```

---

## 13.7 Recovery Methods

| Method | Description |
|--------|-------------|
| **Process Termination** | Abort all deadlocked, or one by one until cycle breaks |
| **Resource Preemption** | Steal resources from deadlocked processes, rollback |
| **Checkpoint/Rollback** | Periodic state save; on deadlock, rollback to checkpoint |

---

## 13.8 Summary Table

| Strategy | Approach | Pros | Cons |
|----------|----------|------|------|
| **Prevention** | Negate one condition | Guaranteed no deadlock | Low utilization, restrictive |
| **Avoidance (Banker's)** | Dynamic safe-state checks | Max utilization, no deadlock | Needs max claims; O(n²m) per request |
| **Detection** | Periodic WFG cycle check | Flexible, no advance info | Recovery complex; deadlock occurs first |
| **Ostrich** | Ignore | Simple, no overhead | Deadlocks happen (rare) |

---

## 13.9 When to Use What

| Situation | Best Approach |
|-----------|---------------|
| **General OS** | Ostrich (ignore) — deadlocks rare, recovery via reboot |
| **Database** | Detection + victim rollback (timeout or WFG) |
| **Real-time/Embedded** | Prevention (resource ordering) or Avoidance |
| **Safety-critical** | Avoidance (Banker's) or static analysis |
| **Mutex locks in code** | **Global lock ordering** — prevents circular wait |

---

## 13.10 For Your Code: Just Use Global Lock Ordering

```c
// Assign numbers to every mutex in your program:
#define MUTEX_DB      1
#define MUTEX_CACHE   2
#define MUTEX_LOG     3
#define MUTEX_CONFIG  4

// RULE: Always lock in increasing order
pthread_mutex_lock(&mutexes[MUTEX_DB]);
pthread_mutex_lock(&mutexes[MUTEX_CACHE]);
// ... critical section ...
pthread_mutex_unlock(&mutexes[MUTEX_CACHE]);
pthread_mutex_unlock(&mutexes[MUTEX_DB]);

// NEVER do this (creates potential cycle):
pthread_mutex_lock(&mutexes[MUTEX_CACHE]);
pthread_mutex_lock(&mutexes[MUTEX_DB]);
```

---

## 13.11 Exam-Focused MCQ Patterns

| Question | Key Answer |
|----------|------------|
| **4 Coffman conditions** | Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait |
| **RAG single-instance cycle** | Deadlock guaranteed |
| **RAG multi-instance cycle** | Deadlock possible (not guaranteed) |
| **Banker's Need** | Max - Allocation |
| **Safe state** | Exists sequence where all can finish |
| **Unsafe vs deadlock** | Unsafe ≠ deadlock; all deadlocked are unsafe |
| **Wait-for graph** | Collapse RAG; cycle = deadlock |
| **Uncatchable signals** | SIGKILL, SIGSTOP |

---

*Next: Topic 21 (Page Replacement) with complete FIFO/LRU/OPT/Clock traces*