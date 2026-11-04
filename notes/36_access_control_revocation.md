# Topic 36: Access Control & Revocation of Access Rights

**Source**: Lecture 4.12 (Unit 4) + Textbook Ch. 14 (Silberschatz Ch. 14, Stallings Ch. 14)

---

## 36.1 Access Control Fundamentals

### Definition
- **Access Control** = Mechanism determining **who** can access **what** and **how**
- OS uses protection mechanisms to control access to files, devices, objects

### Access Control Flow
```
User/Process → Access Request → Security Check → Allow/Deny
```

### Key Components
| Component | Role |
|---------|------|
| **Subject** | User/Process/Domain requesting access |
| **Object** | Resource (file, device, memory) |
| **Operation** | Read, Write, Execute, Delete, etc. |
| **Policy** | Rules governing access |

---

## 36.2 Revocation of Access Rights

### Definition
- **Revocation** = Removing previously granted access rights
- Required in **dynamic protection systems** where access changes over time

### Example
```
Before Revocation:
Faculty → File F1 → Read + Write

After Revocation:
Faculty → File F1 → Read (Write removed)
```

---

## 36.2 Why Revocation is Needed

| Reason | Description |
|--------|-------------|
| **Role Change** | User's responsibilities change |
| **No Longer Needed** | User no longer requires access |
| **Increased Restriction** | Resource becomes more sensitive |
| **Expiration** | Temporary access expires |
| **Admin Action** | Admin withdraws permissions |

---

## 36.3 Types of Revocation

| Classification | Types | Description |
|----------------|-------|-------------|
| **Timing** | Immediate / Delayed | Instant vs scheduled |
| **Scope** | Selective / General | Specific user vs all users |
| **Extent** | Partial / Total | Some rights vs all rights |
| **Duration** | Temporary / Permanent | Time-limited vs permanent |

---

## 36.3 Revocation Dimensions

| Dimension | Types | Description |
|-----------|-------|-------------|
| **Timing** | Immediate / Delayed | Instant vs scheduled |
| **Scope** | Selective / General | Specific user vs all users |
| **Extent** | Partial / Total | Some rights vs all rights |
| **Duration** | Temporary / Permanent | Time-limited vs forever |

---

## 36.4 Revocation with ACL vs Capability

### ACL (Access Control List) — Easy Revocation
| Aspect | Description |
|--------|-------------|
| **Mechanism** | Remove/modify entry in object's ACL |
| **Ease** | ✅ Straightforward |
| **Operations** | Supports all revocation types |

```
ACL(F1): [(D1, rw), (D2, r)]
→ Revoke D2 write: remove (D2, rw) or change to (D2, r)
```

---

### Capability List — Difficult Revocation

| Challenge | Description |
|-----------|-------------|
| **Distribution** | Capabilities scattered across domains |
| **Tracking** | Hard to locate all copies |
| **Revocation** | Must find & modify all copies |

---

## 36.4 Capability Revocation Techniques

| Technique | Mechanism | Pros | Cons |
|----------|-----------|------|------|
| **Reacquisition** | Capabilities expire; re-request on need | Simple; automatic cleanup | Overhead on re-request |
| **Back-Pointers** | Maintain pointers to all capability copies | Complete revocation | Space overhead; pointer maintenance |
| **Indirection** | Access via global table; invalidate table entry | Centralized control | Indirection overhead |
| **Keys** | Capability + key; change key to invalidate | Granular control | Key management overhead |

---

## 36.5 Revocation Techniques Detail

### 1. Reacquisition (Expiration)
```
Capability validity = T
After T → expire → must re-request
Revoked → expiration time = now
```

### 2. Back-Pointers
```
Capability → [back-pointers to all holders]
Revocation → traverse pointers → invalidate all
```

### 3. Indirection (Global Table)
```
Capability → Index in global table
Revocation → Delete/invalidate table entry
All capabilities pointing there → invalid
```

### 4. Keys
```
Capability + Key
Revocation → Change key → Old capability invalid
```

---

## 36.5 Access Matrix Recap

### Structure
| | Object 1 | Object 2 | Object 3 |
|---------|----------|----------|----------|
| **Domain 1** | read | | write |
| **Domain 2** | | read | |
| **Domain 3** | | | execute |

### Components
| Element | Description |
|---------|-------------|
| **Rows** | Domains (subjects/processes) |
| **Columns** | Objects (files, devices) |
| **Cell** | Access rights (read, write, execute, etc.) |

### Example
| | F1 | F2 | F3 | Printer |
|----|----|----|----|--------|
| D1 | read | | read | |
| D2 | | | | print |
| D3 | | read, write | | |
| D4 | read, write | | read, write | |

---

## 36.6 Domain Switching

### Rule
> Process can switch Domain Di → Dj **only if** `switch` right exists in Access Matrix

### Example
| From | Can Switch To |
|------|---------------|
| D1 | D2 |
| D2 | D3, D4 |
| D4 | D1 |

### Special Rights
| Right | Meaning |
|-------|---------|
| **copy** | Duplicate rights to another domain |
| **owner** | Full control over object |
| **control** | Modify other domains' rights |

---

## 36.6 Role-Based Access Control (RBAC)

### Concept
- **Permissions → Roles → Users**
- Role = job function (Admin, Faculty, Student)

### RBAC Structure
```
Users → Roles → Permissions → Objects
```

### Example
| Role | Permissions |
|------|-------------|
| **Admin** | read, write, delete |
| **Faculty** | read, write |
| **Student** | read only |

### User Assignment
```
User 1 → Faculty Role → read, write
User 2 → Student Role → read only
```

### Advantages
| Benefit | Description |
|---------|-------------|
| **Simplicity** | Manage roles, not users |
| **Flexibility** | Change role → all users updated |
| **Security** | No direct permission assignment |
| **Scalability** | Handles large systems |

### Limitation
| Issue | Description |
|-------|-------------|
| **Role Explosion** | Too many roles → complexity |
| **Design Effort** | Requires careful role engineering |

---

## 36.7 Key Takeaways

1. **Access Control** = Who → What → How (Subject, Object, Operation)
2. **Revocation** = Remove granted rights; needed for dynamic systems
3. **Revocation Types** = Immediate/Delayed, Selective/General, Partial/Total, Temporary/Permanent
4. **ACL** = Easy revocation (modify object's list)
5. **Capability** = Hard revocation (distributed copies)
6. **Revocation Techniques** = Reacquisition, Back-pointers, Indirection, Keys
6. **RBAC** = Permissions→Roles→Users; simplifies management
7. **Access Matrix** = Domains × Objects → Rights

---

## 36.8 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Revocation** | Removing previously granted access |
| **Immediate vs Delayed** | Instant vs scheduled |
| **Selective vs General** | Specific user vs all users |
| **Partial vs Total** | Some rights vs all rights |
| **ACL Revocation** | Easy (modify object's list) |
| **Capability Revocation** | Hard (distributed copies) |
| **Reacquisition** | Expire capabilities, force re-request |
| **Back-Pointers** | Track all capability copies |
| **Indirection** | Global table; invalidate entry |
| **Keys** | Change key to invalidate |
| **RBAC** | Permissions→Roles→Users |
| **RBAC Benefit** | Simplify management; update role not users |

---

## 36.8 Practice Problems

### Problem 1: Revocation Types
```
User had read+write on File A. Admin removes write.
What type? (Partial, Immediate, Selective, Permanent)
```

### Problem 2: ACL vs Capability
```
File F1 ACL: [(D1,rw), (D2,r)]
D2 capability list: [(F1,rw), (F3,r)]
Admin revokes D2 write on F1.
How in ACL? How in Capability?
```

### Problem 3: Revocation Techniques
```
Compare: Reacquisition vs Back-pointers vs Indirection vs Keys
Which is best for: frequent revocation, many capabilities, security-critical?
```

### Problem 4: RBAC
```
Company: 500 employees, 20 roles.
New hire → "Developer" role.
What permissions? What when promoted to "Senior Dev"?
```

### Problem 5: Access Matrix
```
Domain D1: read F1, write F2
Domain D2: read F1
Domain D3: write F2, print
Draw matrix. Can D2 switch to D1 if (D2,D1) has switch right?
```

---

## Summary: Complete 36-Topic Coverage

| Unit | Topics | Count |
|------|--------|-------|
| **Unit 1** | 1-8 | OS Intro → Scheduling (FCFS, SJF, Priority, RR, MLQ) |
| **Unit 2** | 9-14 | IPC → Threads → Synchronization → Deadlocks → Signals |
| **Unit 3** | 15-22 | Memory (Main, Swap, Segmentation, Paging, VM, Page Replacement, NUMA) |
| **Unit 4** | 23-36 | File System (14 topics) |

**Total**: 36 detailed topics covering all slides, textbooks, exam prep MCQs, lab programs, and practice problems.

---

**All 36 topics now complete in `/mnt/shared/sem3/OS/notes/`** 🎓