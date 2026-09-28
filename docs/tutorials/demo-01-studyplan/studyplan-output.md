# StudyPlan Demo 01 — validated sample

Project: `project_7309f229-5151-4b17-af86-5bb991760932`; repository: `repository_b22a536f-b730-4aae-8a7e-5090d321e8cd`; specification: `artifact_499bb629-473a-454e-bd33-7d9140efcc29`.

Input:
```json
[
  {"subject":"Vocabulary","minutes":15,"priority":2},
  {"subject":"Algebra","minutes":25,"priority":5},
  {"subject":"Geometry","minutes":20,"priority":5}
]
```

Expected plan asserted by planner suite:
```json
{"tasks":[
  {"subject":"Algebra","minutes":25,"priority":5},
  {"subject":"Geometry","minutes":20,"priority":5},
  {"subject":"Vocabulary","minutes":15,"priority":2}
],"totalMinutes":60}
```

Expected text independently asserted from literal plan data by report suite:
```text
Study plan
Total: 60 min
1. Algebra - 25 min - priority 5
2. Geometry - 20 min - priority 5
3. Vocabulary - 15 min - priority 2
```

Trusted integration `integration_5e0dd01f-0642-4995-89ae-1cd46c822f3c` completed. Candidate/final SHA: `fb74dc7a8304b19830108ccb001c3dc5fe39bd13`. Confined full recipe passed 24/24 tests, 0 failures, at 2026-09-28 10:34:33 UTC. This is module-suite validation evidence, not a separate composed runtime demo.