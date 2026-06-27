// Variable global para almacenar los datos del proyecto una vez cargados
let vaultData = null;

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
});

// 2. FUNCIONES DE RENDERIZADO DE MÓDULOS
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <h2 class="text-xl font-bold text-emerald-400">// COMPONENTES INDEPENDIENTES</h2>
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

// =========================================================================
// CONTROL DE FILTROS PARA LA BÓVEDA DE DOCUMENTOS
// =========================================================================
let pdfFilters = { anio: 'todos', tema: 'todos' };

// Función global que captura el cambio de los selectores y re-renderiza la vista
function filterPdf(type, value) {
    pdfFilters[type] = value;
    const container = document.getElementById('content-area');
    container.innerHTML = render_pdf();
}

// =========================================================================
// FUNCIÓN RENDER_PDF MODULAR Y DINÁMICA
// =========================================================================
function render_pdf() {
    // 1. Extracción automática de Filtros Únicos desde el JSON (Filtros Inteligentes)
    const aniosUnicos = [...new Set(vaultData.pdf_vault.map(pdf => pdf.anio).filter(Boolean))].sort();
    const temasUnicos = [...new Set(vaultData.pdf_vault.map(pdf => pdf.tema).filter(Boolean))].sort();

    // 2. Aplicación del filtrado cruzado (Año Y Tema)
    const filteredPdfs = vaultData.pdf_vault.filter(pdf => {
        const matchAnio = pdfFilters.anio === 'todos' || pdf.anio === pdfFilters.anio;
        const matchTema = pdfFilters.tema === 'todos' || pdf.tema === pdfFilters.tema;
        return matchAnio && matchTema;
    });

    return `
        <!-- Encabezado y Selectores de Filtro con Tailwind -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 class="text-xl font-bold text-emerald-400">// BÓVEDA DE DOCUMENTACIÓN (MULTILINGÜE)</h2>

            <div class="flex flex-wrap gap-4 text-xs font-mono">
                <!-- Selector: Año -->
                <div class="flex flex-col gap-1">
                    <label class="text-slate-500 font-bold">> FILTRAR_AÑO</label>
                    <select onchange="filterPdf('anio', this.value)" class="bg-slate-900 border border-slate-800 text-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="todos" ${pdfFilters.anio === 'todos' ? 'selected' : ''}>[ VER TODOS ]</option>
                        ${aniosUnicos.map(anio => `<option value="${anio}" ${pdfFilters.anio === anio ? 'selected' : ''}>${anio}</option>`).join('')}
                    </select>
                </div>

                <!-- Selector: Tema -->
                <div class="flex flex-col gap-1">
                    <label class="text-slate-500 font-bold">> FILTRAR_TEMA</label>
                    <select onchange="filterPdf('tema', this.value)" class="bg-slate-900 border border-slate-800 text-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="todos" ${pdfFilters.tema === 'todos' ? 'selected' : ''}>[ VER TODOS ]</option>
                        ${temasUnicos.map(tema => `<option value="${tema}" ${pdfFilters.tema === tema ? 'selected' : ''}>${tema}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>

        <!-- Tabla de Documentos -->
        <div class="overflow-x-auto bg-slate-900 border border-slate-800 rounded-lg">
            <table class="w-full text-left text-sm text-slate-300">
                <thead class="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                    <tr>
                        <th class="p-4">Documento Técnico</th>
                        <th class="p-4">Idioma</th>
                        <th class="p-4">Categoría</th>
                        <th class="p-4">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredPdfs.length === 0 ? `
                        <!-- Estado vacío si ningún PDF coincide -->
                        <tr>
                            <td colspan="4" class="p-8 text-center text-slate-500 font-mono text-xs">
                                // REGISTRO VACÍO: No se encontraron documentos con los filtros seleccionados.
                            </td>
                        </tr>
                    ` : filteredPdfs.map(pdf => `
                        <tr class="border-b border-slate-800 hover:bg-slate-800/30 transition">
                            <td class="p-4">
                                <div class="font-medium text-slate-200">${pdf.title}</div>
                                <!-- Texto pequeño y gris con los metadatos solicitado -->
                                <div class="text-[11px] text-slate-500 font-mono mt-0.5">AÑO: ${pdf.anio || 'N/A'} | TEMA: ${pdf.tema || 'General'}</div>
                            </td>
                            <td class="p-4"><span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">${pdf.lang}</span></td>
                            <td class="p-4 text-slate-400">${pdf.category}</td>
                            <td class="p-4"><a href="${pdf.file}" target="_blank" class="text-emerald-400 hover:underline font-bold">Abrir PDF</a></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function render_media() {
    return `
        <h2 class="text-xl font-bold text-emerald-400">// PLANOS TÉCNICOS Y BOCETOS</h2>
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
        <h2 class="text-xl font-bold text-emerald-400">// BITÁCORA DE IDEAS E IMPLEMENTACIONES</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <h3 class="text-sm font-bold text-slate-400 mb-4">> Ideas </h3>
                <ul class="space-y-3 text-sm text-slate-300">
                    ${vaultData.brainstorming.scratchpad.map(note => `<li class="p-3 bg-slate-950 border border-slate-800 rounded-md border-l-2 border-l-amber-500">${note}</li>`).join('')}
                </ul>
            </div>
            <div class="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                <h3 class="text-sm font-bold text-slate-400 mb-4">> Implementando </h3>
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

// 3. Renderiza el contenedor y las tarjetas vacías (Esqueleto)
function render_code() {
    return `
        <h2 class="text-xl font-bold text-emerald-400">// CODE SNIPPETS (FIRMWARE / AUTOMATIZACIÓN)</h2>
        <div class="space-y-6">
            ${vaultData.code_snippets.map((block, index) => `
                <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <div class="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
                        <span class="text-xs font-bold text-slate-300">${block.title}</span>
                        <span class="text-[10px] uppercase bg-slate-950 text-emerald-400 font-bold px-2 py-0.5 rounded">${block.lang}</span>
                    </div>
                    <pre class="p-4 text-xs text-emerald-300 overflow-x-auto bg-slate-950 font-mono"><code id="code-block-${index}">// Leyendo registros del archivo remoto...</code></pre>
                </div>
            `).join('')}
        </div>
    `;
}

// 4. Función asíncrona que busca el contenido de cada archivo de código
async function loadCodeFilesContents() {
    for (let i = 0; i < vaultData.code_snippets.length; i++) {
        const snippet = vaultData.code_snippets[i];
        const codeElement = document.getElementById(`code-block-${i}`);

        try {
            const response = await fetch(snippet.file);
            if (!response.ok) throw new Error();

            const rawCode = await response.text();

            // Usamos textContent para que el navegador interprete el código como texto puro.
            // Esto evita problemas de seguridad y renderiza los < y > de C++ o Python sin romperse.
            codeElement.textContent = rawCode;

        } catch (error) {
            codeElement.textContent = `// [ERROR]: No se pudo cargar el archivo desde: ${snippet.file}`;
            codeElement.classList.add('text-rose-400');
        }
    }
}

// 5. ENRUTADOR / INTERRUPTOR DE PESTAÑAS
function switchTab(tabId) {
    if (!vaultData) return; // Prevenir clics si el JSON no terminó de cargar

    const container = document.getElementById('content-area');

    // Estilizar dinámicamente el botón activo en el Sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-emerald-400');
        btn.classList.add('hover:bg-slate-800', 'hover:text-slate-200');
    });
    event.currentTarget.classList.add('bg-slate-800', 'text-emerald-400');

    // Selección de renderizado
    switch (tabId) {
        case 'hub': container.innerHTML = render_hub(); break;
        case 'subprojects': container.innerHTML = render_subprojects(); break;
        case 'pdf': container.innerHTML = render_pdf(); break;
        case 'media': container.innerHTML = render_media(); break;
        case 'brainstorm': container.innerHTML = render_brainstorm(); break;
        case 'code':
            container.innerHTML = render_code(); // Dibuja la estructura
            loadCodeFilesContents();             // Dispara la carga asíncrona de los archivos
            break;
    }
}

// 6. INTERACCIONES MODALES (Lightbox)
function openLightbox(url) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = url;
    lb.classList.remove('hidden');
}