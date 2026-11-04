# Topic 26: Shell Programming — AWK & SED

**Source**: Lecture 4.13.1 (Unit 4) + Textbook Ch. 10 (Stevens & Rago Ch. 9, 10)

---

## 26.1 Text Processing Tools

### Purpose
- **Process text files**: log analysis, data extraction, report generation
- **Data extraction & transformation**: parse, filter, reformat text

### Common Tools
| Tool | Type | Primary Use |
|------|------|-------------|
| **awk** | Programming language | Data processing, field manipulation |
| **sed** | Stream editor | Text editing, line-based transformations |

---

## 26.2 AWK — Introduction

### What is AWK?
- **Scripting language** for pattern scanning and processing
- **Works line-by-line** on input files
- **Pattern → Action** paradigm

### Use Cases
| Use Case | Description |
|----------|-------------|
| **Data filtering** | Select lines matching pattern |
| **Report generation** | Format and summarize data |
| **Data extraction** | Pull specific fields from structured text |

### How AWK Works
```
Input File → Read line by line → Split into fields → Apply Pattern → Action → Output
```

### AWK Processing Model
```
For each line in input:
    1. Read line
    2. Split into fields ($1, $2, $3... $NF)
    3. Test pattern condition
    4. If true → execute action
    5. Repeat for next line
```

---

## 26.3 AWK Syntax

### Basic Syntax
```bash
awk 'pattern {action}' file
```

### Components
| Part | Description |
|------|-------------|
| **pattern** | Condition to match (regex, comparison, etc.) |
| **action** | Code to execute when pattern matches |
| **file** | Input file(s) |

### Simple Example
```bash
# Print first and fourth fields of each line
awk '{print $1,$4}' employee.txt
```

---

## 26.4 AWK — Important Operations

### Field Access
| Variable | Meaning |
|----------|---------|
| `$1, $2, ...` | Field 1, 2, etc. |
| `$0` | Entire line |
| `$NF` | Last field |
| `NF` | Number of fields in current line |

### Built-in Variables
| Variable | Meaning |
|----------|---------|
| **NR** | Number of records (lines) processed |
| **NF** | Number of fields in current line |
| **FS** | Field separator (default: whitespace) |
| **OFS** | Output field separator |
| **RS** | Record separator (default: newline) |
| **ORS** | Output record separator |

### Conditionals
```awk
if (condition) { action }
if (condition) { action } else { action }
```

### Operators
| Type | Operators |
|------|-----------|
| **Comparison** | `==`, `!=`, `<`, `>`, `<=`, `>=` |
| **Logical** | `&&`, `\|\|`, `!` |
| **Regex Match** | `~`, `!~` |

---

## 26.5 AWK — Selected Examples

### Example 1: Print Selected Columns
```bash
# Print 1st and 4th fields
awk '{print $1,$4}' file.txt
```

### Example 2: Pattern Matching
```bash
# Print lines containing "manager"
awk '/manager/ {print}' file.txt
```

### Example 3: Count Lines
```bash
# Print total number of lines
awk 'END {print NR}' file.txt
```

### Example 4: Conditional Processing
```bash
# Print lines where 3rd field > 100
awk '$3 > 100 {print $1, $3}' data.txt

# Print lines where 1st field starts with "error"
awk '$1 ~ /^error/ {print}' log.txt
```

### Example 5: Arithmetic & Reporting
```bash
# Sum 3rd column
awk '{sum += $3} END {print sum}' data.txt

# Average of 2nd column
awk '{sum += $2} END {print sum/NR}' data.txt

# Max of 4th column
awk 'BEGIN {max=0} $4 > max {max=$4} END {print max}' data.txt
```

### Example 6: Field Separator
```bash
# CSV file (comma-separated)
awk -F',' '{print $1, $3}' data.csv

# Colon-separated (like /etc/passwd)
awk -F':' '{print $1, $3}' /etc/passwd
```

---

## 26.6 SED — Introduction

### What is SED?
- **Stream Editor** for text transformation
- **Single pass** through input
- **Pipeline-friendly**: `command | sed '...' | command`

### Syntax
```bash
sed 'command' file
```

### Basic Example
```bash
# Replace first "hello" with "world" on each line
sed 's/hello/world/' file.txt
```

---

## 26.7 SED — Common Operations

| Command | Syntax | Description |
|---------|--------|-------------|
| **Substitute** | `s/old/new/` | Replace first occurrence per line |
| **Substitute Global** | `s/old/new/g` | Replace all occurrences per line |
| **Delete** | `d` | Delete line |
| **Print** | `p` | Print line (with `-n` to suppress default) |
| **Insert** | `i\text` | Insert before line |
| **Append** | `a\text` | Append after line |

---

## 26.7 SED — Selected Examples

### Example 1: Substitute (Replace)
```bash
# Replace first "hello" with "world" per line
sed 's/hello/world/' file.txt

# Replace ALL "hello" with "world" per line
sed 's/hello/world/g' file.txt

# Case-insensitive
sed 's/hello/world/gi' file.txt
```

### Example 2: Delete Lines
```bash
# Delete line 2
sed '2d' file.txt

# Delete lines 4-6
sed '4,6d' file.txt

# Delete lines matching pattern
sed '/error/d' file.txt
```

### Example 3: Print Specific Lines
```bash
# Print only line 2 (suppress default output with -n)
sed -n '2p' file.txt

# Print lines 2-5
sed -n '2,5p' file.txt
```

### Example 4: Range Operations
```bash
# Delete lines 4-6
sed '4,6d' file.txt

# Print lines between patterns
sed -n '/start/,/end/p' file.txt
```

### Example 5: In-Place Editing
```bash
# Modify file in-place (backup with .bak)
sed -i.bak 's/old/new/g' file.txt

# In-place without backup
sed -i 's/old/new/g' file.txt
```

---

## 26.8 AWK vs SED Comparison

| Feature | AWK | SED |
|---------|-----|-----|
| **Type** | Programming language | Stream editor |
| **Focus** | Data processing | Text editing |
| **Works On** | Fields (columns) | Lines |
| **Complexity** | Higher (full language) | Simpler |
| **Variables** | Yes (NR, NF, custom) | Limited |
| **Arithmetic** | Yes | No |
| **Conditionals** | Full if/else/while | Limited |
| **Best For** | Reports, data extraction, math | Line edits, substitutions, deletions |

### When to Use Which
| Scenario | Tool |
|----------|------|
| Column extraction, math, reports | **AWK** |
| Line deletion, substitution, simple edits | **SED** |
| Complex data processing | **AWK** |
| Simple search/replace in pipeline | **SED** |

---

## 26.9 Combined Examples

### Example: Process Log File
```bash
# Extract IP addresses and count occurrences (AWK)
awk '{print $1}' access.log | sort | uniq -c | sort -nr

# Same with AWK only
awk '{ip[$1]++} END {for (i in ip) print ip[i], i}' access.log
```

### Example: Clean CSV with SED then Process with AWK
```bash
# Remove quotes from CSV, then process
sed 's/"//g' data.csv | awk -F',' '{print $2, $5}'
```

---

## 26.10 Key Takeaways

1. **AWK** = field-oriented programming language; NR/NF, math, conditionals
2. **SED** = stream editor; line-oriented; substitute, delete, print
3. **AWK syntax**: `awk 'pattern {action}' file`
4. **SED syntax**: `sed 'command' file`
4. **AWK fields**: `$1, $2...$NF`; built-ins: NR, NF, FS, OFS
5. **SED commands**: `s/old/new/g`, `d`, `p`, `2d`, `4,6d`, `-n '2p'`
6. **AWK vs SED**: AWK = data processing/math; SED = text editing

---

## 26.11 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **AWK field separator** | `-F','` or `-F':'` |
| **NR vs NF** | NR = record number (line); NF = field count |
| **SED substitute** | `s/old/new/g` (g = global) |
| **SED delete line 2** | `sed '2d' file` |
| **SED print line 3 only** | `sed -n '3p' file` |
| **AWK vs SED** | AWK = programming language, fields; SED = stream editor, lines |
| **AWK END block** | Executes after all input processed |

---

## 26.10 Practice Problems

### Problem 1: AWK Column Extraction
```bash
# /etc/passwd format: user:pass:uid:gid:gecos:home:shell
# Extract username and home directory
awk -F':' '{print $1, $6}' /etc/passwd
```

### Problem 2: SED Line Deletion
```bash
# Delete lines 10-20 and all lines containing "debug"
sed -e '10,20d' -e '/debug/d' log.txt
```

### Problem 3: AWK Sum & Average
```bash
# File: value1 value2 value3 (space-separated)
# Print sum of column 2 and average of column 3
awk '{sum2+=$2; sum3+=$3} END {print "Sum:", sum2, "Avg:", sum3/NR}' data.txt
```

### Problem 4: SED In-Place Edit
```bash
# Replace all "TODO" with "DONE" in all .c files
sed -i 's/TODO/DONE/g' *.c
```

### Problem 5: Combined Pipeline
```bash
# Count unique IP addresses in web log
awk '{print $1}' access.log | sort | uniq | wc -l
```

---

*Next: Topic 27 (File-System Implementation & Directory Implementation)*