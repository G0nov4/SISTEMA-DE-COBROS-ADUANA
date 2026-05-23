/**
 * ui.js - Componentes de interfaz de usuario
 *
 * Maneja la creación dinámica del DOM, el renderizado de formularios,
 * la generación de tablas de resultados y la gestión de eventos de UI.
 *
 * Organización:
 * - Formularios: renderizado de inputs, selects, checkboxes
 * - Tablas: resultados de liquidación y tributos
 * - Eventos: binding de event listeners
 */

const UI = {
  /**
   * Renderiza los tabs del sistema
   */
  renderTabs() {
    const container = document.getElementById('tab-nav');
    const tabs = [
      { id: 'single', label: '1 Item' },
      { id: 'multiple', label: 'Varios Items' },
      { id: 'omitted', label: 'Tributo Omitido' },
    ];

    container.innerHTML = '';
    tabs.forEach((tab, idx) => {
      const btn = Utils.createElement('button', {
        class: 'tab-btn',
        'data-tab': tab.id,
        onclick: () => App.switchTab(tab.id),
      }, tab.label);
      if (idx === 0) btn.classList.add('active');
      container.appendChild(btn);
    });
  },

  /**
   * Renderiza el formulario de 1 item
   */
  renderFormSingle() {
    const container = document.getElementById('tab-single-content');
    container.innerHTML = '';

    const form = Utils.createElement('form', { id: 'form-single', class: 'form' });

    form.innerHTML = `
      <h3>Datos del Ítem</h3>
      <div class="form-grid">
        <div class="field">
          <label for="single-descripcion">Descripción del Ítem</label>
          <input type="text" id="single-descripcion" placeholder="Ej: Laptop HP" />
        </div>
        <div class="field">
          <label for="single-precio">Precio (USD)</label>
          <input type="number" id="single-precio" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label for="single-incoterm">Incoterm</label>
          <select id="single-incoterm" onchange="UI.actualizarInfoIncoterm('single')">
            ${Object.entries(INCOTERMS).map(([key, val]) =>
              `<option value="${key}">${val.label}</option>`
            ).join('')}
          </select>
          <small id="single-incoterm-info" class="help-text incoterm-info">
            ${INCOTERMS.EXW.descripcion}
          </small>
        </div>
        <div class="field">
          <label for="single-ga">Gravamen Arancelario GA (%)</label>
          <input type="number" id="single-ga" step="0.01" min="0" max="100" placeholder="0" />
        </div>
        <div class="field checkbox-field">
          <label class="checkbox-label">
            <input type="checkbox" id="single-convenio" />
            ¿Tiene convenio internacional?
          </label>
          <small class="help-text">Reduce el GA al ${CONVENIO_GA_FACTOR * 100}% del valor original</small>
        </div>
      </div>

      <h3>Costos Locales (pre-FOB)</h3>
      <div class="form-grid cols-4">
        ${COSTOS_LOCALES_PREFOB.map(c =>
          `<div class="field">
            <label for="single-${c.id}">${c.label} (USD)</label>
            <input type="number" id="single-${c.id}" step="0.01" min="0" placeholder="0.00" value="${c.default}" />
          </div>`
        ).join('')}
      </div>

      <h3>Transporte</h3>
      <div class="form-grid">
        <div class="field">
          <label for="single-modo">Modo de Transporte</label>
          <select id="single-modo">
            ${MODOS_TRANSPORTE.map(m => `<option value="${m.id}">${m.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="single-tipo">Tipo</label>
          <select id="single-tipo">
            ${TIPOS_TRANSPORTE.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="single-transporte1">Transporte 1 (USD) - Flete internacional</label>
          <input type="number" id="single-transporte1" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label for="single-transporte1-desc">Descripción Transporte 1</label>
          <input type="text" id="single-transporte1-desc" placeholder="Ej: Flete marítimo Shanghai-Iquique" />
        </div>
        <div class="field">
          <label for="single-transporte2">Transporte 2 (USD) - Hasta frontera</label>
          <input type="number" id="single-transporte2" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label for="single-transporte2-desc">Descripción Transporte 2</label>
          <input type="text" id="single-transporte2-desc" placeholder="Ej: Iquique-Pisiga" />
        </div>
      </div>

      <div id="single-terrestre-section" style="display:none;">
        <div class="form-grid cols-2">
          <div class="field">
            <label for="single-origen">Origen (terrestre)</label>
            <input type="text" id="single-origen" placeholder="Ej: Iquique, Chile" />
          </div>
          <div class="field">
            <label for="single-destino">Destino (terrestre)</label>
            <input type="text" id="single-destino" placeholder="Ej: La Paz, Bolivia" />
          </div>
        </div>
      </div>

      <h3>Seguro</h3>
      <div class="form-grid cols-1">
        <div class="field">
          <label for="single-seguro">Seguro (USD)</label>
          <input type="number" id="single-seguro" step="0.01" min="0" placeholder="0.00" />
        </div>
      </div>

      <h3>Otros Gastos</h3>
      <div id="single-otros-container">
        ${OTROS_GASTOS_SUGERIDOS.map((og, i) => `
          <div class="form-row gasto-item" data-index="${i}">
            <div class="field flex-2">
              <input type="text" class="gasto-desc" placeholder="Descripción" value="${og.label}" />
            </div>
            <div class="field flex-1">
              <input type="number" class="gasto-monto" step="0.01" min="0" placeholder="0.00" value="${og.default}" />
            </div>
            <button type="button" class="btn-remove-gasto" onclick="UI.eliminarGasto(this)">✕</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-secondary" onclick="UI.agregarGasto('single-otros-container')">
        + Agregar gasto
      </button>

      <div class="form-actions">
        <button type="button" class="btn btn-primary btn-lg" onclick="UI.calcularSingle()">
          Calcular Tributos
        </button>
        <button type="button" class="btn btn-secondary" onclick="UI.limpiarFormulario('form-single')">
          Limpiar
        </button>
      </div>
    `;

    container.appendChild(form);

    container.appendChild(Utils.createElement('div', { id: 'single-resultados', class: 'resultados' }));

    document.getElementById('single-modo').addEventListener('change', function () {
      const section = document.getElementById('single-terrestre-section');
      section.style.display = this.value === 'terrestre' ? '' : 'none';
    });
  },

  /**
   * Renderiza el formulario de varios items
   */
  renderFormMultiple() {
    const container = document.getElementById('tab-multiple-content');
    container.innerHTML = '';

    const form = Utils.createElement('form', { id: 'form-multiple', class: 'form' });

    form.innerHTML = `
      <h3>Items a Importar</h3>
      <div id="multiple-items-container">
        ${this._renderItemRow(0)}
      </div>
      <button type="button" class="btn btn-secondary" onclick="UI.agregarItemMultiple()">
        + Agregar Ítem
      </button>

      <hr />

      <h3>Incoterm (común para todos los items)</h3>
      <div class="form-grid cols-1">
        <div class="field">
          <label for="multiple-incoterm">Incoterm</label>
          <select id="multiple-incoterm" onchange="UI.actualizarInfoIncoterm('multiple')">
            ${Object.entries(INCOTERMS).map(([key, val]) =>
              `<option value="${key}">${val.label}</option>`
            ).join('')}
          </select>
          <small id="multiple-incoterm-info" class="help-text incoterm-info">
            ${INCOTERMS.EXW.descripcion}
          </small>
        </div>
      </div>

      <h3>Costos Locales (pre-FOB)</h3>
      <div class="form-grid cols-4">
        ${COSTOS_LOCALES_PREFOB.map(c =>
          `<div class="field">
            <label for="multiple-${c.id}">${c.label} (USD)</label>
            <input type="number" id="multiple-${c.id}" step="0.01" min="0" placeholder="0.00" value="${c.default}" />
          </div>`
        ).join('')}
      </div>

      <h3>Transporte</h3>
      <div class="form-grid">
        <div class="field">
          <label for="multiple-modo">Modo de Transporte</label>
          <select id="multiple-modo">
            ${MODOS_TRANSPORTE.map(m => `<option value="${m.id}">${m.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="multiple-tipo">Tipo</label>
          <select id="multiple-tipo">
            ${TIPOS_TRANSPORTE.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="multiple-transporte1">Transporte 1 (USD)</label>
          <input type="number" id="multiple-transporte1" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label for="multiple-transporte1-desc">Descripción Transporte 1</label>
          <input type="text" id="multiple-transporte1-desc" placeholder="Ej: Flete marítimo" />
        </div>
        <div class="field">
          <label for="multiple-transporte2">Transporte 2 (USD)</label>
          <input type="number" id="multiple-transporte2" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label for="multiple-transporte2-desc">Descripción Transporte 2</label>
          <input type="text" id="multiple-transporte2-desc" placeholder="Ej: Iquique-Pisiga" />
        </div>
      </div>

      <div id="multiple-terrestre-section" style="display:none;">
        <div class="form-grid cols-2">
          <div class="field">
            <label for="multiple-origen">Origen (terrestre)</label>
            <input type="text" id="multiple-origen" placeholder="Ej: Iquique, Chile" />
          </div>
          <div class="field">
            <label for="multiple-destino">Destino (terrestre)</label>
            <input type="text" id="multiple-destino" placeholder="Ej: La Paz, Bolivia" />
          </div>
        </div>
      </div>

      <h3>Seguro</h3>
      <div class="form-grid cols-1">
        <div class="field">
          <label for="multiple-seguro">Seguro (USD)</label>
          <input type="number" id="multiple-seguro" step="0.01" min="0" placeholder="0.00" />
        </div>
      </div>

      <h3>Otros Gastos</h3>
      <div id="multiple-otros-container">
        ${OTROS_GASTOS_SUGERIDOS.map((og, i) => `
          <div class="form-row gasto-item" data-index="${i}">
            <div class="field flex-2">
              <input type="text" class="gasto-desc" placeholder="Descripción" value="${og.label}" />
            </div>
            <div class="field flex-1">
              <input type="number" class="gasto-monto" step="0.01" min="0" placeholder="0.00" value="${og.default}" />
            </div>
            <button type="button" class="btn-remove-gasto" onclick="UI.eliminarGasto(this)">✕</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-secondary" onclick="UI.agregarGasto('multiple-otros-container')">
        + Agregar gasto
      </button>

      <div class="form-actions">
        <button type="button" class="btn btn-primary btn-lg" onclick="UI.calcularMultiple()">
          Calcular Tributos
        </button>
        <button type="button" class="btn btn-secondary" onclick="UI.limpiarFormulario('form-multiple')">
          Limpiar
        </button>
      </div>
    `;

    container.appendChild(form);
    container.appendChild(Utils.createElement('div', { id: 'multiple-resultados', class: 'resultados' }));

    document.getElementById('multiple-modo').addEventListener('change', function () {
      const section = document.getElementById('multiple-terrestre-section');
      if (section) section.style.display = this.value === 'terrestre' ? '' : 'none';
    });
  },

  /**
   * Renderiza una fila de item para el formulario multiple
   * @param {number} index
   * @returns {string} HTML
   */
  _renderItemRow(index) {
    return `
      <div class="item-row" data-item-index="${index}">
        <div class="form-grid item-form-grid">
          <div class="field">
            <label>Descripción</label>
            <input type="text" class="item-desc" placeholder="Ej: Producto ${index + 1}" />
          </div>
          <div class="field">
            <label>Precio (USD)</label>
            <input type="number" class="item-precio" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>GA (%)</label>
            <input type="number" class="item-ga" step="0.01" min="0" max="100" placeholder="0" />
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input type="checkbox" class="item-convenio" />
              Convenio
            </label>
          </div>
          <div class="field item-actions">
            ${index > 0 ? `<button type="button" class="btn btn-danger btn-sm" onclick="UI.eliminarItemMultiple(this)">Eliminar</button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Renderiza el formulario de tributo omitido
   */
  renderFormOmitted() {
    const container = document.getElementById('tab-omitted-content');
    container.innerHTML = '';

    const div = Utils.createElement('div', { class: 'form' });

    div.innerHTML = `
      <h3>Tabla 1: Cálculo de Liquidaciones y Tributos (TC: ${TC} Bs/USD)</h3>
      <p class="help-text">Complete los datos de ambos escenarios. Los campos son en USD.</p>

      <div class="comparison-grid">
        <div class="comparison-column">
          <h4>Liquidación Original</h4>
          <div class="field">
            <label>FOB (USD)</label>
            <input type="number" id="omit-orig-fob" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Flete Marítimo (USD)</label>
            <input type="number" id="omit-orig-fm" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Flete Iquique-Pisiga (USD)</label>
            <input type="number" id="omit-orig-ft" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Seguro - Póliza (USD)</label>
            <input type="number" id="omit-orig-seguro" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Otros Gastos - ASPB (USD)</label>
            <input type="number" id="omit-orig-otros" step="0.01" min="0" placeholder="0.00" />
          </div>
        </div>

        <div class="comparison-column">
          <h4>Liquidación Fiscalizada</h4>
          <div class="field">
            <label>FOB (USD)</label>
            <input type="number" id="omit-fisc-fob" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Flete Marítimo (USD)</label>
            <input type="number" id="omit-fisc-fm" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Flete Iquique-Pisiga (USD)</label>
            <input type="number" id="omit-fisc-ft" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Seguro - Póliza (USD)</label>
            <input type="number" id="omit-fisc-seguro" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Otros Gastos - ASPB (USD)</label>
            <input type="number" id="omit-fisc-otros" step="0.01" min="0" placeholder="0.00" />
          </div>
        </div>
      </div>

      <div class="form-grid cols-2">
        <div class="field">
          <label for="omit-ga">Gravamen Arancelario GA (%)</label>
          <input type="number" id="omit-ga" step="0.01" min="0" max="100" placeholder="0" />
        </div>
        <div class="field">
          <label for="omit-pisiga-lp">Flete Interno Pisiga-La Paz (USD) — no incluido en CIF</label>
          <input type="number" id="omit-pisiga-lp" step="0.01" min="0" placeholder="0.00" />
          <small class="help-text">Este tramo es interno en Bolivia y no forma parte de la base aduanera.</small>
        </div>
      </div>

      <h3>Tabla 3: Parámetros para la Actualización de la Deuda</h3>
      <div class="params-grid">
        <div class="field">
          <label for="omit-ufv-vto">UFV vencimiento (fecha original)</label>
          <input type="number" id="omit-ufv-vto" step="0.00001" min="0" placeholder="2.35914" value="2.35914" />
        </div>
        <div class="field">
          <label for="omit-ufv-pago">UFV pago (fecha de pago)</label>
          <input type="number" id="omit-ufv-pago" step="0.00001" min="0" placeholder="2.95157" value="2.95157" />
        </div>
        <div class="field">
          <label for="omit-dias">Días de mora (n)</label>
          <input type="number" id="omit-dias" step="1" min="0" placeholder="1827" value="1827" />
        </div>
        <div class="field">
          <label for="omit-tasa">Tasa de interés anual (r%)</label>
          <input type="number" id="omit-tasa" step="0.01" min="0" placeholder="6" value="6" />
          <small class="help-text">Tasa aplicable según Ley 2492 (ej: 6% para tramo 5-7 años)</small>
        </div>
        <div class="field">
          <label for="omit-multa-ufv">Multa por Contravención (UFV)</label>
          <input type="number" id="omit-multa-ufv" step="1" min="0" placeholder="250" value="250" />
          <small class="help-text">Multa fijada en UFV según la contravención (Art. 165 Ley 2492)</small>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-primary btn-lg" onclick="UI.calcularOmitido()">
          Calcular Tributo Omitido
        </button>
        <button type="button" class="btn btn-secondary" onclick="UI.limpiarOmitido()">
          Limpiar
        </button>
      </div>
    `;

    container.appendChild(div);
    container.appendChild(Utils.createElement('div', { id: 'omit-resultados', class: 'resultados' }));
  },

  /**
   * Agrega un gasto adicional al contenedor especificado
   * @param {string} containerId - ID del contenedor
   */
  agregarGasto(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const idx = container.children.length;
    const row = Utils.createElement('div', { class: 'form-row gasto-item' });
    row.innerHTML = `
      <div class="field flex-2">
        <input type="text" class="gasto-desc" placeholder="Descripción del gasto" />
      </div>
      <div class="field flex-1">
        <input type="number" class="gasto-monto" step="0.01" min="0" placeholder="0.00" />
      </div>
      <button type="button" class="btn-remove-gasto" onclick="UI.eliminarGasto(this)">✕</button>
    `;
    container.appendChild(row);
  },

  /**
   * Elimina un gasto de la lista
   * @param {HTMLElement} btn - Botón de eliminar
   */
  eliminarGasto(btn) {
    const row = btn.closest('.gasto-item');
    if (row) row.remove();
  },

  /**
   * Agrega una fila de item al formulario multiple
   */
  agregarItemMultiple() {
    const container = document.getElementById('multiple-items-container');
    if (!container) return;
    const idx = container.children.length;
    const div = Utils.createElement('div', { class: 'item-row-wrapper' });
    div.innerHTML = this._renderItemRow(idx);
    container.appendChild(div);
  },

  /**
   * Elimina una fila de item del formulario multiple
   * @param {HTMLElement} btn - Botón de eliminar
   */
  eliminarItemMultiple(btn) {
    const row = btn.closest('.item-row-wrapper') || btn.closest('.item-row');
    if (row) row.remove();
  },

  /**
   * Actualiza la info del incoterm seleccionado
   * @param {string} prefix - Prefijo del formulario (single, multiple)
   */
  actualizarInfoIncoterm(prefix) {
    const select = document.getElementById(`${prefix}-incoterm`);
    const info = document.getElementById(`${prefix}-incoterm-info`);
    if (select && info) {
      const inc = INCOTERMS[select.value];
      if (inc) info.textContent = inc.descripcion;
    }
  },

  /**
   * Recoge los datos del formulario single
   * @returns {Object}
   */
  _recogerDatosSingle() {
    return {
      items: [{
        descripcion: Utils.getText('single-descripcion') || 'Item 1',
        precio: Utils.getVal('single-precio'),
        ga: Utils.getVal('single-ga'),
        convenio: Utils.isChecked('single-convenio'),
      }],
      incoterm: Utils.getSelect('single-incoterm'),
      costosLocales: {
        estiba: Utils.getVal('single-estiba'),
        transporte_puerto: Utils.getVal('single-transporte_puerto'),
        despacho_exportacion: Utils.getVal('single-despacho_exportacion'),
        carga_buque: Utils.getVal('single-carga_buque'),
      },
      transporte1: Utils.getVal('single-transporte1'),
      transporte1Desc: Utils.getText('single-transporte1-desc'),
      transporte2: Utils.getVal('single-transporte2'),
      transporte2Desc: Utils.getText('single-transporte2-desc'),
      seguro: Utils.getVal('single-seguro'),
      otrosGastos: this._recogerOtrosGastos('single-otros-container'),
    };
  },

  /**
   * Recoge los datos del formulario multiple
   * @returns {Object}
   */
  _recogerDatosMultiple() {
    const container = document.getElementById('multiple-items-container');
    const itemRows = container.querySelectorAll('.item-row');
    const items = [];

    itemRows.forEach((row) => {
      const desc = row.querySelector('.item-desc')?.value || '';
      const precio = parseFloat(row.querySelector('.item-precio')?.value) || 0;
      const ga = parseFloat(row.querySelector('.item-ga')?.value) || 0;
      const convenio = row.querySelector('.item-convenio')?.checked || false;
      if (precio > 0) {
        items.push({ descripcion: desc, precio, ga, convenio });
      }
    });

    return {
      items,
      incoterm: Utils.getSelect('multiple-incoterm'),
      costosLocales: {
        estiba: Utils.getVal('multiple-estiba'),
        transporte_puerto: Utils.getVal('multiple-transporte_puerto'),
        despacho_exportacion: Utils.getVal('multiple-despacho_exportacion'),
        carga_buque: Utils.getVal('multiple-carga_buque'),
      },
      transporte1: Utils.getVal('multiple-transporte1'),
      transporte1Desc: Utils.getText('multiple-transporte1-desc'),
      transporte2: Utils.getVal('multiple-transporte2'),
      transporte2Desc: Utils.getText('multiple-transporte2-desc'),
      seguro: Utils.getVal('multiple-seguro'),
      otrosGastos: this._recogerOtrosGastos('multiple-otros-container'),
    };
  },

  /**
   * Recoge los datos de otros gastos del contenedor
   * @param {string} containerId
   * @returns {Object}
   */
  _recogerOtrosGastos(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};

    const gastos = {};
    container.querySelectorAll('.gasto-item').forEach((row, idx) => {
      const desc = row.querySelector('.gasto-desc')?.value || `Gasto ${idx + 1}`;
      const monto = parseFloat(row.querySelector('.gasto-monto')?.value) || 0;
      gastos[desc] = monto;
    });
    return gastos;
  },

  /**
   * Ejecuta el cálculo para el formulario de 1 item
   */
  calcularSingle() {
    const data = this._recogerDatosSingle();
    const resultado = Calculator.calcularCompleto(data);
    this._mostrarResultados('single-resultados', data, resultado);
  },

  /**
   * Ejecuta el cálculo para el formulario de varios items
   */
  calcularMultiple() {
    const data = this._recogerDatosMultiple();
    if (data.items.length === 0) {
      alert('Debe agregar al menos un ítem con precio mayor a 0.');
      return;
    }
    const resultado = Calculator.calcularCompleto(data);
    this._mostrarResultados('multiple-resultados', data, resultado);
  },

  /**
   * Ejecuta el cálculo de tributo omitido
   */
  calcularOmitido() {
    const leer = (prefix) => ({
      fob: Utils.getVal(`omit-${prefix}-fob`),
      fleteMaritimo: Utils.getVal(`omit-${prefix}-fm`),
      fleteTerrestre: Utils.getVal(`omit-${prefix}-ft`),
      seguro: Utils.getVal(`omit-${prefix}-seguro`),
      otros: Utils.getVal(`omit-${prefix}-otros`),
    });

    const original = leer('orig');
    const fiscalizado = leer('fisc');
    const ga = Utils.getVal('omit-ga');
    const ufvVencimiento = Utils.getVal('omit-ufv-vto') || 1;
    const ufvPago = Utils.getVal('omit-ufv-pago') || 1;
    const diasMora = Utils.getVal('omit-dias') || 0;
    const tasaInteres = Utils.getVal('omit-tasa') || 0;
    const multaUFV = Utils.getVal('omit-multa-ufv') || 0;

    const resultado = Calculator.calcularTributoOmitidoCompleto({
      original, fiscalizado, ga,
      ufvVencimiento, ufvPago, diasMora, tasaInteres, multaUFV,
    });

    this._mostrarResultadosOmitido(resultado);
  },

  limpiarOmitido() {
    const form = document.getElementById('tab-omitted-content');
    if (form) {
      form.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => {
        if (['omit-ufv-vto', 'omit-ufv-pago', 'omit-dias', 'omit-tasa'].includes(el.id)) return;
        el.value = '';
      });
    }
    Utils.clearContainer('omit-resultados');
  },

  /**
   * Muestra los resultados de tributo omitido (4 tablas)
   */
  _mostrarResultadosOmitido(r) {
    const container = document.getElementById('omit-resultados');
    const o = r.tabla1.original;
    const f = r.tabla1.fiscalizado;

    const nf2 = (v) => v.toFixed(2);
    const usd = (v) => '$' + nf2(v);
    const bs = (v) => 'Bs ' + nf2(v);

    container.innerHTML = `
      <div class="resultados-card">

        <h3>Tabla 1: Cálculo de Liquidaciones y Tributos (TC: ${TC} Bs/USD)</h3>
        <div class="table-responsive">
          <table class="result-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Fórmula / Detalle</th>
                <th>Liquidación Original</th>
                <th>Liquidación Fiscalizada</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>FOB</td><td>Valor de la mercancía</td><td>${usd(o.fob)}</td><td>${usd(f.fob)}</td></tr>
              <tr><td>Fletes</td><td>Marítimo + Iquique-Pisiga</td><td>${usd(o.fletes)}</td><td>${usd(f.fletes)}</td></tr>
              <tr><td>Seguro</td><td>Póliza</td><td>${usd(o.seguro)}</td><td>${usd(f.seguro)}</td></tr>
              <tr><td>Otros Gastos</td><td>Gastos ASPB</td><td>${usd(o.otros)}</td><td>${usd(f.otros)}</td></tr>
              <tr class="total-row"><td><strong>CIF Frontera</strong></td><td><strong>FOB + Fletes + Seguro + Otros</strong></td>
                <td><strong>${usd(o.cifF)}</strong></td><td><strong>${usd(f.cifF)}</strong></td></tr>
              <tr class="total-row"><td><strong>CIF Bolivianos</strong></td><td><strong>CIF × ${TC}</strong></td>
                <td><strong>${bs(o.cifA)}</strong></td><td><strong>${bs(f.cifA)}</strong></td></tr>
              <tr><td>GA (${r.tabla3.tasaInteres || '—'}%)</td><td>CIF × GA%</td><td>${bs(o.ga)}</td><td>${bs(f.ga)}</td></tr>
              <tr><td>Base Imponible</td><td>CIF + GA</td><td>${bs(o.bi)}</td><td>${bs(f.bi)}</td></tr>
              <tr><td>IVA (${IVA_RATE}%)</td><td>Base Imponible × ${IVA_RATE}%</td><td>${bs(o.iva)}</td><td>${bs(f.iva)}</td></tr>
            </tbody>
          </table>
        </div>

        <h3>Tabla 2: Determinación del Tributo Omitido Histórico (TO)</h3>
        <div class="table-responsive">
          <table class="result-table">
            <thead>
              <tr><th>Concepto</th><th>Fórmula Aplicada</th><th>Valor Calculado</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>GA Omitido</td>
                <td>GA<sub>Fiscalizado</sub> − GA<sub>Original</sub> (${nf2(f.ga)} − ${nf2(o.ga)})</td>
                <td><strong>${bs(r.tabla2.gaOmitido)}</strong></td>
              </tr>
              <tr>
                <td>IVA Omitido</td>
                <td>IVA<sub>Fiscalizado</sub> − IVA<sub>Original</sub> (${nf2(f.iva)} − ${nf2(o.iva)})</td>
                <td><strong>${bs(r.tabla2.ivaOmitido)}</strong></td>
              </tr>
              <tr class="total-row">
                <td><strong>Tributo Omitido (TO)</strong></td>
                <td><strong>GA<sub>Omitido</sub> + IVA<sub>Omitido</sub></strong></td>
                <td><strong>${bs(r.tabla2.to)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Tabla 3: Parámetros para la Actualización de la Deuda</h3>
        <div class="params-result-grid">
          <div class="param-item"><span class="param-label">TO (Tributo Omitido Histórico):</span><span class="param-value">${bs(r.tabla3.to)}</span></div>
          <div class="param-item"><span class="param-label">UFV vencimiento:</span><span class="param-value">${r.tabla3.ufvVencimiento}</span></div>
          <div class="param-item"><span class="param-label">UFV pago:</span><span class="param-value">${r.tabla3.ufvPago}</span></div>
          <div class="param-item"><span class="param-label">Días de mora (n):</span><span class="param-value">${r.tabla3.diasMora} días</span></div>
          <div class="param-item"><span class="param-label">Tasa de interés anual (r):</span><span class="param-value">${r.tabla3.tasaInteres}%</span></div>
          <div class="param-item"><span class="param-label">Multa (UFV):</span><span class="param-value">${r.tabla3.multaUFV} UFV</span></div>
          <div class="param-item"><span class="param-label">Multa (Bs):</span><span class="param-value">${bs(r.tabla3.multaBs)}</span></div>
        </div>

        <h3>Tabla 4: Cálculo Final de la Deuda Tributaria (Ley 2492)</h3>
        <div class="table-responsive">
          <table class="result-table">
            <thead>
              <tr><th>Concepto</th><th>Fórmula Aplicada</th><th>Valor Calculado</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Mantenimiento de Valor (MV)</td>
                <td>(UFV<sub>pago</sub> / UFV<sub>vencimiento</sub> − 1) × TO</td>
                <td>${bs(r.tabla4.mv)}</td>
              </tr>
              <tr>
                <td>Tributo Actualizado (TO<sub>Act</sub>)</td>
                <td>TO + MV</td>
                <td>${bs(r.tabla4.toActualizado)}</td>
              </tr>
              <tr>
                <td>Intereses Moratorios (INT)</td>
                <td>TO<sub>Act</sub> × (1 + r/360)<sup>n</sup> − TO<sub>Act</sub></td>
                <td>${bs(r.tabla4.int)}</td>
              </tr>
              <tr>
                <td>Multa por Contravención</td>
                <td>${r.tabla3.multaUFV} UFV × UFV<sub>pago</sub> (${nf2(r.tabla3.ufvPago)})</td>
                <td>${bs(r.tabla4.multaBs)}</td>
              </tr>
              <tr class="total-row">
                <td><strong>TOTAL A PAGAR</strong></td>
                <td><strong>TO + MV + INT + Multa</strong></td>
                <td><strong>${bs(r.tabla4.totalDeuda)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="omitido-final">
          <div class="omitido-label">Total Deuda Tributaria + Multa a Pagar</div>
          <div class="omitido-valor">${bs(r.tabla4.totalDeuda)}</div>
          <div class="omitido-factor">TO ${bs(r.tabla2.to)} + MV ${bs(r.tabla4.mv)} + INT ${bs(r.tabla4.int)} + Multa ${bs(r.tabla4.multaBs)}</div>
        </div>
      </div>
    `;
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /**
   * Muestra resultados de liquidación en el contenedor
   * @param {string} containerId - ID del contenedor
   * @param {Object} data - Datos de entrada
   * @param {Object} resultado - Resultado del cálculo
   */
  _mostrarResultados(containerId, data, resultado) {
    const container = document.getElementById(containerId);
    const { fobIndividuals, totalFob, liquidacion, itemsResult, totalTributos } = resultado;

    let html = '<div class="resultados-card">';
    html += '<h3>Resultados de Liquidación</h3>';

    html += '<h4>FOB Individual</h4>';
    html += '<div class="table-responsive"><table class="result-table"><thead><tr><th>Item</th><th>Precio (USD)</th><th>GA%</th><th>Convenio</th><th>FOB Individual (USD)</th></tr></thead><tbody>';
    data.items.forEach((item, idx) => {
      html += `<tr>
        <td>${item.descripcion || `Item ${idx + 1}`}</td>
        <td>${Utils.formatUSD(item.precio)}</td>
        <td>${item.ga}%</td>
        <td>${item.convenio ? 'Sí' : 'No'}</td>
        <td><strong>${Utils.formatUSD(fobIndividuals[idx])}</strong></td>
      </tr>`;
    });
    html += `<tr class="total-row"><td colspan="4"><strong>Total FOB</strong></td><td><strong>${Utils.formatUSD(totalFob)}</strong></td></tr>`;
    html += '</tbody></table></div>';

    html += '<h4>Liquidación General</h4>';
    html += '<div class="table-responsive"><table class="result-table"><tbody>';
    const liqRows = [
      { label: 'FOB', valor: liquidacion.fob, moneda: 'USD' },
      { label: 'Transporte 1', valor: liquidacion.transporte1, moneda: 'USD' },
      { label: 'Transporte 2', valor: liquidacion.transporte2, moneda: 'USD' },
      { label: 'Seguro', valor: liquidacion.seguro, moneda: 'USD' },
      { label: 'Otros Gastos', valor: liquidacion.otrosGastos, moneda: 'USD' },
      { label: 'CIF (USD)', valor: liquidacion.cifF, moneda: 'USD', total: true },
      { label: 'CIF (Bs)', valor: liquidacion.cifA, moneda: 'Bs', total: true },
    ];
    liqRows.forEach(r => {
      html += `<tr${r.total ? ' class="total-row"' : ''}>
        <td>${r.label}</td>
        <td>${r.moneda === 'USD' ? Utils.formatUSD(r.valor) : Utils.formatBOB(r.valor)}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    html += '<h4>Tributos por Ítem</h4>';
    html += '<div class="table-responsive"><table class="result-table"><thead><tr>';
    html += '<th>Item</th><th>FPxFOB (Bs)</th><th>GA%</th><th>GA (Bs)</th><th>BI (Bs)</th><th>IVA (Bs)</th>';
    html += '</tr></thead><tbody>';
    itemsResult.forEach(item => {
      html += `<tr>
        <td>${item.descripcion}</td>
        <td>${Utils.formatBOB(item.fpxFob)}</td>
        <td>${item.gaEfectivo}%${item.convenio ? `*` : ''}</td>
        <td>${Utils.formatBOB(item.ga)}</td>
        <td>${Utils.formatBOB(item.bi)}</td>
        <td>${Utils.formatBOB(item.iva)}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    html += '<div class="total-tributos">';
    html += `<div class="total-label">Total Tributos a Pagar</div>`;
    html += `<div class="total-valor">${Utils.formatBOB(totalTributos)}</div>`;
    html += `</div>`;

    if (data.items.some(i => i.convenio)) {
      html += '<p class="help-text">* GA reducido por convenio internacional (factor: ' + (CONVENIO_GA_FACTOR * 100) + '%)</p>';
    }

    html += '</div>';
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /**
   * Limpia un formulario
   * @param {string} formId - ID del formulario
   */
  limpiarFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
      form.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
      form.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
    }
    const tab = formId === 'form-single' ? 'single' : formId === 'form-multiple' ? 'multiple' : 'omitted';
    Utils.clearContainer(`${tab}-resultados`);
  },
};
