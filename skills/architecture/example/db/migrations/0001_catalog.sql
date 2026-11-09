-- Table group: catalog — the books the library holds and whether each is on the shelf.
CREATE TABLE catalog (
  id        bigint PRIMARY KEY,
  title     text    NOT NULL,
  on_shelf  boolean NOT NULL DEFAULT true
);
