# Topic 8: Shell Programming & Cron Scheduling

**Source**: Lecture 11 (Unit 1) + Textbook Ch. 10 (Stevens & Rago Ch. 9-10)

---

## 8.1 Linux Shell

### Definition & Role
```
[ User / Terminal ] ↔ [ Shell Interpreter ] ↔ [ OS Kernel ] ↔ [ Hardware ]
```
- **Command-line interpreter (CLI)** — reads commands, parses, resolves executables, requests kernel to spawn processes
- Also a **programming language** (variables, conditionals, loops, functions)

### Command Syntax & Parsing
```
command [options] [arguments]
```
- Tokenizes into: command name, flags/options, target arguments
- **Path resolution**:
  - Absolute/relative path (`./script`, `/bin/ls`) → direct access
  - Name only (`ls`) → searches `$PATH` directories left-to-right

### Common Shells
| Shell | Origin | Notes |
|-------|--------|-------|
| `sh` | Stephen Bourne, AT&T Bell Labs | Original Bourne shell |
| `csh`/`tcsh` | Bill Joy, UC Berkeley | C-like syntax |
| `ksh` | David Korn | Combines Bourne + C shell features |
| `bash` | GNU Project | **Default on modern Linux** |

```bash
echo $SHELL  # Shows active login shell
```

---

## 8.2 Environment vs Shell Variables

### Scope & Inheritance
| Property | Shell Variables | Environment Variables |
|----------|-----------------|----------------------|
| **Scope** | Current shell only | Current shell + all children |
| **Inheritance** | ❌ Not inherited | ✅ Auto-inherited by children |
| **Naming** | Any case | Convention: UPPERCASE |
| **Use case** | Local/ephemeral state | Global configuration |

### Standard Environment Variables
| Variable | Purpose |
|----------|---------|
| `SHELL` | Active interpreter path (`/bin/bash`) |
| `TERM` | Terminal type (`xterm-256color`) |
| `USER` | Current username |
| `PWD` | Current working directory |
| `OLDPWD` | Previous directory (enables `cd -`) |
| `PATH` | Colon-separated executable search paths |

### Bash-Specific Variables
- `BASHOPTS` — Active options (comma-separated)
- `BASH_VERSION` — Version string
- `BASH_VERSINFO` — Array [major, minor, patch]

---

## 8.3 Variable Operations

```bash
# Define & access (shell variable)
MY_VAR="Hello world"
echo $MY_VAR

# Export to environment (inherited by children)
export MY_VAR="Hello world"
# or
export MY_VAR

# Unset
unset MY_VAR

# Persistent: add to ~/.profile or ~/.bashrc
export PATH="$HOME/my_tools/bin:$PATH"
```

### Subshell Inheritance Demo
```bash
MY_VAR="Hello"
bash              # Spawn child subshell
echo $MY_VAR      # Empty! Child has no access to parent's local variable.
exit              # Return to parent

export MY_VAR="Hello"
bash
echo $MY_VAR      # Prints: Hello world (successfully inherited!)
exit
```

---

## 8.4 Shell Control Flow

### Conditional: `if-elif-else`
```bash
if [ -f welcome.txt ]; then
    echo "File exists"
else
    echo "File does not exist"
fi
```

**Common File Tests**:
| Test | Meaning |
|------|---------|
| `-f` | Regular file exists |
| `-d` | Directory exists |
| `-r` | Readable |
| `-w` | Writable |
| `-x` | Executable |

---

### Loops: `for`
```bash
# Single loop
for i in {1..5}; do
    echo "i = $i"
done

# Nested loop
for i in {1..5}; do
    for j in {1..3}; do
        echo "i = $i and j = $j"
    done
done
```

### Loop Control
| Statement | Effect |
|-----------|--------|
| `continue` | Skip rest of current iteration → next iteration |
| `break` | Exit loop entirely → statement after loop |

```bash
# continue example (skips i=3)
for i in {1..5}; do
    if [ $i -eq 3 ]; then continue; fi
    for j in {1..3}; do
        echo "i = $i and j = $j"
    done
done

# break example (exits at i=3)
for i in {1..5}; do
    if [ $i -eq 3 ]; then break; fi
    for j in {1..3}; do
        echo "i = $i and j = $j"
    done
done
```

---

## 8.5 Cron Scheduling Daemon

### Overview
- **Daemon**: `crond` / `cron.service` — background job scheduler
- Auto-starts at boot via systemd
- Executes tasks at scheduled times

```bash
sudo systemctl status cron.service  # Check status
```

---

## 8.6 Crontab Management

| Command | Action |
|---------|--------|
| `crontab -l` | List current user's jobs |
| `crontab -e` | Edit crontab (opens in `$EDITOR`) |
| `crontab -r` | Remove all jobs for current user |

---

## 8.7 Crontab Syntax (5 Fields)

```
* * * * *  command_to_execute
│ │ │ └─── Day of Week (0-6) (0=Sun)
│ │ └───── Month (1-12)
│ └─────── Day of Month (1-31)
└───────── Hour (0-23)
          Minute (0-59)
```

### Practical Examples

| Expression | Meaning |
|------------|---------|
| `5 0 * 8 *` | 00:05 every day in August |
| `5 4 * * 6` | 04:05 every Saturday |
| `0 22 * * 1-5` | 22:00 Mon-Fri |
| `*/1 * * * *` | Every minute |

### Example with Output Redirection
```bash
# In crontab -e:
*/1 * * * * /bin/bash $HOME/OS/hello.exe &> $HOME/OS/cron_output.log
```
- `&>` redirects **both stdout (fd 1) and stderr (fd 2)** to log file

### Verification
```bash
tail -f /var/log/syslog
# Shows:
# Jan 24 08:40:01 host CRON[2935]: (user) CMD (/bin/bash $HOME/OS/hello.exe &> $HOME/OS/cron_output.log)
```

---

## 8.6 Standard Library Helpers: `popen()` / `pclose()`

```c
#include <stdio.h>
FILE *popen(const char *cmdstring, const char *type);  // type: "r" or "w"
int pclose(FILE *fp);
```

**Automates**: pipe creation, fork, fd redirection, shell exec, cleanup

```c
// Read output of command
FILE *fp = popen("ls -la", "r");
while (fgets(buf, sizeof(buf), fp)) printf("%s", buf);
pclose(fp);  // wait()s for child, returns exit status

// Write input to command
FILE *fp = popen("sort", "w");
fprintf(fp, "delta\nalpha\nepsilon\n");
pclose(fp);
```

---

## 8.7 Key Takeaways

- **Shell** = CLI interpreter between user and kernel
- **Variables**: Shell (local) vs Environment (exported, inherited)
- **Control flow**: `if`, `for`, `continue`, `break` — standard scripting
- **Cron** = time-based job scheduler daemon
- **Crontab**: 5-field syntax + command; manage with `-l`, `-e`, `-r`
- **Logging**: Check `/var/log/syslog` for execution verification
- **popen/pclose** = easy "run command, get output" wrapper

---

## 8.8 Exam-Relevant MCQ Patterns

- **Q33**: Crontab `30 2 * * 1` → 02:30 AM every Monday
- **Q34**: Bash shell execution flow — `fork()` → `exec*()` in child → `wait()` in parent
- **Q35**: Mobile OS lifecycle — Android kills background processes by importance hierarchy

---

## 8.8 Practice Problems

### Problem 1: Variable Scope
```bash
MY_VAR="Hello"
bash              # Spawn child subshell
echo $MY_VAR      # What prints?
```

### Problem 2: Crontab
```
Run script at 02:30 AM every Monday
```

### Problem 3: Loop Control
```bash
for i in {1..5}; do
    if [ $i -eq 3 ]; then continue; fi
    # What prints for i=3?
done
```

### Problem 4: Nested Loop Output
```bash
for i in 1 2; do
    for j in a b; do
        echo "$i$j"
    done
done
```

### Problem 5: Cron Verification
```
How to verify cron job executed?
```

---

*Next: Topic 9 (Inter-Process Communication — Lecture 1, Unit 2)*