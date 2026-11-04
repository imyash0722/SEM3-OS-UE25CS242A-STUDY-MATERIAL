# Topic 24: File System — File Concept & Operations

**Source**: Lecture 4.1.2 (Unit 4) + Textbook Ch. 10-11 (Silberschatz Ch. 10, 11, Stallings Ch. 11, 12)

---

## 24.1 File Concept

### Definition
- **File**: Logical storage unit; a sequence of bits, bytes, lines, or records
- **Meaning**: Defined by file's creator and user
- **Content**: Source/executable programs, numeric/text data, photos, music, video, etc.
- **Storage**: Data must be in files to be written to disk

### File vs Disk
| File (Logical) | Disk (Physical) |
|----------------|-----------------|
| Abstract view | Hardware storage |
| Sequence of bits/bytes/records | Magnetic/optical media |
| User-defined meaning | Block/sector organization |

### File Data Types
| Type | Examples |
|------|----------|
| **Numeric** | Integers, floats, scientific data |
| **Alphabetic** | Text documents, source code |
| **Alphanumeric** | Mixed text/numbers |
| **Binary** | Executables, images, audio, video, compressed files |

---

## 24.2 File Attributes

| Attribute | Description |
|-----------|-------------|
| **Name** | Human-readable identifier (only human-readable part) |
| **Identifier** | Unique tag (number) within file system |
| **Type** | Needed for systems supporting different types |
| **Location** | Pointer to file location on device |
| **Size** | Current file size (bytes, blocks) |
| **Protection** | Access controls (read/write/execute) |
| **Time/Date/User** | Creation, modification, access timestamps; owner ID |

### Attribute Storage
- All file metadata stored in **directory structure** on disk
- Directory entry maps filename → attributes + location

---

## 24.3 File Operations

### Basic Operations
| Operation | Description |
|-----------|-------------|
| **Create** | Allocate space, make directory entry |
| **Write** | Write at write pointer location; advance pointer |
| **Read** | Read at read pointer location; advance pointer |
| **Reposition (Seek)** | Move file pointer via `lseek()`; no I/O |
| **Delete** | Remove directory entry; free space |
| **Truncate** | Erase contents, keep attributes; set size to 0 |
| **Append** | Add data at end of file |
| **Open** | `open()` system call; creates open file table entry |
| **Close** | Release resources; decrement open count |

### File Pointers & Open File Table
| Component | Purpose |
|-----------|---------|
| **File Pointer** | Per-process pointer to last read/write location |
| **Open File Table** | Tracks all open files system-wide |
| **File-Open Count** | Reference count; removes entry when count = 0 |

### Open File Information
| Information | Description |
|-------------|-------------|
| **File Pointer** | Current read/write position |
| **File-Open Count** | Number of processes with file open |
| **Disk Location** | Physical location on disk |
| **Access Rights** | Permissions for this open instance |

---

## 24.4 File Locking

### Purpose
- **Concurrency control** for shared files
- **Similar to reader-writer locks**

### Lock Types
| Lock Type | Behavior | Similar To |
|-----------|----------|------------|
| **Shared Lock** | Multiple processes can hold concurrently | Reader lock |
| **Exclusive Lock** | Only one process can hold | Writer lock |

### Locking Modes
| Mode | Behavior |
|------|----------|
| **Mandatory** | OS enforces; access denied if lock conflict |
| **Advisory** | Processes check locks voluntarily; OS doesn't enforce |

```
Mandatory: OS blocks access if lock conflict
Advisory:  Processes check lock status; cooperation required
```

---

## 24.5 File Types

### Classification by Extension/Content

| Type | Extensions | Description |
|------|------------|-------------|
| **Executable** | `.exe`, `.com`, `.bin` | Ready-to-run machine code |
| **Object** | `.obj`, `.o` | Compiled, not linked |
| **Source Code** | `.c`, `.cc`, `.java`, `.pas`, `.asm`, `.a` | Source code in various languages |
| **Batch/Script** | `.bat`, `.sh` | Commands for interpreter |
| **Text/Document** | `.txt`, `.wp`, `.tex`, `.rtf`, `.doc` | Textual data, word processor formats |
| **Library** | `.lib`, `.a`, `.so`, `.dll` | Libraries of routines |
| **Print/View** | `.ps`, `.pdf`, `.jpg` | Formatted for printing/viewing |
| **Archive** | `.arc`, `.zip`, `.tar` | Grouped files, often compressed |
| **Multimedia** | `.mpeg`, `.mov`, `.rm`, `.mp3`, `.avi` | Audio/video |

### OS Support for File Types
| Approach | Description |
|----------|-------------|
| **OS-recognized** | OS understands types; enforces rules |
| **Program-decided** | Application interprets structure (Unix/Linux) |

---

## 24.5 File Structure

### Internal Structure Options
| Structure | Description |
|-----------|-------------|
| **None** | Sequence of words/bytes (byte stream) |
| **Simple Record** | Fixed or variable length records |
| **Lines** | Text lines (terminated by newline) |
| **Fixed Length** | All records same size |
| **Variable Length** | Records vary in size |
| **Complex** | Formatted documents, relocatable load files |

### Simulating Complex Structures
- Can simulate complex structures with byte stream + control characters
- **Who decides structure**: OS (some systems) or Program (Unix-like)

---

## 24.6 Access Methods

### 1. Sequential Access
```
read next    → read next record, advance pointer
write next   → write at current position, advance
reset        → rewind to beginning
```
- **Simplest**: Process records in order
- **Use case**: Text files, logs, sequential data processing

### 2. Direct Access (Relative Access)
```
read n       → read record n
write n      → write record n
position to n → move to record n
read next    → read record n+1
write next   → write record n+1
```
- **Fixed-length logical records** (key requirement)
- **n** = relative block number (index from start)
- **Random access** to any record

### Comparison
| Aspect | Sequential | Direct |
|--------|------------|--------|
| **Access Pattern** | In order | Any order |
| **Record Size** | Variable | Fixed |
| **Seek** | No | Yes (position to n) |
| **Use Case** | Text, logs | Databases, indexes |

---

## 24.6 Simulation of Sequential on Direct Access

```c
// Direct access file simulating sequential
int cp = 0;  // current position

// Read next
read(cp);
cp = cp + 1;

// Write next
write(cp);
cp = cp + 1;
```

### Systems Support
| System | Access Support |
|--------|----------------|
| Some | Sequential only |
| Some | Direct only |
| Most | Both |

---

## 24.7 Key Takeaways

1. **File** = logical storage unit (bits/bytes/records); meaning defined by creator
2. **Attributes** = name, ID, type, location, size, protection, timestamps
3. **Operations** = create, read, write, seek, delete, truncate, open, close
4. **File Pointer** = per-process position; Open File Table = system-wide tracking
5. **Locking** = shared (readers) vs exclusive (writers); mandatory vs advisory
6. **File Types** = OS-recognized vs program-decided; extensions indicate type
6. **Access Methods** = Sequential (stream) vs Direct (random, fixed records)
7. **Simulation** = Sequential on direct via position counter

---

## 24.8 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **File attributes** | Name, ID, type, location, size, protection, time/date/user |
| **File operations** | Create, read, write, seek, delete, truncate, open, close |
| **Open file table** | Tracks open files; per-process file pointer + open count |
| **Shared vs Exclusive lock** | Shared = multiple readers; Exclusive = single writer |
| **Mandatory vs Advisory** | Mandatory = OS enforces; Advisory = cooperation required |
| **File types** | Executable, object, source, batch, text, library, archive, multimedia |
| **Sequential access** | read next, write next, reset |
| **Direct access** | read n, write n, position to n (fixed-length records) |
| **Simulating sequential on direct** | Maintain position counter (cp); increment after each read/write |

---

## 24.9 Practice Problems

### Problem 1: File Attributes
```
List all attributes maintained for an open file.
Which are per-process vs system-wide?
```

### Problem 2: Lock Types
```
Process A holds shared lock on file.
Process B requests exclusive lock.
What happens under mandatory vs advisory locking?
```

### Problem 3: Access Methods
```
Database with 1M fixed-length records (100 bytes each).
Which access method? Why?
If sequential scan of all records: which method?
```

### Problem 4: File Types
```
User downloads file "program.exe".
What type? How does OS know?
What if user renames to "program.txt"?
```

### Problem 5: File Operations
```
Process opens file, reads 100 bytes, writes 50 bytes, seeks to start, reads 100 bytes.
Trace file pointer positions after each operation.
```

---

*Next: Topic 25 (File-System Sharing, Protection & Access Control)*