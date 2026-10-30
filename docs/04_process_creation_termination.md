# Topic 4: Process Creation, Termination & System Calls

**Source**: Lecture 5 + Textbook Ch. 3 (Silberschatz §3.4-3.5, Stevens & Rago Ch. 8)

---

## 4.1 Process Creation: `fork()` + `exec()`

### The Unix Way
```c
pid = fork();  // Clone current process!
if (pid == 0) {
    // CHILD: Different program entirely
    exec("/bin/ls", "ls", NULL);  // Replaces memory with new program
} else {
    // PARENT: Continues original program
    wait(NULL);  // Wait for child to finish
}
```

> **Stevens & Rago**: "The fork() function is the only way a new process is created by an existing process."

### Why This Design?
- `fork()` copies everything (with **Copy-on-Write** optimization)
- `exec()` loads new program
- Separation allows: setup pipes, change directories, drop privileges **before** loading new program

### `fork()` Semantics
| Context | Return |
|---------|--------|
| **Child** | 0 |
| **Parent** | Child's PID (>0) |
| **Error** | -1 |

### Copy-on-Write (COW)
- Parent and child share physical pages **read-only** initially
- When either writes → page is duplicated (page fault → kernel copies page)
- Makes `fork()` fast; `exec()` discards COW pages anyway

---

## 4.2 Complete `fork()` + `exec()` + `wait()` Program

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main() {
    pid_t pid = fork();

    if (pid < 0) {
        fprintf(stderr, "Fork Failed\n");
        return 1;
    }
    else if (pid == 0) {
        // CHILD: Execute new program
        execlp("/bin/ls", "ls", NULL);
    }
    else {
        // PARENT: Wait for child
        wait(NULL);
        printf("Child Complete\n");
    }
    return 0;
}
```

---

## 4.3 `exec()` Family

| Function | Arguments | Environment | PATH Search |
|----------|-----------|-------------|-------------|
| `execl(path, arg0, ..., NULL)` | List | Inherited | No |
| `execv(path, argv[])` | Vector | Inherited | No |
| `execle(path, arg0, ..., NULL, envp[])` | List | Custom | No |
| `execve(path, argv[], envp[])` | Vector | Custom | **TRUE SYSCALL** |
| `execlp(file, arg0, ..., NULL)` | List | Inherited | **Yes** |
| `execvp(file, argv[])` | Vector | Inherited | **Yes** |
| `fexecve(fd, argv[], envp[])` | Vector | Custom | From fd |

**Mnemonic**: `l`=list, `v`=vector, `p`=PATH search, `e`=environment, `f`=file descriptor

---

## 4.3 Process Termination

### Normal Termination (5 ways)
1. `return` from `main()`
2. `exit()` — flushes buffers, runs `atexit` handlers
3. `_exit()` / `_Exit()` — direct kernel call, **no cleanup**
4. Last thread returns from start routine
5. `pthread_exit()` from last thread

### Abnormal Termination (3 ways)
1. `abort()` → `SIGABRT`
2. Signals: `SIGKILL`, `SIGSEGV`, `SIGFPE`
3. Last thread responds to cancellation

---

## 4.4 Zombie vs Orphan Processes

| | **Zombie** | **Orphan** |
|---|------------|------------|
| **Cause** | Child exited, parent hasn't `wait()` | Parent exited before child |
| **State** | Dead but PID+status in process table | Alive, no parent |
| **Resolution** | Parent calls `wait()` → reaped | Re-parented to `init`/`systemd` (PID 1) |
| **In `ps`** | `<defunct>` | Normal process |

> **Stevens & Rago**: "A process that has terminated, but whose parent has not yet waited for it, is called a zombie."

### Lab Patterns (from your prep file)

**Zombie** (`zombie.c`):
```c
// Child: exit(0) immediately
// Parent: sleep(50) WITHOUT wait()
// Child stays as <defunct> for 50 seconds
```

**Orphan** (`orphan.c`):
```c
// Parent: exit(0) immediately
// Child: sleep(30)
// Child adopted by init/systemd (PID 1)
```

---

## 4.5 `wait()` & `waitpid()`

```c
#include <sys/wait.h>

pid_t wait(int *statloc);           // Blocks until ANY child terminates
pid_t waitpid(pid_t pid, int *statloc, int options);
```

| `pid` value | Meaning |
|-------------|---------|
| `> 0` | Wait for specific child PID |
| `-1` | Wait for any child (like `wait()`) |
| `0` | Wait for any child in same process group |
| `< -1` | Wait for any child in process group `\|pid\|` |

**Options**: `WNOHANG` = non-blocking (returns 0 if no child terminated)

### Extracting Exit Status
```c
wait(&status);
int child_code = WEXITSTATUS(status);  // Gets 0-255 from child's exit()
```

---

## 4.6 Race Conditions Post-fork()

```c
// After fork(), parent and child run CONCURRENTLY
// NEVER assume which runs first!

// FLAWED POLLING (never do this):
while (getppid() != 1) {  // Wait for reparenting to init
    sleep(1);  // Wastes CPU, induces latency
}
```

---

## 4.7 I/O Request Life Cycle (I/O-Bound Process)

```
1. Running: Process executes until I/O syscall (read/write)
2. Blocked: OS moves process to Waiting/Blocked queue
3. Preemption: CPU reassigned to another ready process
4. Device Servicing: Controller transfers data asynchronously
5. Interrupt: Device signals completion via hardware interrupt
6. Ready: OS moves process from Waiting → Ready queue
7. Resume: Scheduler dispatches process back to CPU
```

---

## 4.8 Key Takeaways (Memorize)

1. **`fork()`** = creates child (COW), returns 0 to child, PID to parent, -1 on error
2. **`exec()`** = replaces process image with new program; **never returns** on success
3. **`wait()`/`waitpid()`** = reap zombies, get exit status via `WEXITSTATUS`
4. **Zombie** = child dead, parent hasn't waited; **Orphan** = parent dead, child reparented to init
5. **COW** = pages shared read-only until write → then duplicated
6. **Never assume** parent/child execution order post-fork()
7. **Normal exit**: `return`/`exit()`/`_exit()`; **Abnormal**: signals/`abort()`

---

## 4.9 Quick Self-Test

| Question | Answer |
|----------|--------|
| `fork()` returns what in child? | 0 |
| `fork()` returns what in parent? | Child's PID (>0) |
| What does successful `exec()` do? | Never returns; overwrites process image |
| Zombie cause? | Child exited, parent didn't `wait()` |
| Orphan cause? | Parent exited before child |
| Orphan resolution? | Re-parented to `init`/`systemd` (PID 1) |
| `WEXITSTATUS(status)` extracts? | 8-bit exit code (0-255) from child |
| COW = ? | Copy-on-Write: share pages read-only until write |
| `_exit()` vs `exit()`? | `_exit()` = no cleanup, direct kernel call |

---

## 4.10 Exam-Relevant MCQ Patterns (from prep file)

- **Q1**: `fork()` with `int y=0` — parent `y=-1`, child `y=+1` (independent copies)
- **Q2**: `vfork()` — child runs FIRST, increments `y` 0→5, parent decrements 5→0 (shared memory)
- **Q3**: `wait(&status)` + `WEXITSTATUS` extracts exit code (0-255)
- **Q4**: Multi-level fork hierarchy — bottom-up: Grandchild → Child → Parent
- **Q5**: Successful `execl()` — code after exec **never executes**
- **Q6**: Parent exits first → child becomes orphan → adopted by init (PID 1)
- **Q7**: Child exits, parent sleeps without wait → child = zombie (`<defunct>`)
- **Q8**: No synchronization → output interleaves non-deterministically (OS scheduler)

---

## 4.11 Lab Programs to Trace

| File | Pattern |
|------|---------|
| `example1.c` | `fork()` independent address spaces |
| `demo_vfork.c` | `vfork()` shared memory + parent suspended |
| `example2.c` | `wait()` + `WEXITSTATUS` extraction |
| `example3.c` | Multi-level fork hierarchy (grandchild) |
| `example4.c` | `execl()` never returns on success |
| `orphan.c` | Parent exits first → child adopted by init |
| `zombie.c` | Child exits, parent sleeps → `<defunct>` |
| `example1a.c` | No sync → non-deterministic output |