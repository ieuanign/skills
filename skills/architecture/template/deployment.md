# Deployment

<What runs where, and why: each deployable, the environments, and how they connect.>

```mermaid
%% Deployment: one subgraph per environment, one node per deployable, labelled with its home.
flowchart LR
  classDef planned stroke-dasharray: 5 5
  subgraph env1 ["<Environment>"]
    d1["<Deployable><br/><home>"] --> d2[("<Store><br/><home>")]
  end
```

## Presentation

<Each deployable in this layer: where it runs, in which environments, and why.>

## Application

<Each deployable in this layer: where it runs, in which environments, and why.>

## Data access

None — <reason this layer holds nothing>.

## Database

<Each store: where it runs, in which environments, and why.>
