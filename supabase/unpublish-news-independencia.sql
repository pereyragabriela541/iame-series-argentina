-- Ocultar noticia del Día de la Independencia (reemplazada por flyer Fecha 5)
update news
set is_published = false
where slug = 'feliz-dia-independencia-argentina-2026';
