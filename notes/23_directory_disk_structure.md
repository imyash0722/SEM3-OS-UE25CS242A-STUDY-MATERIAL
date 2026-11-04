# Topic 23: File System — Directory & Disk Structure

**Source**: Lecture 4.1 (Unit 4) + Textbook Ch. 10-11 (Silberschatz Ch. 10, 11, Stallings Ch. 11, 12)

---

## 23.1 Overview: File System & Directory

### What is a File System?
- **Directory**: A collection of nodes containing information about all files
- Both directory structure and files reside on disk
- Maps logical file names → physical disk locations

### Disk Structure
- **Disk partitions**: Disk can be subdivided into partitions
- **RAID**: Disks/partitions can be RAID protected against failure
- **Raw vs Formatted**: Disk/partition can be used raw (no file system) or formatted with a file system
- **Partitions** = minidisks, slices
- **Volume**: Entity containing file system; each volume tracks its file system info in device directory or volume table of contents
- **Special-purpose FS**: Many special-purpose FS coexist with general-purpose FS

### LVM (Logical Volume Manager)
```
Physical Volumes → Partitions → Logical Volumes → File Systems
/dev/sdb1        /dev/sdb1    /home (ext3)  /data (xfs)
/dev/sdc2        /dev/sdc2
```
- Physical volumes → Partitions → Logical Volumes → File Systems
- Allows flexible volume management across multiple physical disks

---

## 23.2 Disk Structure

### Disk Organization
- **Platters**: Rigid disks coated with magnetic material
- **Tracks**: Concentric circles on each surface
- **Sectors**: Smallest addressable unit (typically 512 bytes or 4KB)
- **Cylinders**: Set of tracks at same radius across all platters

### Disk Addressing
```
Logical Block Address (LBA) = (Cylinder × Heads × Sectors/Track) + (Head × Sectors/Track) + Sector
```

### Disk Controller
- Hardware interface between CPU and disk
- Manages: seek time, rotational latency, transfer time
- Handles bad block mapping, caching

---

## 23.3 Directory Structure

### Operations on Directory
| Operation | Description |
|-----------|-------------|
| **Search** | Locate file by name |
| **Create** | Add new file entry |
| **Delete** | Remove file entry |
| **List** | Display directory contents |
| **Rename** | Change file name |
| **Traverse** | Walk directory tree |

---

## 23.4 Directory Organization Principles

### Design Goals
| Goal | Description |
|------|-------------|
| **Efficiency** | Locate file quickly |
| **Naming** | Convenient to users; allow same name for different files |
| **Grouping** | Logical grouping by properties (all Java programs, all games) |

---

## 23.5 Single-Level Directory

### Structure
- **Single directory** for all users
- All files in one directory

### Problems
| Problem | Description |
|---------|-------------|
| **Naming** | No two files can have same name |
| **Grouping** | Cannot group files logically |

```
Directory: cat, bo, a, test, da, mail, cont, hex, record
```

---

## 23.6 Two-Level Directory

### Structure
- **Separate directory for each user**
- Path name: `/user/file`

### Advantages
- Different users can have same file name
- Efficient searching (smaller per-user directory)

### Limitations
- **No grouping capability** (all files of user in one directory)

```
User1: [file1, file2, file3]
User2: [file1, file4, file5]
```

---

## 23.7 Tree-Structured Directories (Most Common)

### Structure
- **Root directory** at top
- Every file has a **unique path** from root
- Supports subdirectories to arbitrary depth

```
Root
├── home
│   ├── user1
│   │   ├── docs
│   │   └── projects
│   └── user2
├── bin
├── etc
└── var
```

### Features
| Feature | Description |
|---------|-------------|
| **Efficient searching** | Path-based lookup |
| **Grouping** | Logical grouping by properties |
| **Current directory** | Working directory (`.`) |
| **Path names** | Absolute (`/home/user/file`) or relative (`../file`) |

### Operations
| Command | Action |
|---------|--------|
| `mkdir <dir>` | Create subdirectory in current directory |
| `rm <file>` | Delete file |
| `rm -r <dir>` | Delete directory + entire subtree |
| `cd <path>` | Change current directory |
| `pwd` | Print working directory |

### Deletion Semantics
```
mkdir count (in /mail)
→ Creates /mail/count

rm -r mail
→ Deletes entire subtree rooted at mail
```

---

## 23.8 Acyclic-Graph Directories

### Motivation
- **Share subdirectories and files** between users
- Same file/subdirectory in multiple directories
- Example: Two programmers working on joint project

### Structure
- **Directed acyclic graph** (no cycles)
- Same file/subdirectory appears in multiple directories
- **Aliasing**: Two different names (paths) for same file

```
User A: /home/a/project/src
User B: /home/b/project/src
         ↓ (same physical file)
Shared: /shared/project/src
```

### Aliasing Problems
| Issue | Description |
|-------|-------------|
| **Dangling pointer** | If A deletes, B's pointer becomes invalid |
| **Multiple copies** | Confusion about which is "real" |

### Solutions for Dangling Pointers
| Solution | Description |
|----------|-------------|
| **Backpointers** | Maintain pointers from file to all directories referencing it |
| **Daisy chain** | Chain of backpointers |
| **Entry-hold-count** | Reference count; delete when count = 0 |
| **New directory entry type** | Special link entries |

---

## 23.9 Links

### Types of Links
| Type | Description |
|------|-------------|
| **Hard Link** | Another name (directory entry) for existing file; same inode |
| **Symbolic Link (Soft Link)** | Pointer to pathname; can cross filesystems |

### Link Operations
| Operation | Hard Link | Symbolic Link |
|---------|-----------|---------------|
| Create | `ln file link` | `ln -s file link` |
| Delete original | Link still works | Becomes dangling |
| Cross filesystem | No | Yes |
| Directory | Usually not allowed | Allowed |

---

## 23.10 General Graph Directory

### Structure
- Allows **cycles** within directory structure
- Multiple directories can be derived from more than one parent

### Advantages
- Maximum flexibility in sharing
- Complex relationships modeled naturally

### Disadvantages
| Disadvantage | Description |
|--------------|-------------|
| **Costly** | More complex traversal |
| **Garbage collection** | Need to traverse entire FS to find accessible objects |
| **Cycles** | Can cause infinite loops in traversal |

### Cycle Prevention
| Method | Description |
|--------|-------------|
| **Link restriction** | Allow only links to files, not subdirectories |
| **Cycle detection** | Run cycle detection algorithm on each new link |
| **Garbage collection** | Periodic full traversal to mark accessible objects |

---

## 23.11 File System Mounting

### Concept
- **Mount**: Attach a filesystem to directory tree at mount point
- **Unmount**: Detach filesystem

```
Before mount:          After mount /dev/sdb1 on /mnt/data:
/mnt/data (empty)      /mnt/data → shows /dev/sdb1 contents
```

### Mount Table
- OS maintains table of mounted filesystems
- Contains: device, mount point, filesystem type, options

---

## 23.12 File Sharing & Protection

### Access Control
| Method | Description |
|--------|-------------|
| **Access Control List (ACL)** | Per-file list of users + permissions |
| **Permission Bits** | Owner/Group/Other (rwx) |
| **Capabilities** | Unforgeable tokens granting specific access |

### Remote File Systems
- **NFS**: Network File System (Unix)
- **SMB/CIFS**: Server Message Block (Windows)
- **AFS**: Andrew File System

---

## 23.12 Key Takeaways

1. **Directory** = logical organization of files; maps names → metadata
2. **Disk** = physical storage; partitioned → volumes → file systems
3. **Tree-structured directories** = most common; supports hierarchy, grouping
4. **Acyclic-graph** = enables sharing; requires cycle prevention
5. **Links** = hard (same inode) vs symbolic (path pointer)
5. **Mounting** = attaches filesystem to directory tree
6. **Protection** = ACLs, permission bits, capabilities

---

## 23.13 Practice Problems

### Problem 1: Directory Structure
```
Design a directory structure for a university CS department
with faculty, students, courses, and research projects.
```

### Problem 2: Link Behavior
```
File A has hard link B and symbolic link C.
Original file A is deleted.
What happens to B and C?
```

### Problem 3: Mounting
```
Explain what happens when you mount /dev/sdb1 on /home/user/data
when /home/user/data already contains files.
```

### Problem 4: Acyclic Graph
```
Two users share a subdirectory. User A deletes a file.
How does the system prevent dangling pointers for User B?
```

### Problem 5: Disk Structure
```
Calculate sectors for: 500GB disk, 4KB sectors, 256 heads, 65535 cylinders
```

---

*Next: Topic 24 (File Concept & Access Methods)*