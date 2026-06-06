# WhatsQuery Voice Capacity And Scale Plan

## 1. Simultaneous Call Reality

- 5 CoffeeFix + 5 Elegenza + 5 Dr. Ali = 15 simultaneous calls
- This requires at least 15 available Vapi concurrency slots
- Default capacity may not be enough
- Package-based concurrency is required

## 2. Package Model

### Starter

- 1 simultaneous call
- 1 agent
- 1 phone number

### Business

- 3 simultaneous calls
- 3 agents
- 2 phone numbers

### Pro

- 5-10 simultaneous calls
- 5 agents
- 3 phone numbers

### Enterprise

- custom/reserved concurrency
- queue/fallback
- staff transfer
- SLA monitoring

## 3. No-Interruption Strategy

- fast webhook acknowledgement
- event persistence
- background processing
- WhatsApp notifications queued
- overflow fallback/callback
- no unlimited-call promise

## 4. What Happens If Capacity Is Full

- queue if provider queue exists
- fallback to staff if configured
- take callback request
- save missed/capacity event
- admin alert

## 5. When To Upgrade

- more Vapi concurrency when active calls approach limit
- Redis/job queue before many clients
- managed Postgres/bigger VPS before high-volume scale
- object storage for recordings later
- separate worker server later
