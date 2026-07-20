-- Ocultar flyer Fecha 5 de la sección Noticias
update news
set is_published = false
where slug = 'fecha-5';
