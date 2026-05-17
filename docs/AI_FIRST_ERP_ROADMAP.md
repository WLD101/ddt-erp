# WhatsQuery AI-First ERP Roadmap

This document converts the architecture review into an execution roadmap with safe subphases.

## Delivery Model

- every numbered phase is delivered in 2 to 4 subphases where needed
- every subphase must:
  - build
  - migrate safely
  - pass targeted role and tenant tests
  - deploy independently
  - support rollback

## Phase Sequence

## Phase 0 — Architecture Review

Deliverables:
- architecture review
- dependency map
- migration strategy
- risk register
- execution playbook

Status:
- complete when the in-repo architecture packet is accepted and referenced by delivery work

## Phase 1 — Reporting, PDF, Export Stability

### 1A Reports hardening

- stabilize `/dashboard/reports`
- unify:
  - empty states
  - limited-plan states
  - tenant-safe filters
- reduce duplicated report query logic
- introduce safe performance improvements for read-heavy summaries

### 1B Document generation

- standardize branded PDF generation for:
  - report summary
  - invoice
  - quote
  - receipt
  - purchase order
  - packing slip
- all PDF routes must:
  - return `application/pdf`
  - use safe filenames
  - enforce tenant scope

### 1C Export standardization

- unify CSV/XLS export pipeline for:
  - customers
  - suppliers
  - products
  - invoices
  - quotations
  - purchases
  - reports
  - audit logs

## Phase 2 — Import System

### 2A Shared import framework

- extend current import jobs into a reusable import engine
- add:
  - preview
  - validation
  - duplicate classification
  - partial-success reporting

### 2B Entity imports

- customers
- suppliers
- products
- inventory

### 2C Import safety

- downloadable templates
- owner/admin-only execution
- tenant-scoped parsing
- transaction-safe row processing

## Phase 3 — Finance / Accounting Core

### 3A Monetary foundation

- add Decimal-safe accounting schema
- introduce:
  - chart of accounts
  - journal entry header
  - journal entry lines
  - posting periods
  - source references

### 3B Posting engine

- sales posting
- purchase posting
- payment posting
- expense posting
- reversals and corrections

### 3C Finance reports

- general ledger
- trial balance
- profit and loss
- balance sheet
- cash flow
- receivables aging
- payables aging

### 3D Reconciliation groundwork

- reconciliation statuses
- import-ready statement structure
- unreconciled transaction views

## Phase 4 — Multi-Branch / Multi-Warehouse

### 4A Warehouse model

- warehouse under branch
- warehouse-aware inventory ownership

### 4B Transfer flows

- branch and warehouse transfers
- stock allocation and reservation
- transfer audit trail

### 4C Scoped access

- branch-scoped visibility
- warehouse-scoped visibility

## Phase 5 — Approval Workflows

### 5A Approval rules

- thresholds
- entity/event types
- approver hierarchy

### 5B Runtime enforcement

- sales approvals
- purchase approvals
- stock adjustment approvals
- payment approvals

### 5C UI

- pending approvals dashboard
- approver action log

## Phase 6 — CRM Pipeline

### 6A CRM data model

- leads
- opportunities
- stages
- activities
- tasks
- reminders
- notes

### 6B CRM UI

- pipeline board
- lead detail
- opportunity flow
- convert to customer

### 6C Analytics

- lead conversion
- source/channel visibility

## Phase 7 — Referral / Affiliate System

### 7A Referral program model

- campaigns
- referral codes
- invite records
- conversion records
- fraud flags

### 7B Internal credit ledger

- issued credits
- pending credits
- reversals
- billing application hooks

### 7C Platform surfaces

- `/platform/referrals`
- campaign controls
- fraud review
- analytics

## Phase 8 — Notifications

### 8A Event normalization

- approval events
- invoice events
- payment events
- stock alerts
- referral events
- onboarding events
- subscription alerts

### 8B Delivery channels

- in-app notifications
- email notifications

### 8C Preferences

- user or role-level preferences where useful

## Phase 9 — Security Upgrade

### 9A Authentication hardening

- TOTP 2FA
- device/session management
- login history
- IP logging

### 9B Security policy

- password policies
- security alerts

### 9C Immutable security audit

- hardened security event stream beside current business audit logs

## Phase 10 — API / Webhooks

### 10A Tenant API

- API keys
- scoped permissions
- rate limiting
- tenant-safe endpoints

### 10B Outbound webhooks

- invoice created
- payment received
- stock low
- customer created
- referral conversion

### 10C Operational controls

- key rotation
- webhook retry visibility
- signature verification

## Phase 11 — AI Enhancement

Existing baseline already shipped:
- voice input
- command history
- quick actions
- confidence indicators

New scope:
- clarification loops
- parser plugin registry by domain
- assistant analytics
- richer preview flows
- offline/mobile-ready command abstraction

## Phase 12 — Organization Features

### 12A Structure

- departments
- employee metadata

### 12B Documents

- attachments
- contract storage

### 12C Assets

- basic asset management

## Phase 13 — Advanced Reporting

- sales by branch
- sales by user
- top customers
- top products
- inventory valuation
- aging
- tax reports
- margins
- conversion analytics
- referral analytics

## Phase 14 — Command Center Upgrade

- customer success dashboard
- referral dashboard
- billing analytics
- churn indicators
- package analytics
- tenant health
- storage stats
- feature flags
- usage analytics

## Order of Implementation After Phase 0

Recommended first execution track:
1. Phase 1A
2. Phase 1B
3. Phase 1C
4. Phase 2A
5. Phase 2B
6. Phase 3A

This sequence gives the biggest product credibility gains before the riskiest accounting work starts.
