# Topic 34: System & Network Threats

**Source**: Lecture 4.10 (Unit 4) + Textbook Ch. 14-15 (Silberschatz Ch. 14, 15, Stallings Ch. 15)

---

## 34.1 System Threats

### Definition
- **System Threat**: Attack targeting system services, resources, or operating environment
- **Goals**: Make resources unavailable, consume resources, gain unauthorized access, exploit weaknesses, disrupt operations

### Common System Threats

| Threat | Description |
|--------|-------------|
| **Denial-of-Service (DoS)** | Make system/service unavailable to legitimate users |
| **Port Scanning** | Probe network ports to find open services/entry points |

---

## 34.2 Denial-of-Service (DoS)

### Definition
- **DoS Attack**: Overwhelms system resources to make service unavailable to legitimate users

### Resources Targeted
| Resource | Attack Method |
|----------|---------------|
| **CPU** | Infinite loops, heavy computation requests |
| **Memory** | Memory allocation exhaustion (malloc bombs) |
| **Network Bandwidth** | Flood with packets (volumetric attacks) |
| **Connection Capacity** | SYN flood, connection table exhaustion |
| **Storage** | Disk fill (log filling, temp files) |

### DoS Attack Types
| Type | Description |
|-------|-------------|
| **Volumetric** | Flood bandwidth (UDP flood, ICMP flood) |
| **Protocol** | Exploit protocol weaknesses (SYN flood, Ping of Death) |
| **Application Layer** | Target specific apps (HTTP flood, Slowloris) |
| **Distributed (DDoS)** | Multiple compromised systems (botnet) |

### DoS Mitigation
| Defense | Description |
|---------|-------------|
| **Rate Limiting** | Throttle requests per IP |
| **SYN Cookies** | Prevent SYN flood |
| **Traffic Filtering** | Block malicious IPs |
| **CDN/Load Balancer** | Distribute traffic |
| **Resource Quotas** | Per-user/process limits |

---

## 34.2 Port Scanning

### Definition
- **Port Scanning**: Systematically probe network ports to identify open services

### Why Port Scanning?
| Purpose | Description |
|---------|-------------|
| **Reconnaissance** | Find open services & entry points |
| **Vulnerability Assessment** | Identify vulnerable service versions |
| **Attack Planning** | Map attack surface |

### Common Ports
| Port | Service |
|------|---------|
| 21 | FTP |
| 22 | SSH |
| 23 | Telnet |
| 25 | SMTP |
| 53 | DNS |
| 80 | HTTP |
| 110 | POP3 |
| 143 | IMAP |
| 443 | HTTPS |
| 3306 | MySQL |
| 3389 | RDP |

### Port Scan Types
| Scan Type | Technique |
|-----------|-----------|
| **TCP Connect** | Full TCP handshake (SYN → SYN/ACK → ACK) |
| **SYN Scan** | Send SYN, analyze SYN/ACK (stealthier) |
| **FIN/XMAS/NULL** | Abnormal flag combinations |
| **UDP Scan** | Send UDP, check ICMP unreachable |

### Legitimate vs Malicious
| Context | Purpose |
|---------|---------|
| **Administrator** | Security auditing, troubleshooting |
| **Attacker** | Reconnaissance, vulnerability discovery |

---

## 34.2 Network Threats

### Definition
- Attacks exploiting vulnerabilities in **network communication, protocols, or connected systems**

### Attacker Goals
| Goal | Description |
|------|-------------|
| **Intercept Communication** | Eavesdrop on traffic |
| **Steal Information** | Credentials, data, session tokens |
| **Impersonation** | Spoof identity, MITM |
| **Data Modification** | Alter transmitted data |
| **Service Disruption** | DoS, connection reset |

---

## 34.3 Common Network Threats

| Threat | Description |
|--------|-------------|
| **IP Spoofing** | Forge source IP address |
| **Man-in-the-Middle (MITM)** | Intercept/modify communication between parties |
| **Packet Sniffing** | Capture & analyze network packets |
| **Session Hijacking** | Take over authenticated session |
| **Replay Attack** | Re-send captured valid data |
| **DNS Spoofing/Poisoning** | Redirect to malicious sites |

---

## 34.3 IP Spoofing

### Definition
- **Technique**: Forge source IP address in packet headers
- **Purpose**: Hide identity, impersonate trusted host, bypass IP-based filters

### How It Works
```
Attacker → Forged Packet (src=Trusted_IP) → Victim
Victim → Response → Trusted_IP (not attacker)
```

### Uses
| Purpose | Description |
|---------|-------------|
| **DoS** | Flood with spoofed packets |
| **Bypass Filters** | Bypass IP-based ACLs |
| **MITM Setup** | Impersonate trusted host |
| **Blind Spoofing** | Predict sequence numbers |

---

## 34.3 Man-in-the-Middle (MITM) Attack

### Definition
- Attacker secretly positions between two communicating parties
- Can **intercept**, **read**, **modify**, or **inject** messages
- Parties believe they communicate directly

### MITM Process
```
Alice ←────────→ Attacker ←────────→ Bob
   (believes Bob)          (believes Alice)
```

### Capabilities
| Capability | Description |
|------------|-------------|
| **Intercept** | Read all communication |
| **Modify** | Alter messages in transit |
| **Inject** | Insert malicious data |
| **Impersonate** | Pretend to be each party to the other |

### MITM Requirements
| Requirement | Method |
|-------------|--------|
| **Network Position** | Same LAN, compromised router, ARP spoofing |
| **Encryption Bypass** | SSL stripping, fake certificates |
| **Trust Establishment** | Fake certificates, CA compromise |

---

## 34.4 Packet Sniffing

### Definition
- **Packet Sniffing**: Capture and analyze network packets in transit
- **Tool**: Packet sniffer (software/hardware)

### Dual Nature
| Context | Purpose |
|---------|---------|
| **Legitimate** | Network monitoring, troubleshooting, security analysis |
| **Malicious** | Capture sensitive data without authorization |

### Information Exposed (Unencrypted)
| Data Type | Examples |
|-----------|----------|
| **Credentials** | Usernames, passwords (HTTP basic, FTP, Telnet) |
| **Network Info** | IP/MAC addresses, topology |
| **Session Data** | Cookies, session IDs, tokens |
| **Communication** | Email, chat, file transfers |
| **Any Unencrypted** | HTTP, FTP, SNMP, DNS |

### Tools
| Tool | Type |
|-------|------|
| **Wireshark** | GUI analyzer |
| **tcpdump** | CLI capture |
| **Ettercap** | MITM + sniffing |
| **dsniff** | Password sniffing suite |

---

## 34.4 Network Security & Protection Mechanisms

### 1. Firewalls
| Type | Description |
|------|-------------|
| **Packet Filter** | Rule-based (IP, port, protocol) |
| **Stateful** | Tracks connection state |
| **Application/Proxy** | Inspects application layer |
| **Next-Gen** | Deep packet inspection, IPS |

| Function | Description |
|----------|-------------|
| **Block Unauthorized** | Deny unauthorized connections |
| **Allow Authorized** | Permit legitimate traffic |
| **Log/Alert** | Record suspicious activity |

---

### 2. Encryption
| Aspect | Description |
|--------|-------------|
| **Purpose** | Convert readable → unreadable (ciphertext) |
| **Protection** | Prevent understanding of captured data |
| **Scope** | Data in transit (TLS/SSL, IPsec, SSH) |

| Protocol | Use Case |
|----------|----------|
| **TLS/SSL** | HTTPS, SMTPS, IMAPS |
| **IPsec** | VPN, site-to-site |
| **SSH** | Remote shell, SFTP |
| **DTLS** | UDP-based (VoIP, WebRTC) |

---

### 3. Authentication
| Method | Description |
|--------|-------------|
| **Passwords** | Knowledge-based (weak alone) |
| **Certificates** | PKI, X.509, TLS |
| **Multi-Factor (MFA)** | Something you know + have + are |
| **Kerberos** | Ticket-based (Windows domain) |
| **OAuth/OIDC** | Delegated authorization |

### MFA Factors
| Factor | Example |
|--------|---------|
| **Knowledge** | Password, PIN |
| **Possession** | Phone, token, smart card |
| **Inherence** | Fingerprint, face, iris |

---

## 34.5 Additional Network Protections

| Mechanism | Purpose |
|-----------|---------|
| **VPN** | Encrypted tunnel over public network |
| **VLAN** | Network segmentation |
| **IDS/IPS** | Detect/block attacks |
| **Honeypot** | Decoy to detect/analyze attacks |
| **NAC** | Network Access Control (device health check) |
| **Zero Trust** | Never trust, always verify |

---

## 34.5 Key Takeaways

1. **DoS** = Overwhelm resources (CPU, memory, bandwidth, connections)
2. **Port Scanning** = Reconnaissance for open services
3. **IP Spoofing** = Forge source IP to hide/impersonate
4. **MITM** = Intercept/modify communication between parties
5. **Packet Sniffing** = Capture unencrypted traffic
6. **Firewall** = Filter traffic by rules
7. **Encryption** = Protect data in transit (TLS, IPsec, SSH)
8. **Authentication** = Verify identity (MFA > passwords)
9. **Encryption + Authentication** = Defense in depth

---

## 34.6 Exam-Relevant MCQ Patterns

| Question | Answer |
|----------|--------|
| **DoS** | Overwhelm resources to deny service |
| **DDoS** | Distributed (botnet) DoS |
| **Port Scan** | Probe open ports for services |
| **IP Spoofing** | Forge source IP address |
| **MITM** | Intercept/modify between two parties |
| **Packet Sniffing** | Capture packets; exposes unencrypted data |
| **Firewall** | Filter traffic by rules (packet/stateful/app) |
| **Encryption** | Protect data in transit (TLS, IPsec, SSH) |
| **MFA** | Multiple factors (know/have/are) |
| **VPN** | Encrypted tunnel over public net |
| **IDS/IPS** | Detect/block intrusions |

---

## 34.6 Practice Problems

### Problem 1: DoS Types
```
Classify: SYN flood, HTTP flood, UDP amplification, Slowloris
```

### Problem 2: Port Scan Detection
```
How to detect SYN scan vs full connect scan?
```

### Problem 3: MITM
```
User accesses HTTP site on public WiFi. Attacker performs MITM.
What data exposed? How to prevent?
```

### Problem 4: IP Spoofing Defense
```
How does ingress filtering (BCP 38) prevent IP spoofing?
```

### Problem 5: Encryption
```
Why is HTTP vulnerable to sniffing? How does HTTPS fix it?
```

### Problem 5: Defense in Depth
```
Layer firewall + IDS + encryption + MFA.
Explain how each layer contributes.
```

---

*Next: Topic 35 (Access Matrix & Access Control / Revocation)*