# Topic 35: Access Matrix & Implementation

**Source**: Lecture 4.11 (Unit 4) + Textbook Ch. 14 (Silberschatz Ch. 14, Stallings Ch. 14)

---

## 35.1 Access Matrix Model

### Definition
- **Access Matrix** = Protection model specifying **who** can access **what** and **how**
- **Rows** = Domains (subjects/users/processes)
- **Columns** = Objects (files, printers, memory, devices)
- **Cells** = Access Rights (read, write, execute, print, delete)

### Core Concept
```
Access Matrix = Function: Domain × Object → Set of Rights
```

---

## 35.1 Access Matrix Structure

### Basic Structure
| | Object 1 | Object 2 | Object 3 | Printer |
|---------|----------|----------|----------|---------|
| **Domain 1** | read | | read | |
| **Domain 2** | | | | print |
| **Domain 3** | | read, write | | |
| **Domain 4** | read, write | | read, write | |

### Example from Slides
| Domain | F1 | F2 | F3 | Printer |
|--------|----|----|----|---------|
| **D1** | read | | read | |
| **D2** | | | | print |
| **D3** | | read, write | | |
| **D4** | read, write | | read, write | |

### Key Rules
| Rule | Description |
|------|-------------|
| **Only allowed access** | Matrix defines exact permissions |
| **Strict control** | No implicit permissions |
| **OS decides** | Which domain process runs in; what rights granted |

---

## 35.2 Domain Switching

### Concept
- **Domain** treated as an **object**
- **Switch** = operation to change from domain Di → Dj

### Switching Rule
> Process can switch from Domain Di → Domain Dj **only if** `switch` right exists in Access Matrix

### Example Switch Rights
| From Domain | Can Switch To |
|-------------|---------------|
| D1 | D2 |
| D2 | D3, D4 |
| D4 | D1 |

### Additional Special Rights
| Right | Meaning |
|-------|---------|
| **copy** | Duplicate access rights to another domain |
| **owner** | Full control over object |
| **control** | Modify access rights of other domains |

---

## 35.3 Access Matrix Implementation

### Problem
- Complete matrix can be **huge** (Domains × Objects)
- **Most entries empty** (sparse matrix)
- Storing full matrix = memory inefficient

### Three Implementation Methods

---

## 35.2 Implementation Method 1: Global Table

### Structure
- Single table with all non-empty `<Domain, Object, Rights>` tuples

| Domain | Object | Rights |
|--------|--------|--------|
| D1 | F1 | read |
| D1 | F3 | read |
| D2 | Printer | print |
| D3 | F2 | read, write |
| D4 | F1 | read, write |
| D4 | F3 | read, write |

### Lookup Process
1. Process requests access to object
2. OS searches global table for `<Domain, Object>`
4. If found → check rights → allow/deny

### Limitations
| Issue | Impact |
|-------|--------|
| **Large table** | Memory inefficient for sparse matrices |
| **Slow lookup** | Search entire table (O(n)) |
| **Management** | Hard to group similar rights |

---

## 35.3 Access Control Lists (ACL) — Access List per Object

### Structure
- **Each object** maintains list of `<Domain, Rights>`
- **Format**: `Object → [(Domain, Rights), ...]`

### Example: File F1
```
F1 → [(D1, read), (D3, read, write), (D4, read, write)]
```

### Lookup Process
1. Process requests access to object
2. OS checks **object's ACL**
3. Finds requesting domain
4. Checks rights → allow/deny

### Advantages
| Advantage | Description |
|-----------|-------------|
| **Who can access?** | Easy to see all domains with access to object |
| **Modify permissions** | Easy to add/remove entries |
| **Default permissions** | Easy to set defaults |

### Limitation
| Limitation | Description |
|------------|-------------|
| **Reverse query** | Hard to find "what objects can Domain D access?" |

### Example (F1 ACL)
```
F1 → (D1, read), (D3, read/write), (D4, read/write)
→ D2 has NO access to F1
```

---

## 35.3 Capability Lists (C-Lists)

### Structure
- **Each domain** maintains list of capabilities
- **Format**: `Domain → [(Object, Rights), ...]`

### Example: Domain D1
```
D1 → [(F1, read), (F2, read/write), (Printer, print)]
```

### Lookup Process
1. Process runs in Domain D
2. OS checks **D's capability list**
3. Finds requested object
4. Checks rights → allow/deny

### Advantages
| Advantage | Description |
|-----------|-------------|
| **Fast lookup** | Per-domain list; typically smaller |
| **Revocation** | Remove capability from list |
| **Delegation** | Copy capability to another domain |

### Comparison: ACL vs Capability

| Aspect | ACL (Per Object) | Capability (Per Domain) |
|--------|-------------------|-------------------------|
| **Question** | "Who can access X?" | "What can D access?" |
| **Lookup** | Check object's list | Check domain's list |
| **Revocation** | Scan all ACLs | Remove from domain's list |
| **Delegation** | Add to object's ACL | Copy capability |
| **Space** | Good if few domains/object | Good if few objects/domain |

---

## 35.4 Comparison of Implementation Methods

| Method | Structure | Lookup | Space | Best For |
|--------|-----------|--------|-------|----------|
| **Global Table** | Single `<D,O,R>` table | Search all entries | O(n) | Small systems |
| **ACL** | Per-object lists | Search object's list | Sparse | Object-centric access |
| **Capability** | Per-domain lists | Search domain's list | Sparse | Domain-centric access |

---

## 35.4 Domain Switching Implementation

### Mechanism
- Domain switching = operation on domain object
- **Switch Right** required in Access Matrix

### Implementation
```
Access Matrix Cell (Di, Dj) contains "switch" right
→ Process in Di can switch to Dj
```

### Protection
- Only authorized switches allowed
- Prevents unauthorized privilege escalation

---

## 35.5 Key Takeaways

1. **Access Matrix** = Domains × Objects → Rights
2. **Domain Switching** = Requires `switch` right in matrix
3. **Global Table** = Simple but memory inefficient
4. **ACL** = Per-object lists; answers "who can access?"
5. **Capability List** = Per-domain; answers "what can I access?"
6. **Choice** = Depends on access patterns (object-centric vs domain-centric)

---

## 35.5 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Access Matrix** | Rows=Domains, Columns=Objects, Cells=Rights |
| **Domain Switching** | Requires `switch` right in matrix |
| **Global Table** | Single table of `<D,O,R>`; slow lookup |
| **ACL** | Per-object list; "who can access X?" |
| **Capability** | Per-domain list; "what can D access?" |
| **ACL vs Capability** | ACL = object-centric; Capability = domain-centric |
| **Global Table drawback** | Large, slow, hard to manage |
| **Capability advantage** | Fast lookup, easy revocation/delegation |

---

## 35.5 Practice Problems

### Problem 1: Access Matrix Construction
```
Domains: D1, D2, D3
Objects: F1, F2, Printer
Rights: D1→read F1, write F2; D2→read F1; D3→print
Draw matrix.
```

### Problem 2: Domain Switching
```
Matrix has: (D1,D2)=switch, (D2,D3)=switch
Process in D1 wants to reach D3.
Can it? How?
```

### Problem 3: ACL vs Capability
```
File F1 ACL: [(D1, r), (D2, rw)]
Domain D1 Capabilities: [(F1, r), (F2, r)]
Are these consistent?
```

### Problem 4: Access Check
```
Process in D3 requests write to F1.
ACL(F1) = [(D1,r), (D2,rw)]
Capability(D3) = [(F2,r)]
Result?
```

### Problem 5: Implementation Choice
```
System with 1000 domains, 10000 objects, sparse access.
ACL or Capability? Why?
```

---

*Next: Topic 36 (Access Control & Revocation of Access Rights)*