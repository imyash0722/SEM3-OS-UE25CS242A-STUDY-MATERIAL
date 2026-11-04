# Topic 33: OS Security — Program Threats

**Source**: Lecture 4.9 (Unit 4) + Textbook Ch. 14-15 (Silberschatz Ch. 14, 15, Stallings Ch. 15)

---

## 33.1 The Security Problem

### Why Security Matters
OS manages valuable resources:
- Programs & processes
- Files & data
- Memory & CPU
- Network resources
- User accounts & credentials

### Security Breach Impact
| Consequence | Description |
|-------------|-------------|
| **Unauthorized Access** | Access to restricted data/systems |
| **Data Theft/Disclosure** | Confidential info exposed |
| **Data Modification** | Integrity violation |
| **Data Destruction** | Availability breach |
| **Resource Misuse** | Theft of service (CPU, storage) |
| **Service Disruption** | Denial of Service |

---

## 33.2 Security Violation Types

| Violation Type | Description | CIA Triad |
|----------------|-------------|-----------|
| **Breach of Confidentiality** | Unauthorized reading/disclosure | Confidentiality |
| **Breach of Integrity** | Unauthorized modification | Integrity |
| **Breach of Availability** | Unauthorized destruction/disruption | Availability |
| **Theft of Service** | Unauthorized resource use | Availability/Integrity |
| **Denial of Service (DoS)** | Prevent legitimate access | Availability |

---

## 33.3 Program Threats

### Definition
- **Program Threat**: Malicious/compromised program attempts unauthorized access, resource misuse, or system damage
- Programs/processes = primary work mechanism → primary attack vector

### Attacker Capabilities via Program Exploitation
| Capability | Description |
|------------|-------------|
| **Unauthorized Data Access** | Read restricted files/data |
| **File Modification/Deletion** | Corrupt or destroy data |
| **Privilege Escalation** | Gain higher privileges (root/admin) |
| **Code Execution** | Run arbitrary malicious code |
| **System Disruption** | Crash, hang, resource exhaustion |

---

## 33.4 Common Program Threats

### Malware Categories
| Threat | Description |
|--------|-------------|
| **Malware** | Malicious software to exploit/disable/damage |
| **Trojan Horse** | Appears legitimate, hides malicious function |
| **Spyware** | Secretly collects user/system info |
| **Ransomware** | Encrypts files, demands ransom |
| **Code Injection** | Inject unauthorized code into program |
| **Virus** | Self-replicating code attached to host |
| **Worm** | Self-replicating, spreads via network |
| **Trap Door/Back Door** | Hidden unauthorized access point |

---

## 33.4 Detailed Threat Analysis

### Malware
| Aspect | Description |
|--------|-------------|
| **Definition** | Software designed to exploit, disable, damage, or gain unauthorized access |
| **Deception** | Appears legitimate while performing malicious actions |
| **Forms** | Trojan, Spyware, Ransomware, Virus, Worm |

---

### Trojan Horse
| Characteristic | Description |
|----------------|-------------|
| **Deception** | Appears legitimate, hides malicious payload |
| **Execution** | Runs with user's privileges |
| **Delivery** | User unknowingly installs/executes |
| **Damage** | Data theft, system modification, backdoor creation |

---

### Spyware
| Aspect | Description |
|--------|-------------|
| **Purpose** | Secretly collect user/system information |
| **Targets** | Browsing, credentials, personal info, files |
| **Exfiltration** | Sends data to attacker without user knowledge |
| **Example** | Keylogger, screen scraper, credential harvester |

---

### Ransomware
| Aspect | Description |
|--------|-------------|
| **Action** | Encrypts victim's files/data |
| **Demand** | Ransom payment for decryption key |
| **Impact** | Data inaccessible without key |
| **Payment** | Often cryptocurrency (untraceable) |

---

### Code Injection
| Aspect | Description |
|--------|-------------|
| **Definition** | Insert unauthorized code into program execution |
| **Cause** | Poor input validation, insecure coding |
| **Impact** | Modify behavior, execute commands, access data, gain control |

#### Buffer Overflow (Classic Example)
```
Program: char buffer[64];
Input:    "A" × 100  (exceeds 64 bytes)
Result:   Overflow → overwrite return address → execute attacker's code
```

| Step | Description |
|------|-------------|
| 1. | Program allocates fixed buffer |
| 2. | Attacker supplies excess data |
| 3. | Overflow overwrites adjacent memory |
| 4. | Crafted input overwrites return address |
| 5. | Program jumps to attacker's code |

---

### Virus
| Property | Description |
|----------|-------------|
| **Structure** | Code fragment embedded in legitimate program/file |
| **Replication** | Infects other programs/files |
| **Trigger** | Requires user action (execute infected file) |
| **Payload** | Modify/destroy files, corrupt programs, crash system, spread |

| Virus Type | Behavior |
|------------|----------|
| **Boot Sector** | Infects boot sector |
| **File Infector** | Attaches to executables |
| **Macro** | Infects documents (Word/Excel) |
| **Polymorphic** | Changes code to evade detection |

---

### Worm
| Property | Virus | Worm |
|----------|-------|------|
| **Attachment** | Needs host program | Standalone |
| **Spread** | User action required | Automatic (network) |
| **Replication** | Infects files | Self-replicates |
| **Propagation** | File sharing, media | Network exploits |

| Worm Impact | Description |
|-------------|-------------|
| **Network Congestion** | Bandwidth consumption |
| **System Slowdown** | Resource consumption |
| **Service Disruption** | Overload services |
| **Secondary Payload** | Install additional malware |

---

### Trap Door / Back Door
| Aspect | Description |
|--------|-------------|
| **Definition** | Hidden entry point bypassing authentication |
| **Origin** | Intentional (dev) or malicious (attacker) |
| **Risk** | Unauthorized system access |
| **Detection** | Code review, auditing, intrusion detection |

---

## 33.5 Principle of Least Privilege

### Definition
> A user or program should be given **only the minimum privileges** required to perform its task.

### Privilege Limitation Dimensions
| Dimension | Application |
|-----------|-------------|
| **Scope** | What resources can be accessed |
| **Time** | How long access is granted |

### Implementation
| Technique | Description |
|-----------|-------------|
| **Role-Based Access Control (RBAC)** | Privileges by role, not user |
| **Capabilities** | Fine-grained tokens for specific operations |
| **Sandboxing** | Isolate process with minimal privileges |
| **Dropping Privileges** | Drop root after initialization |

---

## 33.6 System & Network Threats

### System Threats
| Threat | Description |
|--------|-------------|
| **Buffer Overflow** | Overwrite memory to execute code |
| **Race Condition** | Timing-dependent vulnerability |
| **Privilege Escalation** | Gain higher privileges |
| **Rootkit** | Hide malicious activity |

### Network Threats
| Threat | Description |
|--------|-------------|
| **Eavesdropping** | Intercept network traffic |
| **Man-in-the-Middle** | Intercept/modify communications |
| **Replay Attack** | Re-send captured valid data |
| **Session Hijacking** | Take over authenticated session |
| **DDoS** | Distributed Denial of Service |

---

## 33.7 Defense Mechanisms

### Prevention
| Mechanism | Description |
|-----------|-------------|
| **Input Validation** | Sanitize all inputs |
| **Bounds Checking** | Prevent buffer overflows |
| **ASLR** | Address Space Layout Randomization |
| **DEP/NX** | Data Execution Prevention |
| **Stack Canaries** | Detect stack smashing |

### Detection
| Mechanism | Description |
|-----------|-------------|
| **Intrusion Detection (IDS)** | Monitor for suspicious activity |
| **Antivirus/Anti-malware** | Signature + heuristic scanning |
| **Audit Logs** | Track security events |

### Response
| Action | Description |
|--------|-------------|
| **Quarantine** | Isolate compromised systems |
| **Patch** | Apply security updates |
| **Forensics** | Analyze breach |

---

## 33.7 Key Takeaways

1. **Security Goals** = Confidentiality, Integrity, Availability (CIA)
2. **Program Threats** = Malware, Trojans, Spyware, Ransomware, Viruses, Worms, Code Injection
3. **Buffer Overflow** = Classic code injection via input overflow
4. **Virus vs Worm** = Virus needs host/user action; Worm = standalone + network spread
5. **Back Door** = Hidden unauthorized access
5. **Least Privilege** = Minimum necessary privileges only
6. **Defense** = Input validation, ASLR, DEP, stack canaries, IDS

---

## 33.8 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **CIA Triad** | Confidentiality, Integrity, Availability |
| **Virus vs Worm** | Virus needs host/user action; Worm = standalone + network |
| **Buffer Overflow** | Input exceeds buffer → overwrite return address → code execution |
| **Trojan Horse** | Legitimate appearance, hidden malicious function |
| **Ransomware** | Encrypts files, demands ransom for decryption key |
| **Spyware** | Secretly collects user data (keystrokes, credentials) |
| **Code Injection** | Unauthorized code execution via input validation flaw |
| **Buffer Overflow** | Exceeds buffer → overwrites return address → executes shellcode |
| **Least Privilege** | Minimum necessary privileges only |
| **Trap Door/Backdoor** | Hidden access bypassing authentication |

---

## 33.8 Practice Problems

### Problem 1: Threat Classification
```
Classify: Keylogger, WannaCry, Morris Worm, sudo exploit, phishing email
```

### Problem 2: Buffer Overflow
```
char buf[64]; gets(buf);
Input: 100 bytes of "A" + shellcode address.
What happens?
```

### Problem 3: Virus vs Worm
```
Compare: replication method, trigger, propagation speed
```

### Problem 3: Ransomware
```
How does ransomware typically encrypt files? (AES + RSA)
What defense? (backups, patching, user education)
```

### Problem 4: Least Privilege
```
Web server runs as root. Attacker exploits buffer overflow.
What damage? How does least privilege mitigate?
```

### Problem 5: Code Injection
```
SQL: "SELECT * FROM users WHERE name = '" + input + "'"
Input: ' OR '1'='1
Result?
```

---

*Next: Topic 34 (Access Matrix & Access Control)*