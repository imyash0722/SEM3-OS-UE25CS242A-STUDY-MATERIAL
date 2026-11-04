# Topic 25: File System — Mounting, Sharing & Protection

**Source**: Lecture 4.2.1 (Unit 4) + Textbook Ch. 10-11 (Silberschatz Ch. 10, 11, Stallings Ch. 11, 12)

---

## 25.1 File System Mounting

### Concept
- **Mount**: Attach a filesystem to directory tree at a **mount point**
- Filesystem must be mounted before it can be accessed
- **Unmount**: Detach filesystem

### Visual Representation
```
Before mount:                    After mount /dev/sdb1 on /mnt/data:
/mnt/data (empty)                /mnt/data → shows /dev/sdb1 contents
```

### Mount Process
1. **Existing FS** (Figure a): Root FS with directories
2. **Unmounted FS** (Figure b): Separate filesystem (e.g., /dev/sdb1)
3. **After Mount** (Figure c): FS attached at mount point

```
Before:                          After mount /dev/sdb1 on /home/users:
/                                 /
├── home                         ├── home
│   └── users (empty)            │   └── users → /dev/sdb1 contents
                                 │       ├── alice
                                 │       ├── bob
                                 │       └── charlie
```

### Mount Table
- OS maintains table of mounted filesystems
- Contains: device, mount point, filesystem type, options

### Unmounting
- **Unmount**: Detach filesystem
- Cannot unmount if files are in use (busy)

---

## 25.2 File Sharing

### Why Share?
- Multi-user systems: users need access to common files
- Collaborative work, shared libraries, common data

### Sharing Mechanisms

| Mechanism | Description |
|-----------|-------------|
| **Protection Scheme** | Permissions control who can access what |
| **Remote Sharing** | Files shared across network |

---

## 25.3 User & Group IDs

### Multi-User Identification
| ID Type | Purpose |
|---------|---------|
| **User ID (UID)** | Identifies user; per-user permissions |
| **Group ID (GID)** | Groups users; group access rights |

### File/Directory Ownership
| Entity | Ownership |
|--------|-----------|
| **File/Directory Owner** | Creator (UID) |
| **File/Directory Group** | Group owner (GID) |

---

## 25.4 Remote File Systems

### Sharing Methods
| Method | Description |
|--------|-------------|
| **Manual** | FTP, manual copy |
| **Automatic/Seamless** | Distributed file systems (NFS, AFS) |
| **Semi-automatic** | Web-based (HTTP/HTTPS) |

### Client-Server Model
```
Client                    Server
─────────────────────────────────────────
mount remote FS        exports FS
NFS/CIFS client        NFS/CIFS server
```

### Key Protocols
| Protocol | Platform | Description |
|----------|----------|-------------|
| **NFS** | Unix/Linux | Network File System (Sun/RFC) |
| **CIFS/SMB** | Windows | Common Internet File System |
| **AFS** | Cross-platform | Andrew File System |
| **DFS** | Windows | Distributed File System |

### NFS Architecture
```
Client System Calls → Client Kernel → RPC (UDP/TCP) → NFS Server → Server File System
```

### Distributed Information Systems
- **LDAP**: Lightweight Directory Access Protocol
- **DNS**: Domain Name System
- **NIS**: Network Information Service
- **Active Directory**: Microsoft directory service

---

## 25.5 File Protection

### Access Types
| Access | Description |
|--------|-------------|
| **Read** | View file contents |
| **Write** | Modify file contents |
| **Execute** | Run as program |
| **Append** | Add to end only |
| **Delete** | Remove file |
| **List** | List directory contents |

### Protection Goal
File owner/creator controls:
- **What** can be done (which operations)
- **By whom** (which users/groups)

---

## 25.5 Unix/Linux Protection Model

### Three Classes of Users
| Class | Symbol | Permissions |
|-------|--------|-------------|
| **Owner** | `u` | Set by creator |
| **Group** | `g` | Users in file's group |
| **Others** | `o` | Everyone else |

### Permission Bits
| Permission | Binary | Octal | Meaning |
|------------|--------|-------|---------|
| Read | 100 | 4 | View contents |
| Write | 010 | 2 | Modify |
| Execute | 001 | 1 | Run/Traverse |

### Typical Permission Values
| Class | Permissions | Binary | Octal |
|-------|-------------|--------|-------|
| Owner | RWX | 111 | 7 |
| Group | RW- | 110 | 6 |
| Others | --X | 001 | 1 |

### Example: `chmod 761 game`
```
Owner (7):  RWX (read, write, execute)
Group (6):  RW- (read, write)
Others (1): --X (execute only)
```

---

## 25.6 Groups & Access Control

### Group Management
```bash
# Create group
groupadd G

# Add users to group
usermod -a -G G user1
usermod -a -G G user2

# Change file group
chgrp G game

# Set permissions
chmod 761 game
```

### Group Benefits
- **Simplify management**: Grant access to multiple users at once
- **Project-based access**: Add project members to group
- **Hierarchical**: Users can belong to multiple groups

---

## 25.6 Advanced Access Control

### Access Control Lists (ACLs)
- **Per-file list** of users + specific permissions
- More granular than owner/group/others
- `setfacl`, `getfacl` commands

### Capabilities
- **Unforgeable tokens** granting specific access rights
- More flexible than ACLs

### Mandatory Access Control (MAC)
- **System-enforced** policies (e.g., SELinux, AppArmor)
- Cannot be overridden by users

---

## 25.7 Key Takeaways

1. **Mounting** = attach filesystem at mount point; unmount to detach
2. **NFS/CIFS** = standard network file sharing protocols
3. **Protection** = owner controls what/by whom; types: read, write, execute, append, delete, list
4. **Unix Permissions** = owner/group/others × read/write/execute (rwx = 7)
5. **Groups** = simplify multi-user access management
6. **ACLs** = finer-grained control beyond owner/group/others

---

## 25.8 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Mounting** | Filesystem must be mounted before access; attaches at mount point |
| **NFS vs CIFS** | NFS = Unix standard; CIFS = Windows standard |
| **Unix permissions** | Owner/Group/Others × rwx = 3×3 bits = 9 bits |
| **chmod 761** | Owner: rwx, Group: rw-, Others: --x |
| **Groups** | Simplify multi-user access; `chgrp`, `chmod` |
| **Access types** | Read, Write, Execute, Append, Delete, List |
| **MAC vs DAC** | MAC = system-enforced (SELinux); DAC = user-controlled |

---

## 25.9 Practice Problems

### Problem 1: Mounting
```
/dev/sdb1 mounted on /home/users when /home/users already has files.
What happens to existing files?
```

### Problem 2: Permissions
```
File has mode 754 (rwxr-xr--).
User is in file's group but not owner.
Can they write? Execute?
```

### Problem 3: NFS
```
Client mounts server:/export via NFS.
Server crashes. What happens to client's open files?
```

### Problem 4: Group Management
```
Create group 'projectX', add users alice,bob,charlie.
Set directory /projectX to be owned by group with rwx for group.
```

### Problem 5: ACL
```
File has mode 640. User 'dave' (not owner, not in group) needs read access.
How to grant without changing mode or group?
```

---

*Next: Topic 26 (File-System Implementation & Directory Implementation)*