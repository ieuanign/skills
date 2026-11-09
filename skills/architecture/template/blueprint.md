# Blueprint

<The parts and how they connect.>

```mermaid
%% C4 container: one node per part, labelled with its home.
flowchart LR
  classDef planned stroke-dasharray: 5 5
  web["<Part><br/><home>"] --> api["<Part><br/><home>"]
  api --> db[("<Store><br/><home>")]
```

## Presentation

<Each part in this layer: what it does, why it is shaped so, and its home.>

```mermaid
%% C4 component: the inside of a part, where it has more than one component.
flowchart LR
  classDef planned stroke-dasharray: 5 5
  a["<Component>"] --> b["<Component>"]
```

## Application

<Each part in this layer: what it does, why it is shaped so, and its home.>

## Data access

None — <reason this layer holds nothing>.

## Database

<Each part in this layer: what it does, why it is shaped so, and its home.>
