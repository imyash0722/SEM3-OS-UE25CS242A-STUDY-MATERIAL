# Topic 4 (Detailed): Process Creation, Termination & System Calls

**Source**: Lecture 5 + Textbook Ch. 3 (Silberschatz §3.4-3.5, Stevens & Rago Ch. 8)

---

## 4.1 Process Creation: The Unix Philosophy

### Why `fork()` + `exec()` Instead of One `spawn()`?

**Historical context**: Unix was designed for simplicity and composability.

```
Windows CreateProcess(): One heavy call does everything
    - Creates process
    - Loads executable
    - Sets up environment
    - Starts execution
    → 50+ parameters, complex, inflexible

Unix fork() + exec(): Two simple calls
    fork()  → Creates child (exact copy)
    exec()  → Replaces with new program
    → 2-3 parameters each, composable, flexible
```

**The genius**: Between `fork()` and `exec()`, the child can:
- Redirect stdin/stdout/stderr (pipes, files)
- Change working directory
- Drop privileges (setuid/setgid)
- Set environment variables
- Close unwanted file descriptors
- **All without special parameters to the creation call**

---

## 4.2 Deep Dive: `fork()` Mechanics

### What Actually Happens (Step by Step)

```
PARENT PROCESS                          KERNEL                          CHILD PROCESS
──────────────────────────────────────────────────────────────────────────────
pid_t pid = fork();
         │
         ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ 1. Allocate new task_struct (PCB) for child                         │
    │ 2. Copy parent's page tables (mark pages COW)                       │
    │ 3. Copy file descriptor table (reference counts++)                  │
    │ 4. Copy signal handlers, credentials, timers, etc.                  │
    │ 5. Assign new PID                                                   │
    │ 6. Set child's return value = 0                                     │
    │ 7. Set parent's return value = child's PID                          │
    │ 8. Schedule both processes                                          │
    └──────────────────────────────────────────────────────────────────────┘
         │
         ▼
    Returns PID to parent          Returns 0 to child
```

### Copy-on-Write (COW) - The Performance Secret

**Without COW**: `fork()` copies ALL memory pages → slow, memory-hungry
**With COW**: 
- Parent and child share **physical pages** (read-only)
- Page table entries marked **read-only** + **COW flag**
- On **first write** by either:
  1. Page fault triggered
  2. Kernel allocates new physical page
  3. Copies content
  4. Updates page table (writable, private)
  5. Resumes instruction

```
BEFORE WRITE:                    AFTER PARENT WRITES:
┌──────────────────┐             ┌──────────────────┐
│ Parent VA 0x1000 │             │ Parent VA 0x1000 │
│       │          │             │       │          │
│       ▼          │             │       ▼          │
│  ┌────────┐      │             │  ┌────────┐      │
│  │ Page A │◄─────┼────┐        │  │Page A' │      │ (new copy)
│  │ (RO)   │      │    │        │  │ (RW)   │      │
│  └────────┘      │    │        │  └────────┘      │
│       ▲          │    │        │       ▲          │
│       │          │    │        │       │          │
│ Child VA 0x1000  │    │        │ Child VA 0x1000  │ (still original)
│       │          │    │        │       │          │
└───────│──────────┘    │        └───────│──────────┘
        │               │               │
        └───────────────┘               └───────────────
        Shared physical page              Separate pages
```

**Result**: `fork()` is ~1000x faster than full copy; `exec()` discards COW pages anyway.

---

## 4.3 Complete Programs with Detailed Comments

### Program 1: Basic fork() + exec() + wait()

```c
/*
 * File: fork_exec_wait.c
 * Purpose: Demonstrate the classic fork-exec-wait pattern
 * Compile: gcc -o fork_exec_wait fork_exec_wait.c
 * Run: ./fork_exec_wait
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main() {
    printf("=== START: Parent PID = %d ===\n", getpid());
    
    // FORK: Create child process
    // Returns: 0 in child, child's PID in parent, -1 on error
    pid_t pid = fork();
    
    if (pid < 0) {
        // ERROR HANDLING: fork() failed
        perror("fork failed");  // Prints: "fork failed: Cannot allocate memory"
        exit(EXIT_FAILURE);
    }
    
    if (pid == 0) {
        // ========== CHILD PROCESS ==========
        // pid == 0 means we are the child
        printf("[CHILD] PID=%d, PPID=%d\n", getpid(), getppid());
        
        // EXEC: Replace this process image with a new program
        // execlp() searches PATH for the executable
        // Arguments: (file, arg0, arg1, ..., NULL)
        // arg0 is conventionally the program name
        printf("[CHILD] Calling execlp(\"ls\", \"ls\", \"-l\", NULL)...\n");
        
        // execlp() only returns if it FAILS
        execlp("ls", "ls", "-l", NULL);
        
        // If we reach here, execlp() failed
        perror("[CHILD] execlp failed");
        _exit(EXIT_FAILURE);  // Use _exit() to avoid flushing parent's buffers
    } else {
        // ========== PARENT PROCESS ==========
        // pid > 0 means we are the parent, pid = child's PID
        printf("[PARENT] PID=%d, created child PID=%d\n", getpid(), pid);
        
        // WAIT: Block until child terminates
        // wait(NULL) means we don't care about exit status
        int status;
        pid_t waited_pid = wait(&status);
        
        if (waited_pid == -1) {
            perror("wait failed");
            exit(EXIT_FAILURE);
        }
        
        printf("[PARENT] wait() returned: child PID=%d\n", waited_pid);
        
        // Extract exit status
        if (WIFEXITED(status)) {
            int exit_code = WEXITSTATUS(status);
            printf("[PARENT] Child exited normally with code=%d\n", exit_code);
        } else if (WIFSIGNALED(status)) {
            int sig = WTERMSIG(status);
            printf("[PARENT] Child killed by signal=%d (%s)\n", sig, strsignal(sig));
        }
    }
    
    printf("=== END: Parent PID = %d ===\n", getpid());
    return 0;
}
```

**Expected Output:**
```
=== START: Parent PID = 12345 ===
[PARENT] PID=12345, created child PID=12346
[CHILD] PID=12346, PPID=12345
[CHILD] Calling execlp("ls", "ls", "-l", NULL)...
total 8
-rwxr-xr-x 1 user user 16800 Nov 3 16:40 fork_exec_wait
-rw-r--r-- 1 user user  5432 Nov 3 16:40 fork_exec_wait.c
[PARENT] wait() returned: child PID=12346
[PARENT] Child exited normally with code=0
=== END: Parent PID = 12345 ===
```

---

### Program 2: fork() Variable Isolation Demo

```c
/*
 * File: fork_variables.c
 * Purpose: Prove that parent and child have INDEPENDENT address spaces
 * Compile: gcc -o fork_variables fork_variables.c
 */

#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    int shared_var = 100;  // In parent's memory
    int *heap_var = malloc(sizeof(int));
    *heap_var = 200;
    
    printf("=== BEFORE fork() ===\n");
    printf("Parent: shared_var=%d (addr=%p), heap_var=%d (addr=%p)\n", 
           shared_var, &shared_var, *heap_var, heap_var);
    
    pid_t pid = fork();
    
    if (pid == 0) {
        // CHILD: Modify both variables
        shared_var = 999;
        *heap_var = 888;
        printf("[CHILD] After modification: shared_var=%d (addr=%p), heap_var=%d (addr=%p)\n",
               shared_var, &shared_var, *heap_var, heap_var);
        _exit(0);
    } else {
        // PARENT: Wait, then check variables
        wait(NULL);
        printf("=== AFTER fork() (in parent) ===\n");
        printf("Parent: shared_var=%d (addr=%p), heap_var=%d (addr=%p)\n",
               shared_var, &shared_var, *heap_var, heap_var);
        printf("Notice: Parent's values UNCHANGED! Child got its own copy.\n");
        
        free(heap_var);
    }
    return 0;
}
```

**Output:**
```
=== BEFORE fork() ===
Parent: shared_var=100 (addr=0x7ffc1234), heap_var=200 (addr=0x55a12345)
[CHILD] After modification: shared_var=999 (addr=0x7ffc1234), heap_var=888 (addr=0x55a12345)
=== AFTER fork() (in parent) ===
Parent: shared_var=100 (addr=0x7ffc1234), heap_var=200 (addr=0x55a12345)
Notice: Parent's values UNCHANGED! Child got its own copy.
```

**Key observation**: Same virtual addresses, **different physical pages** (COW).

---

### Program 3: vfork() vs fork() - Shared Memory Danger

```c
/*
 * File: vfork_danger.c
 * Purpose: Show how vfork() shares memory with parent (DANGEROUS!)
 * Compile: gcc -o vfork_danger vfork_danger.c
 * 
 * WARNING: This program demonstrates UNSAFE behavior!
 * Never use vfork() unless you immediately exec() or _exit()
 */

#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    int counter = 0;
    
    printf("=== Using vfork() ===\n");
    printf("Initial counter = %d\n", counter);
    
    pid_t pid = vfork();  // CHILD RUNS FIRST, PARENT SUSPENDED
    
    if (pid == 0) {
        // CHILD: Runs FIRST, shares ALL memory with parent
        printf("[CHILD] Incrementing counter 5 times...\n");
        for (int i = 0; i < 5; i++) {
            counter++;
            printf("[CHILD] counter = %d\n", counter);
        }
        printf("[CHILD] Calling _exit()...\n");
        _exit(0);  // MUST use _exit(), NOT exit()!
    } else {
        // PARENT: Resumes AFTER child calls _exit() or exec()
        wait(NULL);
        printf("[PARENT] After child, counter = %d\n", counter);
        printf("[PARENT] Parent's counter was MODIFIED by child!\n");
    }
    
    return 0;
}
```

**Output:**
```
=== Using vfork() ===
Initial counter = 0
[CHILD] Incrementing counter 5 times...
[CHILD] counter = 1
[CHILD] counter = 2
[CHILD] counter = 3
[CHILD] counter = 4
[CHILD] counter = 5
[CHILD] Calling _exit()...
[PARENT] After child, counter = 5
[PARENT] Parent's counter was MODIFIED by child!
```

**Contrast with fork():**
```c
// Change vfork() to fork() and run again:
// Parent's counter stays 0 (independent copies)
```

---

### Program 4: Zombie & Orphan Demonstration

```c
/*
 * File: zombie_orphan.c
 * Purpose: Create and observe zombie and orphan processes
 * Compile: gcc -o zombie_orphan zombie_orphan.c
 * 
 * Run in two terminals:
 * Terminal 1: ./zombie_orphan zombie
 * Terminal 2: watch -n 1 'ps aux | grep zombie_orphan'
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

void create_zombie() {
    printf("=== CREATING ZOMBIE ===\n");
    pid_t pid = fork();
    
    if (pid == 0) {
        // CHILD: Exit immediately
        printf("[CHILD] PID=%d exiting now...\n", getpid());
        exit(42);  // Exit code 42
    } else {
        // PARENT: Sleep WITHOUT calling wait()
        printf("[PARENT] Sleeping 30s WITHOUT wait()...\n");
        printf("[PARENT] Check 'ps aux' - child will show as <defunct>\n");
        sleep(30);
        
        // Now reap the zombie
        int status;
        wait(&status);
        printf("[PARENT] Reaped zombie. Exit code: %d\n", WEXITSTATUS(status));
    }
}

void create_orphan() {
    printf("\n=== CREATING ORPHAN ===\n");
    pid_t pid = fork();
    
    if (pid == 0) {
        // CHILD: Sleep longer than parent
        printf("[CHILD] PID=%d, PPID=%d - sleeping 30s\n", getpid(), getppid());
        sleep(30);
        printf("[CHILD] Woke up! New PPID=%d (adopted by init/systemd)\n", getppid());
        exit(0);
    } else {
        // PARENT: Exit immediately
        printf("[PARENT] PID=%d exiting immediately\n", getpid());
        printf("[PARENT] Child becomes orphan, adopted by PID 1\n");
        exit(0);
    }
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s [zombie|orphan]\n", argv[0]);
        return 1;
    }
    
    if (strcmp(argv[1], "zombie") == 0) {
        create_zombie();
    } else if (strcmp(argv[1], "orphan") == 0) {
        create_orphan();
    }
    return 0;
}
```

**Observe with:**
```bash
# Terminal 1:
./zombie_orphan zombie

# Terminal 2 (watch process table):
watch -n 1 'ps aux | grep -E "(zombie_orphan|defunct)"'
```

**Expected `ps` output:**
```
# Zombie state (before parent waits):
user  12346  0.0  0.0      0     0 pts/0  Z+   16:45   0:00 [zombie_orphan] <defunct>

# Orphan state (after parent exits):
user  12346  0.0  0.0   1234  456 pts/0  S    16:45   0:00 ./zombie_orphan orphan
# Note PPID = 1 (systemd)
```

---

### Program 5: exec() Family Comparison

```c
/*
 * File: exec_family.c
 * Purpose: Demonstrate all exec() variants
 * Compile: gcc -o exec_family exec_family.c
 */

#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <1-6>\n", argv[0]);
        printf("  1: execl  2: execv  3: execle\n");
        printf("  4: execve 5: execlp 6: execvp\n");
        return 1;
    }
    
    int choice = atoi(argv[1]);
    pid_t pid = fork();
    
    if (pid == 0) {
        printf("[CHILD] Trying exec variant %d...\n", choice);
        
        switch (choice) {
            case 1:  // execl - list, no PATH search
                execl("/bin/ls", "ls", "-l", NULL);
                break;
            case 2:  // execv - vector, no PATH search
                {
                    char *args[] = {"ls", "-l", NULL};
                    execv("/bin/ls", args);
                }
                break;
            case 3:  // execle - list, custom env
                {
                    char *env[] = {"PATH=/bin:/usr/bin", "TERM=xterm", NULL};
                    execle("/bin/ls", "ls", "-l", NULL, env);
                }
                break;
            case 4:  // execve - vector, custom env (THE syscall)
                {
                    char *args[] = {"ls", "-l", NULL};
                    char *env[] = {"PATH=/bin:/usr/bin", NULL};
                    execve("/bin/ls", args, env);
                }
                break;
            case 5:  // execlp - list, PATH search
                execlp("ls", "ls", "-l", NULL);
                break;
            case 6:  // execvp - vector, PATH search
                {
                    char *args[] = {"ls", "-l", NULL};
                    execvp("ls", args);
                }
                break;
        }
        
        // Only reached on failure
        perror("exec failed");
        _exit(1);
    } else {
        wait(NULL);
        printf("[PARENT] Child finished\n");
    }
    return 0;
}
```

---

## 4.4 Common Pitfalls & How to Avoid Them

| Pitfall | Wrong Code | Correct Code | Why |
|---------|------------|--------------|-----|
| **Forgetting wait()** | `fork(); // no wait` | `wait(NULL);` | Creates zombie processes |
| **Using exit() in vfork child** | `vfork(); if(pid==0) exit(0);` | `vfork(); if(pid==0) _exit(0);` | `exit()` flushes parent's stdio buffers twice |
| **Passing stack address to thread** | `int x; pthread_create(..., &x);` | `int *p = malloc(sizeof(int)); pthread_create(..., p);` | Stack frame destroyed when function returns |
| **Not checking fork() return** | `fork(); // no check` | `pid_t pid = fork(); if(pid<0) handle_error();` | Silent failures, zombie children |
| **Using return in child after exec** | `execl(...); return 0;` | `execl(...); _exit(1);` | `return` never reached on success; on failure, use `_exit()` |
| **wait() without status check** | `wait(NULL);` | `int s; wait(&s); if(WIFEXITED(s))...` | Misses signal termination, core dumps |

---

## 4.5 Debugging Tips

### 1. Trace System Calls with strace
```bash
strace -f -e trace=fork,execve,wait4,exit_group ./fork_exec_wait
```

### 2. Watch Process Tree
```bash
# Shows parent-child relationships
pstree -p | grep fork_exec_wait
```

### 3. Check Process Status
```bash
# Z = zombie, S = sleeping, R = running
ps -o pid,ppid,stat,cmd -C fork_exec_wait
```

### 4. Core Dump Analysis
```bash
ulimit -c unlimited  # Enable core dumps
./crashing_program
gdb ./crashing_program core
```

---

## 4.6 Exam-Focused Summary

| Concept | Must Know |
|---------|-----------|
| `fork()` return values | 0=child, >0=parent, -1=error |
| COW mechanism | Pages shared read-only until write |
| `exec()` never returns | On success, process image replaced |
| `exit()` vs `_exit()` | `_exit()` = no cleanup, safe in vfork child |
| Zombie vs Orphan | Zombie=dead+unwaited; Orphan=parent dead+reparented |
| `WEXITSTATUS()` | Extracts 8-bit exit code from wait status |
| `vfork()` | Child runs first, shares memory, parent suspended |
| `execlp/execvp` | Search PATH; others need full path |

---

## 4.7 Complete Lab Program Reference

| Lab File | Key Concept | Expected Behavior |
|----------|-------------|-------------------|
| `example1.c` | fork() independent memory | Parent y=-1, Child y=+1 |
| `demo_vfork.c` | vfork() shared memory | Child runs first, y=0→5→0 |
| `example2.c` | wait() + WEXITSTATUS | Extracts child's exit code |
| `example3.c` | Multi-level fork | Grandchild→Child→Parent exit order |
| `example4.c` | execl() no return | Code after exec never runs |
| `orphan.c` | Parent exits first | Child adopted by PID 1 |
| `zombie.c` | Child exits, no wait | `<defunct>` in ps |
| `example1a.c` | No synchronization | Non-deterministic output |

---

*Next: Topic 5 (CPU Scheduling - FCFS & SJF) with full Gantt chart traces and calculation examples*