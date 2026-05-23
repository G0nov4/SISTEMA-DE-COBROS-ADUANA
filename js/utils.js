/**
 * utils.js - Funciones utilitarias del sistema
 *
 * Proporciona herramientas de uso general:
 * - Formateo de números y monedas
 * - Validación de datos de entrada
 * - Cálculos auxiliares (sumatorias, proporciones)
 * - Manejo de eventos y DOM
 */

const Utils = {
  /**
   * Formatea un número como moneda en USD
   * @param {number} value - Valor a formatear
   * @returns {string} Valor formateado ej: "$1,234.56"
   */
  formatUSD(value) {
    const num = Number(value) || 0;
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Formatea un número como moneda en Bolivianos
   * @param {number} value - Valor a formatear
   * @returns {string} Valor formateado ej: "Bs 1,234.56"
   */
  formatBOB(value) {
    const num = Number(value) || 0;
    return 'Bs ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Formatea un número con separador de miles
   * @param {number} value - Valor a formatear
   * @param {number} decimals - Cantidad de decimales
   * @returns {string}
   */
  formatNumber(value, decimals = 2) {
    const num = Number(value) || 0;
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Convierte USD a Bolivianos usando el TC
   * @param {number} usd - Valor en dólares
   * @returns {number} Valor en bolivianos
   */
  usdToBob(usd) {
    return (Number(usd) || 0) * TC;
  },

  /**
   * Obtiene el valor numérico de un input del DOM
   * @param {string} id - ID del elemento
   * @returns {number}
   */
  getVal(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return parseFloat(el.value) || 0;
  },

  /**
   * Obtiene el valor de texto de un input
   * @param {string} id - ID del elemento
   * @returns {string}
   */
  getText(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.value.trim();
  },

  /**
   * Obtiene el valor seleccionado de un select
   * @param {string} id - ID del elemento select
   * @returns {string}
   */
  getSelect(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.value;
  },

  /**
   * Verifica si un checkbox está marcado
   * @param {string} id - ID del elemento checkbox
   * @returns {boolean}
   */
  isChecked(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    return el.checked;
  },

  /**
   * Asigna un valor a un elemento del DOM
   * @param {string} id - ID del elemento
   * @param {string|number} value - Valor a asignar
   */
  setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  },

  /**
   * Redondea un número al entero más cercano (para tributos)
   * @param {number} value
   * @returns {number}
   */
  roundTributo(value) {
    return Math.round(Number(value) || 0);
  },

  /**
   * Redondea con 2 decimales
   * @param {number} value
   * @returns {number}
   */
  round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  },

  /**
   * Calcula la participación proporcional de un valor en un total
   * @param {number} value - Valor parcial
   * @param {number} total - Valor total
   * @returns {number} Proporción (0-1)
   */
  proporcion(value, total) {
    if (!total || total === 0) return 0;
    return (Number(value) || 0) / total;
  },

  /**
   * Suma un array de números
   * @param {number[]} arr
   * @returns {number}
   */
  sum(arr) {
    return arr.reduce((a, b) => a + (Number(b) || 0), 0);
  },

  /**
   * Crea un elemento HTML con atributos y contenido
   * @param {string} tag - Etiqueta HTML
   * @param {Object} attrs - Atributos del elemento
   * @param {string|HTMLElement} content - Contenido del elemento
   * @returns {HTMLElement}
   */
  createElement(tag, attrs = {}, content = '') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([k, v]) => {
          el.dataset[k] = v;
        });
      } else if (key.startsWith('on')) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });
    if (content instanceof HTMLElement) {
      el.appendChild(content);
    } else if (content) {
      el.innerHTML = content;
    }
    return el;
  },

  /**
   * Limpia el contenido de un contenedor
   * @param {string|HTMLElement} container - ID o elemento del contenedor
   */
  clearContainer(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (el) {
      el.innerHTML = '';
    }
  },

  /**
   * Muestra u oculta un elemento
   * @param {string} id - ID del elemento
   * @param {boolean} show - true para mostrar, false para ocultar
   */
  toggle(id, show) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = show ? '' : 'none';
    }
  },

  /**
   * Exporta contenido a un archivo descargable
   * @param {string} filename - Nombre del archivo
   * @param {string} content - Contenido
   * @param {string} mimeType - Tipo MIME
   */
  download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Copia texto al portapapeles
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  },

  /**
   * Convierte un elemento HTML table a texto tabular
   * @param {HTMLElement} tableEl
   * @returns {string}
   */
  tableToText(tableEl) {
    const rows = tableEl.querySelectorAll('tr');
    const lines = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      const vals = [];
      cells.forEach(c => {
        let text = c.textContent.trim().replace(/\s+/g, ' ');
        vals.push(text);
      });
      lines.push(vals.join('\t'));
    });
    return lines.join('\n');
  },

  /**
   * Genera CSV (Excel-compatible) desde un elemento table
   * @param {HTMLElement} tableEl
   * @returns {string}
   */
  tableToCSV(tableEl) {
    const rows = tableEl.querySelectorAll('tr');
    const lines = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      const vals = [];
      cells.forEach(c => {
        let text = c.textContent.trim().replace(/\s+/g, ' ');
        if (text.includes(',') || text.includes('"')) {
          text = '"' + text.replace(/"/g, '""') + '"';
        }
        vals.push(text);
      });
      lines.push(vals.join(','));
    });
    return lines.join('\r\n');
  },

  /**
   * Genera Markdown desde un elemento table
   * @param {HTMLElement} tableEl
   * @returns {string}
   */
  tableToMD(tableEl) {
    const rows = tableEl.querySelectorAll('tr');
    if (!rows.length) return '';
    const lines = [];

    const headerCells = rows[0].querySelectorAll('th, td');
    const header = headerCells.map(c => c.textContent.trim().replace(/\s+/g, ' '));
    lines.push('| ' + header.join(' | ') + ' |');
    lines.push('| ' + header.map(() => '---').join(' | ') + ' |');

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td');
      const vals = cells.map(c => c.textContent.trim().replace(/\s+/g, ' '));
      lines.push('| ' + vals.join(' | ') + ' |');
    }

    return lines.join('\n');
  },

  /**
   * Concatena todas las tablas de resultados en un solo texto
   * @param {string} containerId - ID del contenedor de resultados
   * @returns {{ text: string, csv: string, md: string }}
   */
  exportarResultados(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return { text: '', csv: '', md: '' };

    const tables = container.querySelectorAll('.result-table');
    const titulos = container.querySelectorAll('h3, h4');
    const textParts = [];
    const csvParts = [];
    const mdParts = [];

    let ti = 0;
    tables.forEach((tbl, idx) => {
      while (ti < titulos.length && titulos[ti].closest('.resultados-card')) {
        if (titulos[ti].closest('.resultados-card') === container.querySelector('.resultados-card')) {
          // fall through
        }
        ti++;
      }
      const prevH = tbl.closest('.resultados-card')?.querySelector('h3');
      if (prevH) textParts.push('\n' + prevH.textContent.trim() + '\n');
      if (prevH) mdParts.push('\n## ' + prevH.textContent.trim() + '\n');

      textParts.push(this.tableToText(tbl));
      csvParts.push(this.tableToCSV(tbl));
      mdParts.push(this.tableToMD(tbl));
    });

    return {
      text: textParts.join('\n\n'),
      csv: csvParts.join('\n\n'),
      md: mdParts.join('\n\n'),
    };
  },
};
