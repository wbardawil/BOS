# ARCHITECTURE.md — BDS · AI-OS / Digital Chief of Staff

> **Documento vivo.** Se actualiza con cada decisión de arquitectura. Complementa
> `TECH-SPEC.md` (que conserva el detalle de stack y extracción de IP); cuando ambos
> difieran, gana el más reciente y se reconcilia. Estado: diseño (2026-07-17) —
> nada de la capa 2/4/5 nueva está construido; los wireframes en `docs/wireframes/`
> son el contrato visual.

## El principio rector

**BOS no reemplaza los sistemas donde la empresa opera — los lee, los interpreta con
agentes que cargan metodología, y solo escribe de vuelta con aprobación humana.**
El usuario deja de brincar de herramienta en herramienta: opera desde un solo lugar.

## Las 5 capas

### Capa 1 · Sistemas del cliente (fuentes — no se tocan, no se migran)
- ERP: Odoo (primero) · CRM: GoHighLevel, HubSpot · Reuniones: Fireflies
- PM: Jira / Asana / ClickUp / Monday — **solo lectura, siempre** (Ley 7: leer % de
  avance ≠ gestionar tareas)
- Conocimiento: Notion, Google Drive / SharePoint (lectura + RAG)
- Productividad: Google Workspace y Microsoft 365 (calendario, correo, Teams) — paridad
- **Fallback estructural: plantillas CSV** — el valor del día 1 no puede depender de un
  ERP limpio; en $1–20M muchas veces no lo hay
- Fuentes internas: assessments (respuestas del equipo líder) y las personas mismas
  (check-ins, explicaciones de variación)

### Capa 2 · @bos/connect — la aduana
- Un conector por proveedor; credenciales cifradas **scoped por workspace (RLS)**
- Dos caminos de lectura: **sync programado** (Inngest → `metric_points`, sin LLM,
  costo tokens $0) y **consulta on-demand vía MCP** (el agente pregunta al razonar)
- Un solo camino de escritura hacia afuera: `agent_runs.awaiting_approval` — sin excepción
- El mapeo métrica↔campo del conector ES el onboarding (ej. OTIF no es campo nativo
  de Odoo)

### Capa 3 · BOS — system of record estratégico (Postgres + TRUE RLS)
- Cada `metric_point` llega con procedencia (`source`, timestamp) y ligado a una
  capacidad, supuesto, KR o iniciativa — por eso un dato que cae dispara estrategia,
  no una alerta
- **Signals engine determinista**: umbral + ventana de tendencia + ligadura; el LLM solo
  redacta el "so what". La causa raíz cruzada se presenta como hipótesis con confianza,
  nunca como hecho
- La madurez (BDS-82 / CDIO-128) **nunca se auto-degrada desde datos**: el agente marca
  "evidencia de retroceso" y propone re-assessment; el score solo se mueve con respuesta
  humana o aprobación explícita

### Capa 4 · Agentes de sentido + biblioteca de metodología
Agentes (todos vía `@bos/ai`: router Haiku/Sonnet/Opus, prompt cache, usage_ledger, caps):
- **Agente de Estrategia** — lente `@bos/p2w`: cascada 5 cajas con confianza por checklist,
  possibilities rivales, supuestos WWHTBT movidos solo con evidencia
- **Agente de Modelo Operativo** — lente BDS-82 (+CDIO-128 en tecnología): madurez,
  delegaciones, re-assessment
- **Agente de Portafolio** — engines bds-OS (OPI, lifecycle, focus): prioridad, riesgo,
  huérfanas
- **Coach por persona** — conoce SUS números, historial y rol; pide criterio, no datos;
  nunca gestiona tareas; escala blockers. Capa personal del mismo coach: multi-fuente
  (correo, calendario, Skool) → top-activities Eisenhower. Privacidad por clases de dato:
  estado / contenido / consejo — el CEO ve estados, no conversaciones ni consejos
- **CoS orquestador** — sintetiza los vértices en agenda, bandeja y Challenge Loop; corre
  en Claude Code o Hermes (mismo skill-set, compilador gstack)
- **Advisor (chat in-app)** — responde desde el estado con fuentes citadas; toda acción
  pasa por la bandeja. **Analista de tableros** v1 = catálogo curado de métricas + vistas
  guardadas anclables a áreas; prompt libre v2 (generación de spec de gráfica, nunca SQL
  directo)

Biblioteca compartida (el "no-random"): `@bos/methodology` (CDIO-128 citado + **BDS-82
pendiente de extracción** desde bds-OS: 82 prácticas · 8 áreas · 410 rúbricas · metadata
`pnl_impact`/`speed_to_impact`/`dependency_score`/`risk_floor`) · `@bos/p2w` ·
`@bos/scoring` (engines puros) · ciclo de vida corporativo · corpus de apps DECIDE
(doble uso: decidir compras de tecnología y recomendar qué conectar).

### Capa 5 · Superficies (por rol)
Centro de control (wireframe canónico; sidebar por uso/urgencia: Inicio → Operación
diaria → Modelo operativo (8 áreas con cuestionario adentro) → Gente → Estrategia) ·
Portal del equipo (seats; cada ejecutivo ve SUS delegaciones y SU coach) · Coach en el
canal de la persona (correo/Teams/portal) · Vault Obsidian por workspace (bidireccional,
con aprobación) · ES/EN + light/dark (brand system WB).

## El loop operativo — "improving by doing"

```
conectar → auditar → priorizar → OPERAR (cadencia, delegaciones, coaches)
   ↑                                    ↓
   └── re-auditar con datos nuevos ← medir
```
- Auditar: assessment inferido de los datos conectados; se pregunta solo lo que no se
  puede inferir
- Priorizar: metadata BDS-82 + lifecycle — nunca "mejora todo", siempre "estas 3, por esto"
- La empresa mejora porque opera dentro del sistema, no por un "proyecto de mejora"

## Schema nuevo (borrador — se detalla en el addendum al SPEC)

`connections` · `metric_sources` (mapeo métrica↔campo conector) · `signals` ·
`delegations` + `checkins` · `methodology_packs` + `pack_items` · `issues` ·
`opportunities` · `objectives` + `key_results` (KR = referencia a métrica viva, no copia)
· `saved_views` · `people` (ligera, por workspace)

## Leyes que esta arquitectura NO rompe (CLAUDE.md del repo)

TRUE RLS hasta las credenciales · loose-first · todo LLM por `@bos/ai` · routing por
clase de acción · outbound solo con aprobación · engines puros · PM fuera de alcance ·
100% cobertura en lógica pura + second-voice en schema/auth.

## Orden de construcción (invertido — decisión 2026-07-17)

1. **Loop primero**: conectores/CSV → assessment inferido → motor de prioridad
2. **El lunes demostrable**: scorecard auto-alimentado → señales → agenda → decisión →
   readout (el demo de 10 minutos que ataca la causa #1 de churn de la categoría)
3. Cockpit completo, coaches, vault, Hermes — después

## Preguntas abiertas

- Jarvis personal multi-fuente: ¿dogfood solo para el founder primero, o feature de cada
  CEO en v1?
- H4 (kill-or-thrive): ¿un coach AI sostiene la disciplina de cadencia sin presión humana?
  Test definido: retirar al founder de la cadencia de un cliente y medir adherencia.
