# Wireframes BDS — sesión de diseño 2026-07-17

Estado: exploración de producto completa (visión AI-OS, wireframe canónico, arquitectura,
research validado). Pendiente: aplicar auditoría al wireframe y redactar el addendum al
SPEC v0.8. Este archivo contiene el prompt de continuación completo para retomar en un
chat nuevo.

## Archivos

| Archivo | Qué es | Artifact URL (actualizable con parámetro `url`) |
|---|---|---|
| `bds-centro-de-control.html` | **CANÓNICO** — app shell completo | https://claude.ai/code/artifact/457e388e-e486-4c58-aa2b-9f13d5c5d3c8 |
| `bds-integraciones-diagrama.html` | Arquitectura 5 capas | https://claude.ai/code/artifact/d31a3296-80ad-49eb-bf53-089ae2815742 |
| `bds-simulacion-lunes.html` | Simulación operativa paso a paso | https://claude.ai/code/artifact/3cedc343-23fb-4fab-8675-379f22f4853b |
| `bds-tablero-ejecutivo.html` | Tablero de señales (McKinsey-style) | https://claude.ai/code/artifact/28d5ad25-62ec-4646-8622-7f1193b72e3e |
| `bds-cockpit-dummy.html` | DEPRECADO (primera iteración, design system teal) | https://claude.ai/code/artifact/9b38aa48-0a76-4bd0-8dc8-48956ecde147 |

Todos los datos son ficticios ("Molinos Delta, S.A. de C.V.") — regla de confidencialidad
del CLAUDE.md del repo.

## Prompt de continuación (pegar completo en el chat nuevo)

```
Continúa el trabajo de diseño de BDS (Digital Chief of Staff / AI-OS) de la sesión anterior.
Lee primero: CLAUDE.md, docs/SPEC.md, docs/TECH-SPEC.md, docs/wireframes/README-CONTINUACION.md.
Los wireframes ya están en docs/wireframes/ (el canónico es bds-centro-de-control.html).
Para republicar un artifact al MISMO URL usa el parámetro url del tool Artifact (URLs en el
README de wireframes).

── DECISIONES TOMADAS (no re-litigar) ──
1. Visión: AI-OS para monitorear/mejorar/crecer empresas de $1–100M USD en ventas como si
   fueran portafolio de private equity. Digital Chief of Staff + coach AI por ejecutivo.
   Español-primero con paridad inglés. Un solo lugar: reuniones, iniciativas
   (issues/oportunidades), tableros, KPIs, OKRs, procesos, conocimiento, personas.
2. Wedge de construcción: "el lunes completo" demostrable (scorecard auto-alimentado desde
   ERP/CRM/CSV → señales → agenda → decisión → readout). Primero mapear todo (ya hecho),
   luego destilar. Orden de prompts invertido: primero el loop conectar→auditar→priorizar,
   después el cockpit.
3. Loop "improving by doing": conectar (Odoo/GHL/HubSpot/Fireflies/Jira read-only/Notion/
   Google/Microsoft, con PLANTILLAS CSV como fallback para empresas sin ERP limpio) →
   auditar (assessment inferido de datos + preguntas solo para huecos) → priorizar (metadata
   BDS-82: pnl_impact, speed_to_impact, dependency_score, risk_floor + lifecycle engine) →
   operar (cadencia, delegaciones, coaches) → medir → re-auditar.
4. Metodología = triángulo: Play to Win (@bos/p2w, extraído) · Modelo Operativo (BDS-82: 82
   prácticas, 8 áreas, 410 rúbricas — AÚN EN bds-OS/supabase/seed.sql y data/*.json, extraer
   como pack #2 de @bos/methodology) · Tecnología (CDIO-128, extraído) · People al centro.
5. GTM fase 1: coach-led con los clientes de la consultoría de Wadi (modelo Metronomics).
   Pricing por ORGANIZACIÓN (no per-seat), frontline gratis lectura+métricas. Ancla de
   precio: fractional COO $5–18K/mes (validado), no SaaS per-seat.
6. Agentes: 3 de vértice + coach por persona + CoS orquestador; biblioteca compartida
   (P2W + BDS-82 + CDIO-128 + lifecycle + corpus DECIDE). Advisor tipo Jarvis en el app:
   responde desde el estado con fuentes citadas, actúa SOLO vía agent_runs.awaiting_approval.
   Jarvis personal multi-fuente (email/calendario/Skool → Eisenhower top-activities) = capa
   personal del MISMO coach, no producto aparte. PREGUNTA ABIERTA sin responder: ¿dogfood
   solo para Wadi primero, o feature de cada CEO en v1?
7. Vault Obsidian por workspace (bidireccional, aprobación mediante) + Hermes como host
   alternativo del mismo skill-set (compilador gstack ya lo soporta).

── AUDITORÍA PENDIENTE DE APLICAR AL WIREFRAME CANÓNICO (13 findings) ──
Críticos: (1) un solo state.json ficticio compartido entre piezas — hoy se contradicen
(coherencia 68 vs 66, challenge N2 vs N3); (2) signals engine DETERMINISTA (umbral+tendencia
+ligadura a supuesto; LLM solo redacta el "so what"; causa-raíz como hipótesis con
confianza); (3) la madurez NUNCA se auto-degrada desde ERP — el agente marca evidencia y
propone re-assessment, el score solo se mueve con respuesta humana; (4) matar el cockpit
teal como shell. Altos: panel de detalle + undo 30s en toda aprobación; wireframear
conector-roto, día-cero y admin de seats; clases de dato del coach (estado/contenido/
consejo — privacidad: el CEO ve estados, no conversaciones ni consejos); analista tipo
Julius v1 = catálogo curado de métricas (prompt libre v2, nunca SQL directo). Medios:
badges solo numéricos = pendientes-de-ti; cifras de agente etiquetadas "estimación +
supuestos" con bandas; quitar toggle ES/EN fake (i18n como spec); pasada móvil/contraste
(el flujo "CEO aprueba desde el teléfono" no está diseñado).

── RESEARCH VALIDADO ──
Churn de la categoría EOS = captura manual (patrón 90 días). Retención real = presión
humana externa → H4 kill-or-thrive: ¿un coach AI sostiene la disciplina? Test: cuando Wadi
se retire de la cadencia de un cliente, ¿sobrevive la adherencia semanal? Ninety.io =
amenaza (18,500 orgs, ~400K visitas/mes, Ask Maz jul-2026, pero garbage-in y per-seat
legacy) y posible adquirente a 5 años. EOS One tan malo que sus implementers lo
desaconsejan → canal huérfano (~10K implementers). Dolores validados fuerte: tool sprawl,
dashboards muertos, reuniones sin enforcement, delegación sin dueño, costo COO ($5–18K/mes
fractional = ancla). SEO: "fractional COO" 2.9K/mes +457% (exploding); "ninety.io
alternative", "EOS scorecard template", "AI chief of staff", "L10 meeting agenda" =
top 5 volumen/competencia; español virgen ("COO fraccional" sin competencia MX). MCP de
Ubersuggest registrado en config del proyecto — disponible para validar volúmenes exactos.
Riesgo LatAm (H7): datos fiscalmente maquillados → señales falsas; trabajar con datos de
gestión y hacer del RLS argumento de venta.

── TAREAS, EN ORDEN ──
1. Aplicar los 13 fixes al wireframe canónico y republicar al MISMO URL.
2. Redactar el addendum al SPEC v0.8 + TECH-SPEC: pantallas (con sus notas "Spec · hacia
   atrás" incluidas en el wireframe), schema nuevo (connections, metric_sources, signals,
   delegations, checkins, methodology_packs, issues, opportunities, objectives, key_results,
   saved_views, people), hipótesis H1–H8 con gates de validación, pricing, GTM.
3. Reordenar KICKOFF-PROMPTS: primero loop conectar→auditar→priorizar, luego lunes
   demostrable. Nota: hay un Prompt 5 sin commitear en el working tree (migración strategy
   vertex + RLS spec + tipos p2w) — commitearlo primero tras correr tests.
Plan mode antes de cambios no triviales. Las leyes del CLAUDE.md del repo siguen vigentes.
```
