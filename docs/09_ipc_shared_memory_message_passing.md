# Topic 9: Inter-Process Communication (IPC) — Shared Memory & Message Passing

**Source**: Lecture 1 (Unit 2) + Textbook Ch. 5 (Silberschatz Ch. 3, Stallings Ch. 5, 17, Stevens & Rago Ch. 14-15, 17)

---

## 9.1 Why IPC?

### Process Types
| Type | Description |
|------|-------------|
| **Independent** | Cannot affect/be affected by others; shares no data |
| **Cooperating** | Can affect/be affected; shares data, memory, messages |

### Reasons for Cooperation
1. **Information Sharing** — Concurrent access to shared resources (files, DBs)
2. **Computation Speedup** — Parallel subtasks across CPU cores
3. **Modularity** — Divide OS/apps into cooperating processes (client-server, microservices)
4. **Convenience** — User running concurrent tasks

---

## 9.2 Two Fundamental Models

| Aspect | Shared Memory | Message Passing |
|--------|---------------|-----------------|
| **Mechanism** | OS maps shared region into both address spaces | `send()`/`receive()` via kernel |
| **Speed** | Fastest (memory speed, no kernel copies) | Slower (user→kernel→user copies) |
| **Sync** | Manual (semaphores, mutexes) | Built into send/receive |
| **Best For** | Large data, same machine | Distributed systems, small data |

### Architectural Comparison
```
SHARED MEMORY                    MESSAGE PASSING
Process A    Process B            Process A    Process B
    │           │                    │           │
    ▼           ▼                    ▼           ▼
┌───────────────────────┐      ┌───────────────────────┐
│    SHARED MEMORY      │      │       OS KERNEL       │
│    [ Data Buffer ]    │      │  [M1] [M2] [M3] Queue │
└───────────────────────┘      └───────────────────────┘
```

---

## 9.3 Shared Memory Model

### Characteristics
- OS establishes shared region mapped into both address spaces
- Subsequent reads/writes at **memory speed** in **user mode** — no OS intervention
- **Fastest IPC**

### Challenges
- **Synchronization** — If writer writes while reader reads → corruption
- Must use: POSIX Semaphores, Mutex Locks, File/Record Locking

### Linux Memory Layout with Shared Memory
```
High Address (0xC0000000 / Top of User Space)
+-------------------------------------------------------------+
| Command-line arguments & Environment variables              |
+-------------------------------------------------------------+
| STACK (Grows downwards)                                     |
|         |                                                   |
|         v                                                   |
| 0x4017a6a0                                                  |
| +---------------------------------------------------------+ |
| | SHARED MEMORY SEGMENT (e.g. 100,000 bytes)              | |
| +---------------------------------------------------------+ |
| 0x40162000                                                  |
|                                                             |
|         ^                                                   |
|         |                                                   |
| HEAP (Grows upwards, e.g. malloc of 100,000 bytes)          |
+-------------------------------------------------------------+
| UNINITIALIZED DATA (BSS) (e.g. 40,000 byte array)           |
+-------------------------------------------------------------+
| INITIALIZED DATA                                            |
+-------------------------------------------------------------+
| TEXT (Binary Machine Instructions)                          |
+-------------------------------------------------------------+
Low Address (0x08048000)
```

---

## 9.4 Message Passing Model

### Core Primitives
- `send(message)` — blocks or returns immediately
- `receive(message)` — blocks or returns immediately

### Communication Link Design Questions
1. How are links established?
2. Can a link connect >2 processes?
3. How many links between a pair?
4. What is message capacity?
5. Fixed or variable message size?
6. Unidirectional or bidirectional?

---

## 9.5 Direct Communication

```c
send(P, message);        // Send directly to process P
receive(Q, &message);    // Receive directly from process Q
```

| Property | Behavior |
|----------|----------|
| **Naming** | Explicit (PID) |
| **Link** | Auto-established between pair |
| **Multiplicity** | One link per pair |
| **Direction** | Usually bidirectional |

**Disadvantage**: Hardcoded PIDs → fragile; changing PID requires updating all references

---

## 9.6 Indirect Communication (Mailboxes / Ports)

```c
send(A, message);        // Send to mailbox A
receive(A, &message);    // Receive from mailbox A
```

| Property | Behavior |
|----------|----------|
| **Naming** | Via mailbox/port ID |
| **Link** | Exists only if processes share mailbox |
| **Multiplicity** | Many processes can share mailbox; pair can share multiple mailboxes |
| **Direction** | Unidirectional or bidirectional |

### Multi-Receiver Ambiguity
```
P1 → Mailbox A ← P2
              ← P3
```
If P1 sends, both P2 and P3 `receive()` → who gets it?

**Solutions**:
1. Restrict mailbox to ≤2 processes
2. Mutex on `receive()` (only one receiver at a time)
3. OS arbitrates, notifies sender of chosen recipient

---

## 9.7 Synchronization Modes

| Mode | Send Behavior | Receive Behavior |
|------|---------------|------------------|
| **Blocking (Synchronous)** | Blocks until message received | Blocks until message available |
| **Non-blocking (Async)** | Returns immediately | Returns message or null immediately |

### Rendezvous
- **Both send and receive are blocking**
- Sender and receiver synchronize tightly at exchange moment

---

## 9.8 Buffering Capacities

| Capacity | Behavior |
|----------|----------|
| **Zero (No Buffer)** | Sender blocks until receiver ready (strict rendezvous) |
| **Bounded (n messages)** | Sender blocks only when queue full |
| **Unbounded** | Sender never blocks; risk of memory exhaustion |

---

## 9.9 Producer-Consumer Problem

### Bounded Buffer (Circular Array)
```c
#define BUFFER_SIZE 10
item buffer[BUFFER_SIZE];
int in = 0;   // Next free slot
int out = 0;  // First full slot

// Empty: in == out
// Full:  (in + 1) % BUFFER_SIZE == out
// Usable capacity: BUFFER_SIZE - 1
```

### Naive Code (Busy Waiting = Bad)
```c
// Producer
while (true) {
    produce(item);
    while (((in + 1) % BUFFER_SIZE) == out); // SPIN
    buffer[in] = item;
    in = (in + 1) % BUFFER_SIZE;
}

// Consumer
while (true) {
    while (in == out); // SPIN
    item = buffer[out];
    out = (out + 1) % BUFFER_SIZE;
    consume(item);
}
```
**Problem**: Busy waiting burns CPU — use blocking semaphores instead!

---

## 9.10 System V IPC (Legacy but Exam-Relevant)

### Pipes (Anonymous) — `pipe()`
```c
int fd[2];
pipe(fd);  // fd[0]=read, fd[1]=write
```
- **Half-duplex** (unidirectional)
- **Ancestry required** — only parent/child (must `pipe()` before `fork()`)

### FIFOs (Named Pipes) — `mkfifo()`
```c
mkfifo("/tmp/myfifo", 0666);
```
- Exists in filesystem (type `p`)
- **Unrelated processes** can communicate
- Open with `open()`, use `read()`/`write()`/`close()`

### System V Message Queues
```c
struct msgbuf { long mtype; char mtext[...]; };
msgget(key, flags);     // Create/get queue
msgsnd(msqid, &msg, ...); // Send
msgrcv(msqid, &msg, ..., type); // Receive with TYPE FILTERING
```
- **Key feature**: `msgrcv()` can selectively fetch by `mtype` (priority)

### System V Semaphores
```c
semget(key, nsems, flags);
semctl(semid, semnum, cmd, ...);
semop(semid, sembuf_array, nops);  // ATOMIC multiple ops
```

### Unix Domain Sockets (`AF_UNIX`)
- Bidirectional, full socket API, no network overhead
- Supports **file descriptor passing** (`SCM_RIGHTS`)
- Used by: systemd, Docker, X11/Wayland, PostgreSQL

---

## 9.11 Modern IPC (What You Actually Use)

| Instead of Raw... | Use... |
|-------------------|--------|
| `shmget` + mutex | Redis, memcached, SQLite WAL, mmap'ed files |
| `msgget`/`msgsnd` | RabbitMQ, Kafka, ZeroMQ, gRPC, D-Bus |
| Pipes | Shell pipelines `cmd1 \| cmd2` |
| Sockets | systemd, Docker, databases |

---

## 9.12 Key Takeaways

- **IPC** = controlled isolation breaking for cooperation [Silberschatz §3.1]
- **Shared memory** = speed + manual sync (whiteboard model) [Silberschatz §3.3]
- **Message passing** = safety + built-in sync + distribution (postal model) [Silberschatz §3.4]
- **Producer-consumer** = fundamental pattern [Silberschatz §3.5]
- **Busy waiting = bad** in user space — use blocking primitives [Silberschatz §3.5.2]
- **Bounded buffers** give backpressure for free
- **Mailboxes** decouple sender/receiver → modularity [Silberschatz §3.4.4]

---

## 9.13 Exam-Relevant MCQ Patterns

- **Q46**: Shared memory fastest — zero kernel copy after setup
- **Q47**: Message passing — each send/receive = kernel syscall, slower but simpler for distributed
- **Q48**: Socket endpoint = IP address + Port number
- **Q43**: Pipe descriptors — parent closes `fd[0]` (read), child closes `fd[1]` (write)
- **Q44**: Ordinary pipe = unidirectional, requires common ancestor
- **Q45**: FIFO vs pipe — FIFO has filesystem path, unrelated processes can communicate

---

*Next: Topic 10 (Threads & Multicore Programming — Lectures 2 & 4, Unit 2)*