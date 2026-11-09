# Behavior

<The main flows across the parts.>

```mermaid
%% Sequence: one flow; a planned message is drawn dotted (-->>).
sequenceDiagram
  participant P as <Part>
  participant Q as <Part>
  P->>Q: <request>
  Q-->>P: <response>
```

```mermaid
%% State: only where an entity has states.
stateDiagram-v2
  classDef planned stroke-dasharray: 5 5
  [*] --> StateA
  StateA --> StateB: <event>
```

## Presentation

<The flows that start in this layer, step by step across the parts.>

## Application

<The flows this layer carries, and the rules that decide them.>

## Data access

<The reads and writes each flow makes, and through which part.>

## Database

<What the stores do on their own in a flow: triggers, scheduled jobs, constraints.>
