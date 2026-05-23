/**
 * app.js - Punto de entrada principal de la aplicación
 *
 * Inicializa el sistema, gestiona el cambio entre pestañas
 * y coordina los módulos de la aplicación.
 *
 * Flujo de inicio:
 * 1. Esperar a que el DOM esté listo
 * 2. Renderizar tabs de navegación
 * 3. Renderizar contenido inicial (tab: 1 item)
 * 4. Vincular eventos globales
 */

const App = {
  /** Tab activo actual */
  activeTab: 'single',

  /**
   * Inicializa la aplicación
   */
  init() {
    UI.renderTabs();
    this._mostrarInfoSistema();
    this.switchTab('single');
  },

  /**
   * Muestra información del sistema en el header
   */
  _mostrarInfoSistema() {
    const info = document.getElementById('system-info');
    if (info) {
      info.innerHTML = `
        <span class="info-badge">TC: ${TC} Bs/USD</span>
        <span class="info-badge">IVA: ${IVA_RATE}%</span>
      `;
    }
  },

  /**
   * Cambia entre pestañas del sistema
   * @param {string} tabId - ID del tab (single, multiple, omitted)
   */
  switchTab(tabId) {
    this.activeTab = tabId;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const panel = document.getElementById(`tab-${tabId}`);
    if (panel) {
      panel.classList.add('active');
    }

    const contentMap = {
      single: 'tab-single-content',
      multiple: 'tab-multiple-content',
      omitted: 'tab-omitted-content',
    };
    const contentId = contentMap[tabId];
    const contentEl = document.getElementById(contentId);

    if (contentEl && !contentEl.hasChildNodes()) {
      switch (tabId) {
        case 'single':
          UI.renderFormSingle();
          break;
        case 'multiple':
          UI.renderFormMultiple();
          break;
        case 'omitted':
          UI.renderFormOmitted();
          break;
      }
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
