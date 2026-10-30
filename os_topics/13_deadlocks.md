# Topic 13: Deadlocks — Characterization, Prevention, Avoidance

**Source**: Lecture 11 (Unit 2) + Textbook Ch. 9 (Silberschatz Ch. 7, Stallings Ch. 6, Stevens & Rago Ch. 10)

---

## 13.1 Deadlock Definition

> **Deadlock**: Two or more waiting processes unable to change state because the resources they requested are held by other waiting processes. [Silberschatz §7.1]

```
P1 holds A, needs B
P2 holds B, needs A
Neither can proceed. Neither will release. Forever.
```

### System Model
- Resource types: R₁, R₂, ..., Rₘ
- Each type Rᵢ has Wᵢ instances (e.g., 3 printers = 3 instances)
- Resource types: Physical (CPU, memory, I/O) + Logical (semaphores, mutexes, DB records)

### Resource Utilization Lifecycle
```
Request → Use → Release
```

---

## 13.2 Four Coffman Conditions

| # | Condition | Meaning | Preventable? |
|---|-----------|---------|--------------|
| 1 | **Mutual Exclusion** | Resource non-shareable (printer, mutex) | ❌ Hard (hardware reality) |
| 2 | **Hold and Wait** | Hold some, request more | ✅ Yes |
| 3 | **No Preemption** | Can't forcibly take resources | ✅ Sometimes |
| 4 | **Circular Wait** | P₀→P₁→...→Pₙ→P₀ | ✅ Yes (standard method) |

**Deadlock iff all 4 true simultaneously.**

> **Silberschatz**: "A deadlock situation can arise if and only if the following four conditions hold simultaneously..." [§7.3]

---

## 13.3 Deadlock vs Starvation

| Aspect | Starvation | Deadlock |
|--------|------------|----------|
| **Definition** | Process waits indefinitely due to higher-priority tasks | Circular dependency of waiting threads |
| **Resolution** | Can end if load subsides | **Cannot end** without external intervention |
| **Relationship** | All deadlocked processes are starved | Not all starved processes are deadlocked |

---

## 13.4 Resource-Allocation Graph (RAG)

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

> **Silberschatz**: "If the resource-allocation graph contains no cycles, then the system is not deadlocked. If the graph contains a cycle, then the system may be deadlocked." [§7.4.2]

---

## 13.5 Four Handling Strategies

| Strategy | Approach | Used In Practice? |
|----------|----------|-------------------|
| **Prevention** | Negate one Coffman condition | Partial (circular wait) |
| **Avoidance** | Banker's Algorithm — stay in safe states | Rare (needs max claims) |
| **Detection** | Periodic check + recovery | Databases, distributed systems |
| **Ostrich** | Ignore it | **Linux, Windows, most OSes** |

---

## 13.6 Deadlock Prevention (Negate One Condition)

| Condition | Prevention Method | Drawback |
|-----------|-------------------|----------|
| **Mutual Exclusion** | Make all resources shareable | Impossible for printers, mutexes |
| **Hold and Wait** | Request ALL at once, OR release all before new request | Low utilization, starvation |
| **No Preemption** | If request fails, force-release ALL held | Only works for saveable state (memory, CPU) |
| **Circular Wait** | **Global resource ordering** — request only in increasing order | **Standard practical method** |

### Resource Ordering (The Practical One)
```
Assign numbers: Disk=1, Printer=2, Tape=3, Network=4

Process can request: Disk → Printer ✅
Process CANNOT request: Printer → Disk ❌ (would create cycle)
```

**Proof**: Cycle requires `F(R₀) < F(R₁) < ... < F(R₀)` — mathematical impossibility.

> **Silberschatz**: "We can prevent deadlock by ensuring that at least one of the four necessary conditions cannot hold." [§7.6]

---

## 13.7 Deadlock Detection

### Wait-For Graph (Single-Instance Resources)
Collapse RAG by removing resource nodes:
```
RAG: P1 → R1 → P2 → R2 → P1
WFG: P1 → P2 → P1  (cycle = deadlock)
```

**Algorithm**: DFS cycle detection, O(n²) — run periodically.

---

## 13.8 Deadlock Avoidance & Safe States

### Key Insight
**Avoidance ≠ Prevention.**
- Prevention = never allow conditions
- Avoidance = dynamically check before each grant

### Safe State
> There exists a **safe sequence** `<P₁, P₃, P₄, P₀, P₂>` where each process can get its max needs, finish, and release resources for the next.

```
Safe State          Unsafe State          Deadlock
    │                    │                    │
    ├─ All can finish   ├─ Some might finish  └─ None can finish
    │                    │                    │
    ▼                    ▼                    ▼
No deadlock         Deadlock possible      Deadlock actual
```

**Avoidance Rule**: Only grant request if resulting state is **Safe**.

---

## 13.9 Banker's Algorithm (Dijkstra)

### Data Structures (n processes, m resource types)

| Structure | Size | Meaning |
|-----------|------|---------|
| `Available[m]` | Vector | Free instances of each resource |
| `Max[n][m]` | Matrix | Max demand of each process |
| `Allocation[n][m]` | Matrix | Currently held by each process |
| `Need[n][m]` | Matrix | `Max - Allocation` (remaining need) |

---

### Safety Algorithm (Is Current State Safe?)

```python
Work = Available[:]
Finish = [False] * n

while True:
    # Find process that can finish with current Work
    found = False
    for i in range(n):
        if not Finish[i] and Need[i] <= Work:  # element-wise
            Work = Work + Allocation[i]         # they finish, release
            Finish[i] = True
            found = True
            break
    if not found:
        break

return all(Finish)  # True = SAFE
```

---

### Resource Request Algorithm (Can Pᵢ Get Request?)

```
Requestᵢ arrives:

1. Requestᵢ ≤ Needᵢ?     → No: error (exceeds claim)
2. Requestᵢ ≤ Available? → No: wait (not enough free)
3. PRETEND to allocate:
   Available -= Requestᵢ
   Allocationᵢ += Requestᵢ
   Needᵢ -= Requestᵢ
4. Run Safety Algorithm:
   If SAFE → Commit (grant)
   If UNSAFE → Rollback, Pᵢ waits
```

---

## 13.10 Complete Numerical Example

### System Setup
- **5 Processes**: P₀, P₁, P₂, P₃, P₄
- **3 Resources**: A(10), B(5), C(7)

### Initial State (T₀)

| Process | Allocation (A B C) | Max (A B C) | Need = Max−Alloc |
|---------|--------------------|-------------|------------------|
| P₀ | 0 1 0 | 7 5 3 | **7 4 3** |
| P₁ | 2 0 0 | 3 2 2 | **1 2 2** |
| P₂ | 3 0 2 | 9 0 2 | **6 0 0** |
| P₃ | 2 1 1 | 2 2 2 | **0 1 1** |
| P₄ | 0 0 2 | 4 3 3 | **4 3 1** |

**Available = Total − ΣAllocation = (10,5,7) − (7,2,5) = (3, 3, 2)**

---

### Safety Check at T₀

```
Work = (3,3,2), Finish = [F,F,F,F,F]

Step 1: P₁ need (1,2,2) ≤ (3,3,2)? YES
        Work = (3,3,2) + (2,0,0) = (5,3,2)
        Finish[1] = T

Step 2: P₃ need (0,1,1) ≤ (5,3,2)? YES
        Work = (5,3,2) + (2,1,1) = (7,4,3)
        Finish[3] = T

Step 3: P₄ need (4,3,1) ≤ (7,4,3)? YES
        Work = (7,4,3) + (0,0,2) = (7,4,5)
        Finish[4] = T

Step 4: P₂ need (6,0,0) ≤ (7,4,5)? YES
        Work = (7,4,5) + (3,0,2) = (10,4,7)
        Finish[2] = T

Step 5: P₀ need (7,4,3) ≤ (10,4,7)? YES
        Work = (10,4,7) + (0,1,0) = (10,5,7)
        Finish[0] = T

ALL TRUE → SAFE STATE ✅
Safe Sequence: ⟨P₁, P₃, P₄, P₂, P₀⟩
```

---

### Scenario A: P₁ Requests (1, 0, 2)

```
Available = (3,3,2), Need₁ = (1,2,2)

1. Request ≤ Need? (1,0,2) ≤ (1,2,2) ✅
2. Request ≤ Available? (1,0,2) ≤ (3,3,2) ✅

PRETEND:
Available' = (2,3,0)
Allocation₁' = (3,0,2)
Need₁' = (0,2,0)

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

Request ≤ Available? (3,3,0) ≤ (2,3,0) ❌ (needs 3 A, only 2 free)

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
Available' = (2,1,0)
Allocation₀' = (0,3,0)
Need₀' = (7,2,3)

Safety with Work=(2,1,0):
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

## 13.11 Summary Table

| Strategy | Approach | Pros | Cons |
|----------|----------|------|------|
| **Prevention** | Negate one Coffman condition | Guaranteed no deadlock | Low utilization, restrictive |
| **Avoidance (Banker's)** | Dynamic safe-state checks | Max utilization, no deadlock | Needs max claims; O(n²m) per request |
| **Detection** | Periodic WFG cycle check | Flexible, no advance info needed | Recovery complex; deadlock occurs first |
| **Ostrich** | Ignore | Simple, no overhead | Deadlocks happen (rare) |

---

## 13.12 When to Use What

| Situation | Best Approach |
|-----------|---------------|
| **General OS** | Ostrich (ignore) — deadlocks rare, recovery via reboot |
| **Database** | Detection + victim rollback (timeout or WFG) |
| **Real-time/Embedded** | Prevention (resource ordering) or Avoidance |
| **Safety-critical** | Avoidance (Banker's) or static analysis |
| **Mutex locks in code** | Prevention: **always acquire in fixed global order** |

---

## 13.13 Key Takeaways

- **4 Coffman conditions** = deadlock iff ALL true [Silberschatz §7.3]
- **RAG cycle theorems** = single vs multi-instance difference [Silberschatz §7.4.2]
- **Banker's Safety Algorithm** = greedy; find any finishable process, add allocation to Work, repeat [Silberschatz §7.9.2]
- **Request Algorithm** = 4 checks → pretend → safety → commit/rollback [Silberschatz §7.9.3]
- **Prevention** = global lock ordering (practical) [Silberschatz §7.6.4]
- **Safe vs Unsafe vs Deadlock** = Venn diagram relationships [Silberschatz §7.8.2]
- **For your code**: Just use **global lock ordering** — prevents circular wait = prevents deadlock

---

## 13.14 Exam-Relevant MCQ Patterns

- **Q62**: Hold and Wait — process holds resource while requesting more
- **Q63**: Eliminate Hold and Wait — request all at once or release before requesting
- **Q64**: `demo_deadlock_prevention.c` — global linear order of locks (first_mutex before second_mutex)
- **Q65**: RAG multi-instance — cycle = necessary but not sufficient
- **Q66**: Banker's Need = Max - Allocation
- **Q67**: Safe state definition — exists sequence where all can finish
- **Q68**: Unsafe ≠ deadlocked; all deadlocked are unsafe
- **Q69**: Wait-for graph — collapse RAG, cycle = deadlock
- **Q70**: Uncatchable signals — SIGKILL, SIGSTOP