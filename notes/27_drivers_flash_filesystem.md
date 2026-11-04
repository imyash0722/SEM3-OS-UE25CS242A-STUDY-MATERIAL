# Topic 27: Device Drivers, Flash Storage & File System Implementation

**Source**: Lecture 4.3 (Unit 4) + Textbook Ch. 11-12 (Silberschatz Ch. 12, 13, Stallings Ch. 13, 14)

---

## 27.1 Device Drivers

### What is a Device Driver?
- **Definition**: Specialized software component enabling OS to communicate with and control a hardware device
- **Role**: Translator between OS and hardware
- **Benefit**: OS doesn't need to understand internal hardware details
- **Interface**: Provides standard interface for OS to access device

### Examples
| Device | Driver |
|--------|--------|
| Keyboard | Keyboard Driver |
| Mouse | Mouse Driver |
| Printer | Printer Driver |
| HDD/SSD | Disk/Storage Driver |
| Network Card | Network Card Driver |
| USB | USB Driver |

### Driver Architecture
```
User Application → System Call → Kernel → Device Driver → Hardware Device
```

---

## 27.2 Types of Device Drivers

| Type | Data Transfer | Devices |
|------|---------------|---------|
| **Character Device Drivers** | One character/byte at a time | Keyboards, mice, serial ports |
| **Block Device Drivers** | Fixed-size blocks | HDDs, SSDs, USB drives |
| **Network Device Drivers** | Packets | Ethernet cards, Wi-Fi adapters |

---

## 27.3 Device Driver Workflow

```
1. Application Request    → User app requests read/write/print
2. System Call            → App uses system call (read/write)
3. Kernel Processing      → OS kernel identifies device & driver
4. Device Driver          → Converts OS request → device commands
5. Hardware Operation     → Device executes operation
6. Interrupt/Response     → Device signals completion → OS → App
```

### Example: Disk Read
```
Application → read() → Kernel → Disk Driver → SSD/HDD → Interrupt → Kernel → Application
```

---

## 27.4 Linux Driver Development

### Driver Types
| Type | Description |
|------|-------------|
| **Built-in** | Compiled into kernel image |
| **Loadable Kernel Module (LKM)** | Loadable at runtime (.ko files) |

### Development Steps
| Step | Description |
|------|-------------|
| 1. Device Identification | Understand hardware & communication interface |
| 2. Driver Implementation | Write driver in C using Linux Kernel APIs |
| 3. Driver Registration | Register with Linux kernel |
| 4. Device Communication | Implement open, read, write, close |
| 5. Testing & Debugging | Test driver-hardware communication |

### Driver Registration
```c
// Character device example
static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = dev_open,
    .read = dev_read,
    .write = dev_write,
    .release = dev_release,
};

static int __init my_init(void) {
    register_chrdev(major, "mydev", &fops);
    return 0;
}
```

---

## 27.5 Flash Drives & Flash Memory

### What is Flash Storage?
- **Non-volatile**: Retains data without power
- **Uses**: USB drives, SSDs, memory cards, smartphones
- **Advantage over HDD**: No moving parts → faster, shock-resistant

### NAND Flash Organization
```
Flash Chip → Blocks → Pages → Page Data + Spare Area (Metadata, ECC)
```

| Unit | Description |
|------|-------------|
| **Page** | Smallest unit for read/write (typically 4KB-16KB) |
| **Block** | Collection of pages; erase unit |
| **Spare Area** | Metadata, ECC, wear info |

### NAND Flash Types
| Type | Bits/Cell | Characteristics |
|------|-----------|-----------------|
| **SLC** | 1 | Fast, reliable, high endurance (100K cycles) |
| **MLC** | 2 | Higher capacity, moderate endurance |
| **TLC** | 3 | High capacity, widely used (3K cycles) |
| **QLC** | 4 | Very high capacity, lower endurance (1K cycles) |

### Flash Operations
| Operation | Level |
|-----------|-------|
| **Read** | Page level |
| **Write** | Page level |
| **Erase** | Block level (entire block) |

> **Key Constraint**: Cannot overwrite page directly; must erase block first

---

## 27.6 Flash Storage Management

### Challenges
| Limitation | Impact |
|------------|--------|
| **Limited write/erase cycles** | Cells wear out (SLC: 100K, MLC: 10K, TLC: 3K, QLC: 1K) |
| **No in-place overwrite** | Must erase before rewrite |
| **Erase at block level** | Coarse granularity |

### Management Techniques

| Technique | Purpose | How It Works |
|-----------|---------|--------------|
| **Flash Translation Layer (FTL)** | Map logical → physical addresses | Hides flash internals from OS |
| **Wear Leveling** | Distribute writes evenly | Static/dynamic algorithms |
| **Garbage Collection** | Reclaim space | Move valid data, erase obsolete blocks |
| **Bad Block Management** | Handle defects | Mark bad blocks, remap |

### FTL Functions
| Function | Description |
|----------|-------------|
| **Address Mapping** | Logical Block Address (LBA) → Physical Page |
| **Wear Leveling** | Distribute writes across blocks |
| **Garbage Collection** | Reclaim blocks with invalid data |
| **Bad Block Management** | Detect & isolate bad blocks |

### Wear Leveling Algorithms
| Algorithm | Description |
|-----------|-------------|
| **Dynamic** | Move only hot data; simpler |
| **Static** | Move cold data too; better distribution |

### Garbage Collection
```
1. Identify blocks with obsolete (stale) data
2. Read valid pages → copy to new block
3. Erase old block
3. Update FTL mapping table
```

---

## 27.7 Flash vs HDD Comparison

| Feature | HDD | SSD / Flash |
|---------|-----|-------------|
| **Moving Parts** | Yes (platters, heads) | No |
| **Access Time** | Higher (ms) | Lower (µs) |
| **Noise** | Mechanical | Silent |
| **Shock Resistance** | Lower | Higher |
| **Erase Requirement** | No | Yes (block-level) |
| **Write Cycles** | Unlimited | Limited (wear out) |

---

## 27.7 Flash Storage & OS Interaction

### OS View
- OS sees SSD/flash as **block storage device**
- File system uses **logical block addresses (LBA)**
- Block device driver communicates with device

### FTL Role
```
OS (LBA) → FTL → Physical Page/Block
```
- FTL hides flash internals from OS
- OS issues logical read/write; FTL handles physical mapping

### Key Operations
| Operation | Flow |
|-----------|------|
| **Read** | OS → Driver → FTL → Flash Page → Data |
| **Write** | OS → FTL selects free page → Write |
| **Erase** | Block-level; FTL manages |
| **TRIM** | OS informs SSD of unused blocks → aids GC |

### TRIM Command
- OS informs SSD which blocks are unused
- Allows SSD to perform GC more efficiently
- Critical for SSD performance over time

---

## 27.8 Layered File System Architecture

### Layered Structure
```
Application Programs
    ↓
Logical File System (API, protection, metadata)
    ↓
File Organization Module (logical → physical blocks, free space)
    ↓
Basic File System (commands to device driver, buffer management)
    ↓
Device Drivers (physical I/O)
    ↓
Hardware Devices
```

### Layer Responsibilities
| Layer | Responsibility |
|-------|----------------|
| **Application** | User programs |
| **Logical FS** | API, metadata, protection, directory structure |
| **File Org** | Logical→physical blocks, free space, allocation |
| **Basic FS** | Buffer/caching, device driver commands |
| **Device Driver** | Hardware-specific I/O |
| **Hardware** | Physical device |

---

## 27.8 File System Structure

### On-Disk Structures
| Structure | Purpose |
|---------|---------|
| **Boot Control Block** | Boot info (first block if bootable) |
| **Volume Control Block (Superblock)** | FS metadata: total/free blocks, block size |
| **Directory Structure** | Names ↔ inode numbers |
| **File Control Block (FCB/inode)** | File metadata: permissions, size, dates, pointers |

### In-Memory Structures
| Structure | Purpose |
|---------|---------|
| **Mount Table** | Mounted FS, mount points, types |
| **System-wide Open File Table** | FCB copies, open counts |
| **Per-Process Open File Table** | File handles, pointers |
| **Buffers/Cache** | Data blocks in memory |

---

## 27.9 File System Layers (Detailed)

### Layer Functions
| Layer | Functions |
|-------|-----------|
| **Logical FS** | API, metadata, directory structure, protection |
| **File Org** | Logical↔physical blocks, free space, allocation |
| **Basic FS** | Commands to driver, buffer/cache management |
| **Device Driver** | Hardware I/O, interrupts |

### Key Data Structures
| Structure | Location | Content |
|---------|----------|---------|
| **Inode** | Disk + Memory | File metadata (mode, owner, size, timestamps, block pointers) |
| **Directory Entry** | Disk | Filename → inode mapping |
| **Superblock** | Disk + Memory | FS params: block size, free blocks, root inode |
| **Open File Table** | Kernel | Per-process + system-wide entries |

---

## 27.9 Virtual File Systems (VFS)

### Purpose
- **Abstraction layer**: Single API for multiple filesystem types
- **Separates** generic operations from implementation details

### VFS Architecture
```
System Calls → VFS Interface → Specific FS (ext4, xfs, nfs, fat, etc.)
```

### VFS Benefits
| Benefit | Description |
|---------|-------------|
| **Uniform API** | Same syscalls for ext4, xfs, nfs, fat, etc. |
| **Extensibility** | Add new FS without changing kernel |
| **Network FS** | Transparent remote access (NFS, CIFS) |
| **vnodes** | Generic inode abstraction (local + remote) |

### VFS Operation Flow
```
open() → VFS → specific FS (ext4) → device driver → disk
```

### VFS Key Objects
| Object | Purpose |
|--------|---------|
| **Superblock** | FS-specific info (per mounted FS) |
| **Inode** | File metadata (vnode for VFS) |
| **Dentry** | Directory entry cache (name→inode) |
| **File** | Open file instance (per-process) |

---

## 27.10 Key Takeaways

1. **Device Drivers** = OS↔Hardware translators; char/block/network types
2. **Linux Drivers** = Built-in or loadable modules; register with kernel
3. **Flash Storage** = NAND (SLC/MLC/TLC/QLC); page write, block erase
4. **FTL** = Logical→physical mapping; wear leveling, GC, bad block mgmt
5. **TRIM** = OS tells SSD which blocks unused → better GC
6. **Layered FS** = Logical FS → File Org → Basic FS → Device Driver
7. **VFS** = Single API for multiple FS types; vnodes unify local/remote
7. **Inodes/FCBs** = Core metadata structures (disk + memory)

---

## 27.10 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **Device driver types** | Character (byte), Block (blocks), Network (packets) |
| **Flash write/erase** | Page write, Block erase |
| **Wear leveling** | Distribute writes to prevent early block wear |
| **FTL** | Maps logical→physical; hides flash complexity |
| **TRIM** | OS tells SSD unused blocks; aids GC |
| **VFS** | Uniform API for multiple FS; vnodes |
| **Layered FS** | Logical→File Org→Basic→Driver→Hardware |
| **Inode** | File metadata (permissions, size, block pointers) |

---

## 27.11 Practice Problems

### Problem 1: Driver Types
```
Classify: Keyboard, SSD, Ethernet card, USB drive
```

### Problem 2: Flash Operations
```
Page size: 4KB, Block: 256 pages.
How many writes before erase needed?
```

### Problem 3: FTL
```
Explain how FTL enables OS to treat flash as block device.
```

### Problem 4: Wear Leveling
```
Compare dynamic vs static wear leveling.
```

### Problem 5: VFS
```
How does VFS enable mounting ext4 and NFS with same syscalls?
```

### Problem 6: FTL + TRIM
```
Why is TRIM important for SSD performance?
```

---

*Next: Topic 28 (Allocation Methods & Free Space Management)*