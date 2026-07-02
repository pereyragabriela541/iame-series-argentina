-- Reglamentos oficiales 2026 — PDFs en /public/reglamentos/
delete from regulations;

insert into regulations (title, doc_type, pdf_url, sort_order, is_published) values
  (
    'Reglamento Argentino de Karting Año 2026',
    'general',
    '/reglamentos/reglamento-argentino-karting-2026.pdf',
    1,
    true
  ),
  (
    'Reglamento Deportivo BS Proyect 2026',
    'deportivo',
    '/reglamentos/reglamento-deportivo-bs-proyect-2026.pdf',
    2,
    true
  ),
  (
    'Reglamento Técnico 60 Under / 60 Mini 2026',
    'tecnico',
    '/reglamentos/reglamento-tecnico-60-under-60-mini-2026.pdf',
    3,
    true
  ),
  (
    'Reglamento Técnico Old School Junior 2026',
    'tecnico',
    '/reglamentos/reglamento-tecnico-old-school-junior-2026.pdf',
    4,
    true
  ),
  (
    'Reglamento Técnico Old School Senior 2026',
    'tecnico',
    '/reglamentos/reglamento-tecnico-old-school-senior-2026.pdf',
    5,
    true
  ),
  (
    'Reglamento Técnico Honda Senior Pro 390 2026',
    'tecnico',
    '/reglamentos/reglamento-tecnico-honda-senior-pro-390-2026.pdf',
    6,
    true
  ),
  (
    'Reglamento Técnico Old School Master / Gentleman 2026',
    'tecnico',
    '/reglamentos/reglamento-tecnico-old-school-master-gentleman-2026.pdf',
    7,
    true
  );
