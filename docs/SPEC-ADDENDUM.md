# SPEC ADDENDUM v0.9 — El AI-OS y el loop "improving by doing"
## Extiende SPEC.md v0.8 (producto) y TECH-SPEC.md v1.0 (arquitectura). No los reemplaza: donde este documento calla, rigen aquellos.

**Fecha:** 2026-07-17 · **Fuente:** sesión de diseño 2026-07-17 (wireframes en `docs/wireframes/`, estado canónico ficticio en `docs/wireframes/state.json`) + auditoría de 13 hallazgos aplicada · **Owner:** Wadi Bardawil

---

## 1. La visión, ampliada (evolución, no pivote)

El Digital Chief of Staff (SPEC §0) se opera como un **AI-OS para monitorear, mejorar y
crecer empresas de $1–100M USD en ventas como si fueran un portafolio de private equity** —
un Chief of Staff digital por empresa, más un coach AI por ejecutivo. Español-primero con
paridad de inglés. Un solo lugar para: reuniones, iniciativas (issues/oportunidades),
tableros, KPIs, OKRs, procesos, conocimiento y personas.

El triángulo (SPEC §2) sigue siendo el modelo de datos. Lo que cambia es **el orden de
construcción y la puerta de entrada**: primero el loop de datos, después el cockpit.

### 1.1 El loop "improving by doing" (el producto ES este ciclo)

```
CONECTAR → AUDITAR → PRIORIZAR → OPERAR → MEDIR → RE-AUDITAR
```

| Paso | Qué hace | Regla dura |
|---|---|---|
| **Conectar** | Odoo · GoHighLevel · HubSpot · Fireflies · Jira (solo lectura) · Notion · Google · Microsoft · **plantillas CSV como fallback** para empresas sin ERP limpio | Leer % de avance de Jira/Asana ≠ gestionar tareas (Ley 7 intacta) |
| **Auditar** | Assessment **inferido de los datos**; preguntas solo para los huecos (12–20, no 82) | La madurez NUNCA se auto-degrada desde el ERP — el agente marca evidencia y propone re-assessment; el score solo se mueve con respuesta humana |
| **Priorizar** | Metadata BDS-82: `pnl_impact`, `speed_to_impact`, `dependency_score`, `risk_floor` + lifecycle engine (@bos/scoring) | Toda cifra generada por agente se etiqueta "estimación" con banda y supuestos |
| **Operar** | Cadencia, delegaciones, coaches por persona, aprobaciones | Nada outbound sin `agent_runs.awaiting_approval` + undo 30 s |
| **Medir** | Señales **deterministas**: umbral + tendencia + ligadura a supuesto disparan; el LLM solo redacta el "so what"; causa raíz siempre como hipótesis con confianza | Conector caído = modo degradado explícito, jamás datos extrapolados en silencio |
| **Re-auditar** | El delta de madurez y los supuestos rotos alimentan la trimestral | — |

### 1.2 El wedge demostrable: "el lunes completo"

Scorecard auto-alimentado desde ERP/CRM/CSV → señales → agenda → decisión → readout,
sin captura manual. Es la demo, el onboarding (día cero = el loop en miniatura) y el
hábito semanal que el kill-rule del día 60 exige. `docs/wireframes/bds-simulacion-lunes.html`
lo narra paso a paso.

### 1.3 La metodología como triángulo de packs

| Vértice | Pack | Estado |
|---|---|---|
| Estrategia | Play to Win (@bos/p2w) | extraído ✓ |
| Modelo operativo | **BDS-82**: 82 prácticas · 8 áreas · 410 rúbricas · metadata P&L | **pendiente: extraer de bds-OS/supabase/seed.sql + data/*.json como pack #2 de @bos/methodology** |
| Tecnología | CDIO-128 (16 módulos, citas COBIT/NIST/ITIL/DORA) | extraído ✓ |
| Centro | People (delegaciones, check-ins, coaches) | nuevo build |

### 1.4 Agentes (amplía SPEC §3.3)

3 agentes de vértice + 1 coach por persona + 1 CoS orquestador, sobre una biblioteca
compartida (P2W + BDS-82 + CDIO-128 + lifecycle + corpus DECIDE). El advisor tipo Jarvis
responde desde el estado con fuentes citadas y actúa SOLO vía `agent_runs.awaiting_approval`.
El Jarvis personal multi-fuente (email/calendario/Skool → Eisenhower) es la capa personal
del MISMO coach, no un producto aparte.

> **PREGUNTA ABIERTA (founder):** ¿el Jarvis personal se dogfoodea solo para Wadi primero,
> o es feature de cada CEO en v1?

**Privacidad del coach — 3 clases de dato (contrato de producto):**
`estado` (check-in entregado/vencido, rachas — visible al org) · `contenido` (lo que la
persona escribe — solo ella) · `consejo` (lo que el coach recomienda — solo ella).
El CEO ve semáforos, nunca conversaciones. Agregados anónimos solo con n≥5 y opt-in.

---

## 2. Pantallas (del wireframe canónico `bds-centro-de-control.html`)

Cada pantalla del wireframe lleva su nota "Spec · hacia atrás" — lo que exige del backend.
Resumen:

| Pantalla | Exige |
|---|---|
| **Inicio** (por rol CEO/Director/Manager) | signals engine determinista · bandeja de aprobaciones con panel de detalle + undo 30 s · vista por rol (RLS + role) · ledger de costo visible |
| **Reuniones** | `cadence_events` + pipeline Fireflies + extractor de candidatos (decisión/compromiso/challenge) + prep de agenda por agente; "reunión sin valor extraído" se marca |
| **Iniciativas** (kanban issues→oportunidades→WIP 5) | `issues` + `opportunities` con origen; promoción a iniciativa solo desplazando otra (WIP duro) y anclada a choice |
| **Tableros & KPIs** | `metric_points` con procedencia + umbrales + `saved_views`; **analista v1 = catálogo curado** (prompt libre = v2; el LLM jamás emite SQL contra conectores) |
| **OKRs** | `objectives` + `key_results` donde KR = referencia a métrica viva, no copia manual |
| **Procesos** | BDS-82 como pack con rúbricas de madurez, dueño, prioridad P&L |
| **Conocimiento** | RAG real (pgvector) sobre decisiones+minutas+docs con citas; la memoria se GENERA operando |
| **Personas** | `people` + `delegations` + `checkins` + coach por persona + clases de dato en schema |
| **Estrategia (P2W)** | migración 0003 (ya en main: `possibilities` + promotion provenance) + cascada con confianza |
| **Área del modelo operativo** (template ×8) | vista filtrada: métricas + prácticas del pack + delegaciones + señales |
| **Conectores & datos** | `connections` + `metric_sources` con health-check; degradación explícita ("stale", nunca inventar) |
| **Organización & seats** | roles existentes de `memberships`; precio por org; frontline gratis; seat de consultor cruza workspaces |
| **Día cero** | onboarding = loop en miniatura; assessment inferido; vacíos honestos, cero datos demo |

i18n ES/EN por diccionario de strings (spec, no toggle). El flujo "CEO aprueba desde el
teléfono" es de primera clase (pasada móvil aplicada al wireframe).

---

## 3. Schema nuevo (extiende TECH-SPEC §2.3 — mismas leyes: RLS en todo, loose-first)

```sql
-- LOOP DE DATOS
connections     (id, org_id, kind 'odoo'|'ghl'|'hubspot'|'fireflies'|'jira'|'notion'|'google'|'microsoft'|'csv',
                 status 'healthy'|'degraded'|'down', last_sync_at, credential_ref)
metric_sources  (id, metric_id, connection_id NULL, csv_template NULL, freshness_hours, mapping jsonb)
signals         (id, workspace_id, area, severity, rule jsonb /*umbral+tendencia+ligadura — determinista*/,
                 so_what_md /*único texto LLM*/, root_cause_hypothesis, root_cause_confidence,
                 status 'open'|'in_agenda'|'resolved'|'stale_data', metric_id, assumption_id NULL)

-- OPERACIÓN
delegations     (id, workspace_id, person_id, kind 'kpi'|'question'|'practice', target_ref,
                 cadence 'weekly'|'monthly'|'quarterly', due_at, status)
checkins        (id, delegation_id, status 'delivered'|'late'|'missed' /*org-visible*/,
                 explanation_md, delivered_at)
coach_messages  (id, person_id, role 'person'|'coach', body /*RLS: SOLO la persona — ni el owner*/)

-- METODOLOGÍA COMO DATO
methodology_packs (id, key 'p2w'|'bds82'|'cdio128', version, source_repo, ratified_by)

-- ANTESALA DE INICIATIVAS
issues          (id, workspace_id, title, origin 'agent'|'person'|'vault', origin_ref, status)
opportunities   (id, workspace_id, title, origin, possibility_id NULL, status)

-- OKRS COMO VISTA DE LA ESTRATEGIA
objectives      (id, workspace_id, title, anchor_choice_id NULL, anchor_assumption_id NULL, quarter)
key_results     (id, objective_id, metric_id /*referencia, NO copia*/, target, current_via_metric)

-- EXPLORACIÓN GOBERNADA
saved_views     (id, workspace_id, owner_person_id, chart_spec jsonb /*declarativa, del catálogo*/,
                 anchored_area NULL /*anclar = el agente la vigila*/)

-- PERSONAS (ligera, por workspace)
people          (id, workspace_id, name, role_title, membership_user_id NULL, coach_channel 'app'|'whatsapp'|'email')
```

Leyes adicionales del addendum: (5) `signals.rule` es dato, no prompt — el disparo es
reproducible sin LLM; (6) `coach_messages` tiene la RLS más estricta del sistema (ni el
owner del org); (7) toda métrica sabe su fuente y su frescura — una señal con fuente
`down` hereda `stale_data` visible.

---

## 4. Hipótesis H1–H8 con gates de validación

Consolidación de las hipótesis de la sesión (H4 y H7 conservan su numeración original;
el resto formaliza decisiones/research de la misma sesión).

| # | Hipótesis | Gate de validación | Kill si |
|---|---|---|---|
| **H1** | El "lunes completo" demostrable convierte a un dueño escéptico en usuario semanal | Demo con datos reales del cliente → uso semanal sostenido 4 semanas | Day-60 kill rule del CLAUDE.md |
| **H2** | El assessment **inferido** (preguntar solo huecos) elimina la fricción de captura que mata a la categoría EOS (patrón churn 90 días) | Onboarding completo < 1 sesión; señales en 48 h | Si el día cero exige > 20 preguntas o > 1 semana |
| **H3** | Señales deterministas desde datos conectados mantienen vivos los tableros (dolor validado: dashboards muertos) | ≥ 70% de señales llevan a discusión o decisión en sesión; falsos positivos < 30% | Señales ignoradas 3 semanas seguidas |
| **H4** ⚔ | **Kill-or-thrive:** un coach AI sostiene la disciplina de cadencia cuando el humano se retira | Cuando Wadi se retire de la cadencia de un cliente, la adherencia semanal sobrevive ≥ 90 días | Adherencia cae < 60% al mes de retirarse |
| **H5** | Pricing **por organización** (no per-seat, frontline gratis) anclado al fractional COO ($5–18K/mes validado) cierra sin fricción de asientos | ≥ 5 orgs pagan el precio org-based sin pedir per-seat | Todos los prospectos re-negocian a per-seat |
| **H6** | GTM fase 1 **coach-led** (clientes de la consultoría de Wadi, modelo Metronomics) produce las primeras 10 orgs sin funnel | 10 orgs activas vía engagements antes de gastar en adquisición | < 3 de los clientes actuales adoptan |
| **H7** ⚠ | LatAm: con **datos de gestión** (no fiscales) las señales son confiables pese al maquillaje fiscal; el RLS/privacidad se vuelve argumento de venta | Señales validadas contra la realidad operativa del cliente ≥ 80%; objeción de confidencialidad superada en ventas | Los dueños no conectan datos reales ni con RLS demostrado |
| **H8** | Español-primero es ventaja no servida (SEO virgen; canal EOS huérfano — sus implementers desaconsejan EOS One), no techo de mercado | Rankear términos ES + "ninety.io alternative" EN; ≥ 30% de pipeline de habla hispana | El pipeline ES no convierte y el EN exige paridad total antes de pagar |

Research que las sostiene (sesión 2026-07-17): churn EOS = captura manual (90 días);
retención real = presión humana externa; Ninety.io = amenaza (18,500 orgs, Ask Maz
jul-2026, pero garbage-in y per-seat legacy) y posible adquirente a 5 años; dolores
fuertes validados: tool sprawl, dashboards muertos, reuniones sin enforcement, delegación
sin dueño, costo COO; SEO: "fractional COO" 2.9K/mes +457%, "ninety.io alternative" y
"AI chief of staff" rankeables, español virgen.

---

## 5. Pricing (afina SPEC §6 — la estructura híbrida base+uso NO cambia)

- **Por ORGANIZACIÓN, no por asiento.** Ejecutivos con coach+aprobaciones incluidos;
  **frontline gratis** (lectura + sus propias métricas/check-ins). Agregar gente nunca
  cuesta: la adopción de abajo hacia arriba es foso, no factura.
- **Ancla de precio:** fractional COO $5–18K/mes (validado), no SaaS per-seat.
- Se mantiene de SPEC §6: base + créditos incluidos + uso medido con cap configurable;
  sin tier ilimitado; márgenes por construcción.
- Los montos exactos por tier org-based se fijan con los primeros 5 cierres coach-led
  (H5/H6) — los tiers de SPEC §6.1 quedan como piso de referencia.

## 6. GTM (afina SPEC §5/§10)

**Fase 1 — coach-led:** los clientes de la consultoría de Wadi entran al workspace como
parte del engagement (modelo Metronomics: el coach trae la herramienta, la herramienta
retiene al coach). El demo es el lunes completo con SUS datos. Sin funnel pago.
**Fase 2 — canal huérfano EOS:** implementers desencantados de EOS One + SEO
("ninety.io alternative", "AI chief of staff", "fractional COO", y el espacio español
virgen). **Fase 3 —** ejecutivo directo, gated en H4 (igual que SPEC §10 Phase 3).

---

## 7. Orden de construcción (invierte KICKOFF-PROMPTS — ver ese doc)

Primero el loop **conectar → auditar → priorizar** (conectores + CSV, assessment
inferido, señales deterministas, prioridad BDS-82), después el lunes demostrable
(cadencia + agenda + readout), y el cockpit al final — el cockpit es la vista del loop,
no el producto. Racional: todo lo diferencial del wireframe depende de datos vivos;
un cockpit sin loop es exactamente el dashboard muerto que el mercado ya abandonó.
