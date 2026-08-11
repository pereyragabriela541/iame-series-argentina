-- RPP Fecha con Invitados 2026 — PDF en /public/reglamentos/
insert into regulations (title, doc_type, pdf_url, sort_order, is_published)
select
  'RPP Fecha con Invitados 2026',
  'deportivo',
  '/reglamentos/rpp-fecha-con-invitados-2026.pdf',
  10,
  true
where not exists (
  select 1 from regulations
  where pdf_url = '/reglamentos/rpp-fecha-con-invitados-2026.pdf'
);
