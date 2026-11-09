# Spec: Loan renewals

## Assumptions

- A renewal moves the due date on by the same loan period a borrow sets.

## PRD

PRD: [prd.md](prd.md)

## Requirements

- `REQ-12.1` — Blueprint: the lending service renews an open loan; Behavior: the renewal flow from the loans page.
- `REQ-12.2` — Behavior: the renewal flow refuses an overdue loan and says why.

## Changes

### Blueprint

- The lending service gains a Renewal component that moves an open loan's due date on, beside the other lending rules. The pull request that builds it removes its `Planned:` marker. — answers "Which part decides whether a loan can be renewed."

### Behavior

- A member renews from the loans page; the lending service moves the due date on, or refuses an overdue loan. The pull request that builds it removes its `Planned:` marker.

## Deployment view

unchanged

## Test seams

- The lending service's HTTP interface, which borrowing and returning are already tested at: a renewal is one more request on it.

## Left out

- Reservations: the PRD puts them out of scope.
