// Variable global para almacenar los datos del proyecto una vez cargados
let vaultData = null;

// Control de sub-pestañas internas dentro de la sección de Documentación
let activeDocSubTab = 'pdf'; // Valores posibles: 'pdf' o 'video'

// 1. CARGA ASÍNCRONA DE DATOS (fetch)
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("data.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo data.json");

        vaultData = await response.json();

        // Inicializar la interfaz con los datos cargados
        document.getElementById('vault-title').innerText = vaultData.project_meta.name;
        document.getElementById('content-area').innerHTML = render_hub();
    } catch (error) {
        console.error("Error en la bóveda:", error);
        document.getElementById('content-area').innerHTML = `
            <div class="p-6 bg-rose-950/30 border border-rose-800 text-rose-400 rounded-lg">
                <strong>[ERROR DE SISTEMA]:</strong> No se pudo inicializar la base de datos estática.
                Asegurate de que 'data.json' existe y tiene un formato válido.
            </div>
        `;
    }

    // Inicializar el botón hamburguesa
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
});

// =============================================
// MENÚ MOBILE
// =============================================

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');

    const isHidden = menu.classList.contains('hidden');

    if (isHidden) {
        menu.classList.remove('hidden');
        iconOpen.classList.add('hidden');
        iconClose.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
        iconOpen.classList.remove('hidden');
        iconClose.classList.add('hidden');
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');

    if (menu) menu.classList.add('hidden');
    if (iconOpen) iconOpen.classList.remove('hidden');
    if (iconClose) iconClose.classList.add('hidden');
}

// =============================================
// 2. FUNCIONES DE RENDERIZADO DE MÓDULOS
// =============================================

function render_hub() {
    return `
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg">
            <h2 class="text-xl font-bold mb-3 text-emerald-400">// VISTA GLOBAL</h2>
            <p class="text-slate-400 text-sm leading-relaxed">${vaultData.project_meta.description}</p>
            <div class="mt-6">
                <div class="flex justify-between text-xs mb-2">
                    <span class="text-slate-500">Progreso de la Fase de Investigación</span>
                    <span class="text-emerald-400 font-bold">${vaultData.project_meta.global_progress}%</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-500 h-full" style="width: ${vaultData.project_meta.global_progress}%"></div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <h3 class="text-sm font-bold text-slate-400 mb-4">> Árbol de Subproyectos</h3>
                <ul class="text-xs space-y-2 text-slate-300">
                    <li class="text-emerald-400">■ ${vaultData.project_meta.name}</li>
                    ${vaultData.subprojects.map(sub => `<li class="pl-4">├─ ${sub.name}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function render_subprojects() {
    return `
        <h2 class="text-xl font-bold text-emerald-400 mb-4">// COMPONENTES INDEPENDIENTES</h2>
        <div class="grid grid-cols-1 gap-6">
            ${vaultData.subprojects.map(sub => `
                <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold">${sub.name}</h3>
                            <span class="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded text-slate-950 ${sub.status_color} mt-1">${sub.status}</span>
                        </div>
                        <span class="text-sm text-slate-400">${sub.progress}% Completado</span>
                    </div>
                    <p class="text-sm text-slate-400">${sub.description}</p>
                    <div class="border-t border-slate-800 pt-4">
                        <h4 class="text-xs font-bold text-slate-500 mb-2">Hitos Completados / Planificados:</h4>
                        <ul class="text-xs space-y-1 text-slate-300">
                            ${sub.timeline.map(step => `
                                <li class="${step.completed ? 'text-slate-300' : 'text-slate-500'}">
                                    ${step.completed ? '✓ ' : '• '} ${step.text}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// CONTROLADOR DE SECCIÓN
function render_documentation() {
    const isPdfActive = activeDocSubTab === 'pdf';

    // Sub-navegador local estilizado
    const subNavigation = `
        <div class="flex space-x-2 border-b border-slate-800 mb-6 pb-px">
            <button onclick="switchDocSubTab('pdf')"
                class="px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 cursor-pointer ${isPdfActive
            ? 'border-emerald-500 text-emerald-400 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-300'
        }">
                📄 Documentos PDFs
            </button>
            <button onclick="switchDocSubTab('video')"
                class="px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 cursor-pointer ${!isPdfActive
            ? 'border-emerald-500 text-emerald-400 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-300'
        }">
                🎥 Videos Relacionados
            </button>
        </div>
    `;

    return subNavigation + (isPdfActive ? render_pdf_content() : render_video_content());
}

// Reactividad interna para el cambio de sub-pestaña de documentos
function switchDocSubTab(subTab) {
    activeDocSubTab = subTab;
    const container = document.getElementById('content-area');
    if (container) {
        container.innerHTML = render_documentation();
    }
}

// Vista de PDFs
function render_pdf_content() {
    const temas = [...new Set(vaultData.pdf_vault.map(pdf => pdf.tema).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

    const años = [...new Set(vaultData.pdf_vault.map(pdf => pdf.año).filter(Boolean))]
        .sort((a, b) => b - a);

    return `
        <div class="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-xl font-bold text-emerald-400">// BÓVEDA DE DOCUMENTACIÓN (PDFs)</h2>

            <div class="flex gap-2">
                <select id="filter-tema" onchange="applyPdfFilters()" class="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded p-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                    <option value="">Todos los temas</option>
                    ${temas.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>

                <select id="filter-año" onchange="applyPdfFilters()" class="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded p-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                    <option value="">Todos los años</option>
                    ${años.map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="overflow-x-auto bg-slate-900 border border-slate-800 rounded-lg">
            <table class="w-full text-left text-sm text-slate-300">
                <thead class="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                    <tr>
                        <th class="p-4">Documento Técnico</th>
                        <th class="p-4">Año</th>
                        <th class="p-4">Tema</th>
                        <th class="p-4">Acción</th>
                    </tr>
                </thead>
                <tbody id="pdf-tbody">
                    ${vaultData.pdf_vault.map(pdf => `
                        <tr class="border-b border-slate-800 hover:bg-slate-800/30">
                            <td class="p-4 font-medium">${pdf.title}</td>
                            <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">${pdf.año}</span></td>
                            <td class="p-4 text-slate-400">${pdf.tema}</td>
                            <td class="p-4"><a href="${pdf.file}" target="_blank" class="text-emerald-400 hover:underline">Abrir PDF</a></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function applyPdfFilters() {
    const temaSelected = document.getElementById('filter-tema').value;
    const añoSelected = document.getElementById('filter-año').value;

    const filtered = vaultData.pdf_vault.filter(pdf => {
        const matchTema = temaSelected === "" || pdf.tema === temaSelected;
        const matchAño = añoSelected === "" || pdf.año === añoSelected;
        return matchTema && matchAño;
    });

    const tbody = document.getElementById('pdf-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.map(pdf => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/30">
                <td class="p-4 font-medium">${pdf.title}</td>
                <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">${pdf.año}</span></td>
                <td class="p-4 text-slate-400">${pdf.tema}</td>
                <td class="p-4"><a href="${pdf.file}" target="_blank" class="text-emerald-400 hover:underline">Abrir PDF</a></td>
            </tr>
        `).join('');
    }
}

// Vista de Videos
function render_video_content() {
    const videos = vaultData.video_vault || [];

    const temas = [...new Set(videos.map(v => v.tema).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

    const años = [...new Set(videos.map(v => v.año).filter(Boolean))]
        .sort((a, b) => b - a);

    return `
        <div class="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-xl font-bold text-emerald-400">// REGISTRO AUDIOVISUAL</h2>

            <div class="flex gap-2">
                <select id="filter-video-tema" onchange="applyVideoFilters()" class="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded p-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                    <option value="">Todos los temas</option>
                    ${temas.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>

                <select id="filter-video-año" onchange="applyVideoFilters()" class="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded p-2 focus:border-emerald-500 focus:outline-none cursor-pointer">
                    <option value="">Todos los años</option>
                    ${años.map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="overflow-x-auto bg-slate-900 border border-slate-800 rounded-lg">
            <table class="w-full text-left text-sm text-slate-300">
                <thead class="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                    <tr>
                        <th class="p-4">Recurso de Video</th>
                        <th class="p-4">Año</th>
                        <th class="p-4">Tema</th>
                        <th class="p-4">Acción</th>
                    </tr>
                </thead>
                <tbody id="video-tbody">
                    ${videos.map(video => `
                        <tr class="border-b border-slate-800 hover:bg-slate-800/30">
                            <td class="p-4 font-medium flex items-center space-x-2">
                                <span class="text-emerald-400">▶</span>
                                <span>${video.title}</span>
                            </td>
                            <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">${video.año}</span></td>
                            <td class="p-4 text-slate-400">${video.tema}</td>
                            <td class="p-4">
                                <a href="${video.url}" target="_blank" class="text-emerald-400 hover:underline flex items-center space-x-1">
                                    <span>Ver Video</span>
                                    <span class="text-[10px]">↗</span>
                                </a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function applyVideoFilters() {
    const videos = vaultData.video_vault || [];
    const temaSelected = document.getElementById('filter-video-tema').value;
    const añoSelected = document.getElementById('filter-video-año').value;

    const filtered = videos.filter(video => {
        const matchTema = temaSelected === "" || video.tema === temaSelected;
        const matchAño = añoSelected === "" || video.año === añoSelected;
        return matchTema && matchAño;
    });

    const tbody = document.getElementById('video-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.map(video => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/30">
                <td class="p-4 font-medium flex items-center space-x-2">
                    <span class="text-emerald-400">▶</span>
                    <span>${video.title}</span>
                </td>
                <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">${video.año}</span></td>
                <td class="p-4 text-slate-400">${video.tema}</td>
                <td class="p-4">
                    <a href="${video.url}" target="_blank" class="text-emerald-400 hover:underline flex items-center space-x-1">
                        <span>Ver Video</span>
                        <span class="text-[10px]">↗</span>
                    </a>
                </td>
            </tr>
        `).join('');
    }
}

function render_media() {
    return `
        <h2 class="text-xl font-bold text-emerald-400 mb-4">// PLANOS TÉCNICOS, BOCETOS E IMÁGENES</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            ${vaultData.media_center.map(media => `
                <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden group cursor-pointer" onclick="openLightbox('${media.url}')">
                    <div class="h-48 overflow-hidden bg-slate-950">
                        <img src="${media.url}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80 group-hover:opacity-100">
                    </div>
                    <div class="p-4 flex justify-between items-center bg-slate-900">
                        <span class="text-sm font-medium">${media.title}</span>
                        <span class="text-[10px] uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">${media.type}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function render_brainstorm() {
    return `
        <h2 class="text-xl font-bold text-emerald-400 mb-4">// IDEAS E IMPLEMENTACIONES</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <h3 class="text-sm font-bold text-slate-400 mb-4">> Ideas </h3>
                <ul class="space-y-3 text-sm text-slate-300">
                    ${vaultData.brainstorming.scratchpad.map(note => `<li class="p-3 bg-slate-950 border border-slate-800 rounded-md border-l-2 border-l-amber-500">${note}</li>`).join('')}
                </ul>
            </div>
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <h3 class="text-sm font-bold text-slate-400 mb-4">> Implementado </h3>
                <ul class="space-y-2 text-xs">
                    ${vaultData.brainstorming.backlog.map(item => `
                        <li class="flex justify-between p-2 bg-slate-950 border border-slate-800 rounded">
                            <span>${item.idea}</span>
                            <span class="text-rose-400 font-bold">${item.priority}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

function render_code() {
    return `
        <h2 class="text-xl font-bold text-emerald-400 mb-4">// CÓDIGOS</h2>
        <div class="space-y-6">
            ${vaultData.code_snippets.map((block, snippetIndex) => `
                <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <div class="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700/50">
                        <div class="flex items-center space-x-2">
                            <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                            <span class="text-xs font-bold text-slate-300 font-mono">${block.title}</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span class="text-[10px] uppercase bg-slate-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-slate-800 font-mono">
                                ${block.lang}
                            </span>
                            <button onclick="toggleBlockFiles(${snippetIndex}, this)" class="text-[10px] font-mono text-slate-400 hover:text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 transition duration-200 cursor-pointer">
                                Mostrar archivos [+]
                            </button>
                        </div>
                    </div>

                    <div id="files-container-${snippetIndex}" class="p-4 space-y-4 bg-slate-900 hidden border-t border-slate-800/40">
                        ${block.files.map((file, fileIndex) => `
                            <div onclick="openCodeModal(${snippetIndex}, ${fileIndex}, '${file.name}', '${block.lang}')"
                                 class="border border-slate-800/80 rounded bg-slate-950/40 overflow-hidden cursor-pointer hover:border-emerald-500/40 hover:bg-slate-950/80 transition duration-300 group/file relative">

                                <div class="bg-slate-900/60 px-4 py-2 flex justify-between items-center border-b border-slate-800/60">
                                    <span class="text-xs font-mono text-slate-400 group-hover/file:text-emerald-400 transition">📄 ${file.name}</span>
                                    <span class="text-[10px] text-slate-500 group-hover/file:text-emerald-400 font-mono transition">
                                        [Click para expandir] 🖵
                                    </span>
                                </div>

                                <div class="max-h-32 overflow-hidden relative pointer-events-none">
                                    <pre class="p-4 text-xs bg-slate-950/90 !m-0 font-mono overflow-hidden"><code id="code-block-${snippetIndex}-${fileIndex}" class="language-${block.lang}">// Leyendo registros de ${file.name}...</code></pre>
                                    <div class="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function loadCodeFilesContents() {
    for (let s = 0; s < vaultData.code_snippets.length; s++) {
        const block = vaultData.code_snippets[s];

        for (let f = 0; f < block.files.length; f++) {
            const fileObj = block.files[f];
            const codeElement = document.getElementById(`code-block-${s}-${f}`);

            if (!codeElement) continue;

            try {
                const response = await fetch(fileObj.path);
                if (!response.ok) throw new Error();

                const rawCode = await response.text();
                codeElement.textContent = rawCode;

                if (window.Prism) {
                    Prism.highlightElement(codeElement);
                }

            } catch (error) {
                codeElement.textContent = `// [ERROR]: No se pudo cargar el archivo desde: ${fileObj.path}`;
                codeElement.classList.add('text-rose-400');
            }
        }
    }
}

function switchTab(tabId) {
    if (!vaultData) return;

    const container = document.getElementById('content-area');

    // Actualizar estado activo en TODOS los nav-btn (sidebar + mobile)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-emerald-400', 'font-medium');
        btn.classList.add('hover:bg-slate-800', 'hover:text-slate-200');
    });

    // Marcar activo todos los botones que correspondan al tab seleccionado
    document.querySelectorAll(`.nav-btn[onclick*="'${tabId}'"]`).forEach(btn => {
        btn.classList.add('bg-slate-800', 'text-emerald-400', 'font-medium');
        btn.classList.remove('hover:bg-slate-800', 'hover:text-slate-200');
    });

    switch (tabId) {
        case 'hub': container.innerHTML = render_hub(); break;
        case 'subprojects': container.innerHTML = render_subprojects(); break;
        case 'pdf': container.innerHTML = render_documentation(); break; // CAMBIADO: Apunta al despachador de documentación
        case 'media': container.innerHTML = render_media(); break;
        case 'brainstorm': container.innerHTML = render_brainstorm(); break;
        case 'code':
            container.innerHTML = render_code();
            loadCodeFilesContents();
            break;
    }
}

function openLightbox(url) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = url;
    lb.classList.remove('hidden');
}

// INTERRUPTOR DE ACORDEÓN
function toggleBlockFiles(index, button) {
    const container = document.getElementById(`files-container-${index}`);
    if (!container) return;

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        button.innerHTML = 'Ocultar archivos [-]';
        button.classList.add('text-emerald-400', 'border-emerald-500/30');
    } else {
        container.classList.add('hidden');
        button.innerHTML = 'Mostrar archivos [+]';
        button.classList.remove('text-emerald-400', 'border-emerald-500/30');
    }
}

// INTERACTIVIDAD DEL WORKSPACE MODAL
function openCodeModal(snippetIndex, fileIndex, fileName, lang) {
    const sourceCode = document.getElementById(`code-block-${snippetIndex}-${fileIndex}`);
    if (!sourceCode) return;

    const rawCodeText = sourceCode.textContent;

    let modal = document.getElementById('code-modal-overlay');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'code-modal-overlay';
        document.body.appendChild(modal);
    }

    modal.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in";

    modal.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[85vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div class="bg-slate-800/90 px-6 py-4 flex justify-between items-center border-b border-slate-700/50">
                <div class="flex items-center space-x-3">
                    <span class="w-3 h-3 bg-rose-500 rounded-full"></span>
                    <span class="w-3 h-3 bg-amber-500 rounded-full"></span>
                    <span class="w-3 h-3 bg-emerald-500 rounded-full"></span>
                    <span class="text-sm font-bold text-slate-200 font-mono ml-2">${fileName}</span>
                    <span class="text-[10px] uppercase bg-slate-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-800">${lang}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="copyModalCode(this)" class="text-xs font-mono text-slate-300 hover:text-emerald-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 transition duration-200">
                        Copiar Código
                    </button>
                    <button onclick="closeCodeModal()" class="text-xs font-mono text-slate-400 hover:text-rose-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 transition duration-200">
                        Cerrar [ESC]
                    </button>
                </div>
            </div>

            <pre class="flex-1 p-6 overflow-auto font-mono text-xs md:text-sm bg-slate-950/90 !m-0 select-text"><code id="modal-code-block" class="language-${lang}"></code></pre>
        </div>
    `;

    const modalCodeContainer = document.getElementById('modal-code-block');
    modalCodeContainer.textContent = rawCodeText;

    if (window.Prism) {
        Prism.highlightElement(modalCodeContainer);
    }

    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', handleEscapeKeyPress);
}

function closeCodeModal() {
    const modal = document.getElementById('code-modal-overlay');
    if (modal) modal.remove();
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', handleEscapeKeyPress);
}

function handleEscapeKeyPress(e) {
    if (e.key === 'Escape') closeCodeModal();
}

function copyModalCode(buttonElement) {
    const modalCode = document.getElementById('modal-code-block');
    if (modalCode) {
        navigator.clipboard.writeText(modalCode.innerText).then(() => {
            const originalText = buttonElement.innerText;
            buttonElement.innerText = "¡Copiado!";
            buttonElement.classList.add("text-emerald-400", "border-emerald-500/30");

            setTimeout(() => {
                buttonElement.innerText = originalText;
                buttonElement.classList.remove("text-emerald-400", "border-emerald-500/30");
            }, 2000);
        });
    }
}