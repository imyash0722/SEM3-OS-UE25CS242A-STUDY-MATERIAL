# Chapter 5: Inter-Process Communication (IPC)

**Textbook References**: [Silberschatz 10e, Ch. 3] • [Stallings 9e, Ch. 5, 17] • [Stevens & Rago 3e, Ch. 14-15, 17]

---

## 5.1 Why IPC? [Silberschatz 10e, §3.1]

### Process Types [Silberschatz 10e, §3.1.1]
| Type | Description |
|------|-------------|
| **Independent** | Cannot affect/be affected by others; shares no data |
| **Cooperating** | Can affect/be affected; shares data, memory, messages |

### Reasons for Cooperation [Silberschatz 10e, §3.1.2]
1. **Information Sharing** — Concurrent access to shared resources (files, DBs)
2. **Computation Speedup** — Parallel subtasks across CPU cores
3. **Modularity** — Divide OS/apps into cooperating processes (client-server, microservices)
4. **Convenience** — User running concurrent tasks

---

## 5.2 Two Fundamental Models [Silberschatz 10e, §3.2]

| Aspect | Shared Memory | Message Passing |
|--------|---------------|-----------------|
| **Mechanism** | OS maps shared region into both address spaces | `send()`/`receive()` via kernel |
| **Speed** | Fastest (memory speed, no kernel copies) | Slower (user→kernel→user copies) |
| **Sync** | Manual (semaphores, mutexes) | Built into send/receive |
| **Best For** | Large data, same machine | Distributed systems, small data |

### Architectural Comparison [Silberschatz 10e, Fig. 3.1]
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

## 5.3 Shared Memory Model [Silberschatz 10e, §3.3]

### Characteristics [Silberschatz 10e, §3.3.1]
- OS establishes shared region mapped into both address spaces
- Subsequent reads/writes at **memory speed** in **user mode** — no OS intervention
- **Fastest IPC**

### Challenges [Silberschatz 10e, §3.3.2]
- **Synchronization** — If writer writes while reader reads → corruption
- Must use: POSIX Semaphores, Mutex Locks, File/Record Locking

---

## 5.4 Message Passing Model [Silberschatz 10e, §3.4]

### Core Primitives [Silberschatz 10e, §3.4.1]
- `send(message)` — blocks or returns immediately
- `receive(message)` — blocks or returns immediately

### Communication Link Design Questions [Silberschatz 10e, §3.4.2]
1. How are links established?
2. Can a link connect >2 processes?
4. What is message capacity?
5. Fixed or variable message size?
6. Unidirectional or bidirectional?

---

## 5.5 Direct Communication [Silberschatz 10e, §3.4.3]

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

## 5.6 Indirect Communication (Mailboxes / Ports) [Silberschatz 10e, §3.4.4]

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

### Multi-Receiver Ambiguity [Silberschatz 10e, §3.4.4]
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

## 5.7 Synchronization Modes [Silberschatz 10e, §3.4.5]

| Mode | Send Behavior | Receive Behavior |
|------|---------------|------------------|
| **Blocking (Synchronous)** | Blocks until message received | Blocks until message available |
| **Non-blocking (Async)** | Returns immediately | Returns message or null immediately |

### Rendezvous [Silberschatz 10e, §3.4.5]
- **Both send and receive are blocking**
- Sender and receiver synchronize tightly at exchange moment

---

## 5.8 Buffering Capacities [Silberschatz 10e, §3.4.6]

| Capacity | Behavior |
|----------|----------|
| **Zero (No Buffer)** | Sender blocks until receiver ready (strict rendezvous) |
| **Bounded (n messages)** | Sender blocks only when queue full |
| **Unbounded** | Sender never blocks; risk of memory exhaustion |

---

## 5.9 Classical IPC Problem: Producer-Consumer [Silberschatz 10e, §3.5]

### Bounded Buffer (Circular Array) [Silberschatz 10e, §3.5.1]
```c
#define BUFFER_SIZE 10
item buffer[BUFFER_SIZE];
int in = 0;   // Next free slot
int out = 0;  // First full slot

// Empty: in == out
// Full:  (in + 1) % BUFFER_SIZE == out
// Usable capacity: BUFFER_SIZE - 1
```

### Naive Code (Busy Waiting = Bad) [Silberschatz 10e, §3.5.2]
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

## 5.10 System V IPC (Legacy but Important) [Stevens & Rago 3e, Ch. 14-15]

### Pipes (Anonymous) — `pipe()` [Stevens & Rago 3e, §14.2]
```c
int fd[2];
pipe(fd);  // fd[0]=read, fd[1]=write
```
- **Half-duplex** (unidirectional)
- **Ancestry required** — only parent/child (must `pipe()` before `fork()`)

### FIFOs (Named Pipes) — `mkfifo()` [Stevens & Rago 3e, §14.3]
```c
mkfifo("/tmp/myfifo", 0666);
```
- Exists in filesystem (type `p`)
- **Unrelated processes** can communicate
- Open with `open()`, use `read()`/`write()`/`close()`

### System V Message Queues [Stevens & Rago 3e, §14.4]
```c
struct msgbuf { long mtype; char mtext[...]; };
msgget(key, flags);     // Create/get queue
msgsnd(msqid, &msg, ...); // Send
msgrcv(msqid, &msg, ..., type); // Receive with TYPE FILTERING
```
- **Key feature**: `msgrcv()` can selectively fetch by `mtype` (priority)

### System V Semaphores [Stevens & Rago 3e, §14.5]
```c
semget(key, nsems, flags);
semctl(semid, semnum, cmd, ...);
semop(semid, sembuf_array, nops); // ATOMIC multiple operations
```

### Unix Domain Sockets (`AF_UNIX`) [Stevens & Rago 3e, Ch. 17]
- Bidirectional, full socket API, no network overhead
- Supports **file descriptor passing** (`SCM_RIGHTS`)
- Used by: systemd, Docker, X11/Wayland, PostgreSQL

---

## 5.11 Modern IPC (What You Actually Use) [Stevens & Rago 3e, Ch. 17]

| Instead of Raw... | Use... |
|-------------------|--------|
| `shmget` + mutex | Redis, memcached, SQLite WAL, mmap'ed files |
| `msgget`/`msgsnd` | RabbitMQ, Kafka, ZeroMQ, gRPC, D-Bus |
| Pipes | Shell pipelines `cmd1 \| cmd2` |
| Sockets | systemd, Docker, databases |

---

## Key Takeaways
- **IPC** = controlled isolation breaking for cooperation [Silberschatz 10e, §3.1]
- **Shared memory** = speed + manual sync (whiteboard model) [Silberschatz 10e, §3.3]
- **Message passing** = safety + built-in sync + distribution (postal model) [Silberschatz 10e, §3.4]
- **Producer-consumer** = fundamental pattern [Silberschatz 10e, §3.5]
- **Busy waiting = bad** in user space — use blocking primitives [Silberschatz 10e, §3.5.2]
- **Bounded buffers** give backpressure for free
- **Mailboxes** decouple sender/receiver → modularity [Silberschatz 10e, §3.4.4]

---

**Further Reading**: [Silberschatz 10e, Ch. 3] • [Stallings 9e, Ch. 5, 17] • [Stevens & Rago 3e, Ch. 14-15, 17]