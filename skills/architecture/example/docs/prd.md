# PRD: Loan renewals

Brief: none — this example's PRD is a file, standing in for PRD 12
Epic: none
Changes what a person sees: yes

## Assumptions

None

## Problem

A member who needs a book longer must return it and borrow it again, and loses it when someone else borrows it in between.

## Solution

A member renews an open loan from their loans page.

## Requirements

### As a member, I want to renew a loan, so that I keep a book longer without returning it

- **REQ-12.1** A member renews an open loan from their loans page and sees its new due date.
  - Visible: yes
- **REQ-12.2** A member who tries to renew an overdue loan is told it cannot be renewed and why.
  - Visible: yes

## Withdrawn

None

## Constraints

None

## Terms

**Renewal**: moving an open loan's due date on, without returning the book.

## Out of scope

- Reserving a book that is out on loan.

## Left for the spec

- Which part decides whether a loan can be renewed.

## Revisions

None
