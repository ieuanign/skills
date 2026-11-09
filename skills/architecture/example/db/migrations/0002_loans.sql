-- Table group: loans — every loan, open or closed. A returned loan is closed, never deleted.
CREATE TABLE loans (
  id         bigint PRIMARY KEY,
  book_id    bigint NOT NULL REFERENCES catalog (id),
  member     text   NOT NULL,
  due_date   date   NOT NULL,
  closed_at  timestamptz
);
