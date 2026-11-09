# Deployment

Local only: each part runs as a service of `compose.yaml` on the same machine, because a neighbourhood library needs no more.

```mermaid
%% Deployment: one subgraph per environment, one node per deployable, labelled with its home.
flowchart LR
  classDef planned stroke-dasharray: 5 5
  subgraph local [Local]
    web[Catalog site<br/>web/] --> api[Lending service<br/>api/]
    api --> db[(Store<br/>db/)]
  end
```

## Presentation

The catalog site, home `web/`, runs as the `web` service, built from its home, in the local environment.

## Application

The lending service, home `api/`, runs as the `api` service, built from its home, in the local environment.

## Data access

None — no deployable stands between the lending service and the store.

## Database

The store, home `db/`, runs as the `db` service from a stock relational-store image in the local environment.
