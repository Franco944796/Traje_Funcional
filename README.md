# 🛡️ Knowledge Vault - Repositorio de Ingeniería Robótica
Este proyecto web estático funciona como mi **bóveda de conocimiento y gestor de progresos** modular. Está diseñado bajo la filosofía Jamstack para ser rápido, eficiente, de código abierto y completamente alojable en **GitHub Pages**.

## 🛠️ Arquitectura y Datos
* **Frontend:** HTML5, JavaScript Vanilla, Tailwind CSS.
* **Base de datos estática:** `data.json`. La web renderiza el contenido de forma dinámica leyendo las especificaciones de este archivo centralizado.

## 🚀 Cómo usar este gestor localmente o actualizarlo
Si deseas agregar nuevos PDFs, planos hechos a mano o código de automatización:
1. Pon tus archivos físicos en los directorios correspondientes (`assets/pdfs/`, `assets/bocetos/` o `assets/planos/`).
2. Abre el archivo `data.json` y añade un nuevo elemento en la matriz respectiva (`pdf_vault`, `subprojects`, `media_center` o `brainstorming`).
3. Sube los cambios a tu rama principal: `git push origin main`. GitHub Pages compilará e implementará las actualizaciones automáticamente en tu URL pública.