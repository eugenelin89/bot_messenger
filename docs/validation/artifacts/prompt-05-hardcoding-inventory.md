# Production hard-coding inventory

Case-insensitive search of every file under `src`, `deploy`, and `public` for the
requested terms, including token `main`. Generated after audit corrections.
One row per matching source line; every occurrence on that line shares the listed
classification. Lexical matches are explicitly separated from product assumptions.

80 matching lines. No generic Project engine constraint on product name,
calculate/format modules, default branch, one submission or one integration was found.

| Source | Matched terms | Classification | Reason |
| --- | --- | --- | --- |
| [deploy/github-publish.py:31](../../../deploy/github-publish.py#L31) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [deploy/github-publish.py:46](../../../deploy/github-publish.py#L46) | `format` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [deploy/github-publish.py:87](../../../deploy/github-publish.py#L87) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [public/app.js:52](../../../public/app.js#L52) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [public/app.js:53](../../../public/app.js#L53) | `SquadStatus` | Fixture / historical compatibility | Explicit legacy demo preset, alongside generic Projects UI. |
| [public/app.js:174](../../../public/app.js#L174) | `SquadStatus` | Fixture / historical compatibility | Explicit legacy demo preset, alongside generic Projects UI. |
| [public/app.js:245](../../../public/app.js#L245) | `main` | Non-constraint: editable default | Operator can select branch; no fixed branch requirement. |
| [src/control/company.ts:175](../../../src/control/company.ts#L175) | `SquadStatus` | Historical compatibility | Unscoped legacy objective/scaffold route; registered Project route is explicit and separate. |
| [src/control/company.ts:178](../../../src/control/company.ts#L178) | `SquadStatus` | Historical compatibility | Unscoped legacy objective/scaffold route; registered Project route is explicit and separate. |
| [src/control/company.ts:360](../../../src/control/company.ts#L360) | `squadstatus` | Historical compatibility | Unscoped legacy objective/scaffold route; registered Project route is explicit and separate. |
| [src/control/remote-git.ts:71](../../../src/control/remote-git.ts#L71) | `main` | Non-constraint: storage name | Managed canonical directory component, not Git branch. Configurable trunk/master validated. |
| [deploy/provisioner/provisioner.py:61](../../../deploy/provisioner/provisioner.py#L61) | `calculate, format` | Historical compatibility | Retained protocol-1 module/branch support; generic manifests persist branch and scopes. |
| [deploy/provisioner/provisioner.py:129](../../../deploy/provisioner/provisioner.py#L129) | `calculate, format` | Historical compatibility | Retained protocol-1 module/branch support; generic manifests persist branch and scopes. |
| [deploy/provisioner/provisioner.py:385](../../../deploy/provisioner/provisioner.py#L385) | `formatversion` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [deploy/provisioner/provisioner.py:481](../../../deploy/provisioner/provisioner.py#L481) | `main` | Historical compatibility | Retained protocol-1 module/branch support; generic manifests persist branch and scopes. |
| [deploy/provisioner/provisioner.py:565](../../../deploy/provisioner/provisioner.py#L565) | `format` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [public/index.html:31](../../../public/index.html#L31) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [public/index.html:35](../../../public/index.html#L35) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [public/styles.css:2](../../../public/styles.css#L2) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [public/styles.css:3](../../../public/styles.css#L3) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/runtime/codex.ts:49](../../../src/runtime/codex.ts#L49) | `SquadStatus` | Historical compatibility | Unscoped legacy objective/scaffold route; registered Project route is explicit and separate. |
| [src/main.ts:10](../../../src/main.ts#L10) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/runtime/adapter.ts:49](../../../src/runtime/adapter.ts#L49) | `SquadStatus` | Historical compatibility | Unscoped legacy objective/scaffold route; registered Project route is explicit and separate. |
| [src/control/product-scaffold.ts:9](../../../src/control/product-scaffold.ts#L9) | `calculate, format` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:10](../../../src/control/product-scaffold.ts#L10) | `calculate, format` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:14](../../../src/control/product-scaffold.ts#L14) | `calculate, format` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:16](../../../src/control/product-scaffold.ts#L16) | `PRODUCT_CONTRACT, SquadStatus` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:19](../../../src/control/product-scaffold.ts#L19) | `calculate, format` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:26](../../../src/control/product-scaffold.ts#L26) | `SQUAD_FILES` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:28](../../../src/control/product-scaffold.ts#L28) | `SquadStatus` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:29](../../../src/control/product-scaffold.ts#L29) | `calculate, calculateStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:30](../../../src/control/product-scaffold.ts#L30) | `format, formatStatusSummary, formatting` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:31](../../../src/control/product-scaffold.ts#L31) | `calculate, calculateStatusSummary, format, formatStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:33](../../../src/control/product-scaffold.ts#L33) | `calculate` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:35](../../../src/control/product-scaffold.ts#L35) | `calculate, calculateStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:38](../../../src/control/product-scaffold.ts#L38) | `calculateStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:39](../../../src/control/product-scaffold.ts#L39) | `calculateStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:40](../../../src/control/product-scaffold.ts#L40) | `calculateStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:43](../../../src/control/product-scaffold.ts#L43) | `calculateStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:46](../../../src/control/product-scaffold.ts#L46) | `format` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:48](../../../src/control/product-scaffold.ts#L48) | `format, formatStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:50](../../../src/control/product-scaffold.ts#L50) | `formatStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:51](../../../src/control/product-scaffold.ts#L51) | `formatStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:54](../../../src/control/product-scaffold.ts#L54) | `formatStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/product-scaffold.ts:64](../../../src/control/product-scaffold.ts#L64) | `PRODUCT_CONTRACT, SquadStatus, calculate, calculateStatusSummary, format, formatStatusSummary` | Fixture / historical compatibility | Explicit SquadStatus adapter and seed tests, not generic Project policy. |
| [src/control/projects.ts:53](../../../src/control/projects.ts#L53) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/projects.ts:57](../../../src/control/projects.ts#L57) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/projects.ts:58](../../../src/control/projects.ts#L58) | `main` | Non-constraint: storage name | Managed canonical directory component, not Git branch. Configurable trunk/master validated. |
| [src/persistence/projects-migration.ts:36](../../../src/persistence/projects-migration.ts#L36) | `format_version` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/persistence/projects-migration.ts:101](../../../src/persistence/projects-migration.ts#L101) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/persistence/projects-migration.ts:130](../../../src/persistence/projects-migration.ts#L130) | `format_version` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/domain/engineering.ts:13](../../../src/domain/engineering.ts#L13) | `format_version` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/http/server.ts:103](../../../src/http/server.ts#L103) | `SquadStatus` | Historical compatibility | Unscoped legacy objective/scaffold route; registered Project route is explicit and separate. |
| [src/persistence/store.ts:84](../../../src/persistence/store.ts#L84) | `calculate, format` | Legacy migration | Retained schema-4 module constraint; migration 5 rebuilds the table. |
| [src/control/repository-git.ts:63](../../../src/control/repository-git.ts#L63) | `formatversion` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/product-runner.ts:29](../../../src/control/product-runner.ts#L29) | `calculate, format` | Historical compatibility | runProduct allowlist only; generic runRecipe uses persisted recipes. |
| [src/control/engineering.ts:9](../../../src/control/engineering.ts#L9) | `PRODUCT_CONTRACT, SQUAD_FILES` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:43](../../../src/control/engineering.ts#L43) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:50](../../../src/control/engineering.ts#L50) | `main` | Non-constraint: storage name | Managed canonical directory component, not Git branch. Configurable trunk/master validated. |
| [src/control/engineering.ts:78](../../../src/control/engineering.ts#L78) | `format_version` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:79](../../../src/control/engineering.ts#L79) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:101](../../../src/control/engineering.ts#L101) | `format` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:139](../../../src/control/engineering.ts#L139) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:187](../../../src/control/engineering.ts#L187) | `PRODUCT_CONTRACT, squadstatus` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:190](../../../src/control/engineering.ts#L190) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:202](../../../src/control/engineering.ts#L202) | `SquadStatus` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:208](../../../src/control/engineering.ts#L208) | `PRODUCT_CONTRACT, SquadStatus` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:209](../../../src/control/engineering.ts#L209) | `SQUAD_FILES, SquadStatus, main, squadstatus` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:214](../../../src/control/engineering.ts#L214) | `calculate_worker_id, format_worker_id` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:218](../../../src/control/engineering.ts#L218) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:219](../../../src/control/engineering.ts#L219) | `calculate, format` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:221](../../../src/control/engineering.ts#L221) | `calculate_worker_id, format_worker_id` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:226](../../../src/control/engineering.ts#L226) | `calculate, format, squadstatus` | Historical compatibility | Legacy source_kind adapter or legacy tool-field rejection; generic assignments require persisted scopes. |
| [src/control/engineering.ts:227](../../../src/control/engineering.ts#L227) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:255](../../../src/control/engineering.ts#L255) | `format_version` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:374](../../../src/control/engineering.ts#L374) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:431](../../../src/control/engineering.ts#L431) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:437](../../../src/control/engineering.ts#L437) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [src/control/engineering.ts:464](../../../src/control/engineering.ts#L464) | `squadstatus` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
| [deploy/systemd/botsquad.service:23](../../../deploy/systemd/botsquad.service#L23) | `main` | Non-constraint: lexical match | Formatting/schema identifier, program entrypoint, Git option/configuration key or HTML/CSS name. |
