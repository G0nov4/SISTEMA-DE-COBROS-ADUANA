/**
 * calculator.js - Motor de cálculo de tributos aduaneros
 *
 * Implementa toda la lógica de negocio para el cálculo de tributos
 * de importación en Bolivia según el Incoterm seleccionado.
 *
 * Flujo general:
 * 1. Determinar FOB individual de cada item según Incoterm
 * 2. Sumar FOB total
 * 3. Calcular CIF (FOB + transportes + seguro + otros gastos)
 * 4. Convertir CIF a Bolivianos (CIFa)
 * 5. Distribuir CIFa proporcionalmente a cada item (FPxFOB)
 * 6. Calcular GA, BI e IVA por item
 * 7. Sumar total de tributos
 */

const Calculator = {
  /**
   * Determina qué costos están incluidos en el precio según el Incoterm
   * y cuáles deben agregarse para llegar al FOB.
   *
   * @param {string} incoterm - Código del Incoterm (EXW, FOB, CFR, CIF, DAP)
   * @returns {Object} { preFOB: string[], postFOB: string[] }
   */
  _analizarIncoterm(incoterm) {
    const def = INCOTERMS[incoterm] || INCOTERMS.EXW;
    return def;
  },

  /**
   * Calcula la suma de costos locales pre-FOB
   * @param {Object} costosLocales - { estiba, transporte_puerto, despacho_exportacion, carga_buque }
   * @returns {number}
   */
  _totalCostosLocales(costosLocales) {
    return Utils.sum([
      costosLocales.estiba || 0,
      costosLocales.transporte_puerto || 0,
      costosLocales.despacho_exportacion || 0,
      costosLocales.carga_buque || 0,
    ]);
  },

  /**
   * Calcula el FOB individual de cada item según el Incoterm
   *
   * Reglas por Incoterm:
   * - EXW: Precio + costos locales pre-FOB
   * - FOB: Precio (sin ajuste)
   * - CFR: Precio - transporteCIF (incluido en el precio)
   * - CIF: Precio - transporteCIF - seguro (incluidos en el precio)
   * - DAP: Precio - transporteTotal - seguro - otros (todo incluido)
   *
   * @param {Object[]} items - Array de items { precio, ga, convenio }
   * @param {string} incoterm - Código Incoterm
   * @param {Object} costos - Todos los costos ingresados
   * @returns {Object} { fobIndividuals, totalFob, transportesCIF, transportesNoCIF }
   */
  _montoCIFdeTransporte(t) {
    return Utils.round2((Number(t.monto) || 0) * (Number(t.cifPct) || 0) / 100);
  },

  calcularFOBIndividual(items, incoterm, costos) {
    const totalPrecio = Utils.sum(items.map(i => i.precio));
    const costosLocalesTotal = this._totalCostosLocales(costos.costosLocales);
    const transporteCIF = Utils.sum(costos.transportes.map(t => this._montoCIFdeTransporte(t)));
    const transporteTotal = Utils.sum(costos.transportes.map(t => Number(t.monto) || 0));
    const seguro = Number(costos.seguro) || 0;
    const otrosTotal = Utils.sum(Object.values(costos.otrosGastos || {}));

    const fobIndividuals = items.map(item => {
      const precio = Number(item.precio) || 0;
      const proporcion = Utils.proporcion(precio, totalPrecio);

      switch (incoterm) {
        case 'EXW':
          return Utils.round2(precio + proporcion * costosLocalesTotal);

        case 'FCA':
        case 'FOB':
          return Utils.round2(precio);

        case 'CFR':
          return Utils.round2(precio - proporcion * transporteCIF);

        case 'CIF':
          return Utils.round2(precio - proporcion * (transporteCIF + seguro));

        case 'DAP': {
          const postFOB = transporteTotal + seguro + otrosTotal;
          return Utils.round2(precio - proporcion * postFOB);
        }

        default:
          return Utils.round2(precio);
      }
    });

    const totalFob = Utils.round2(Utils.sum(fobIndividuals));
    const transportesNoCIF = costos.transportes.filter(t => (Number(t.cifPct) || 0) < 100).map(t => ({
      ...t, montoNoCIF: Utils.round2((Number(t.monto) || 0) * (100 - (Number(t.cifPct) || 0)) / 100)
    }));

    return { fobIndividuals, totalFob, transportesCIF: transporteCIF, transportesNoCIF };
  },

  /**
   * Calcula la liquidación general del embarque
   *
   * @param {number} totalFob
   * @param {Object} costos
   * @returns {Object} { fob, transportes, fleteCIF, seguro, otrosGastos, cifF, cifA }
   */
  liquidacionGeneral(totalFob, costos) {
    const fob = totalFob;
    const transportes = costos.transportes || [];
    const fleteCIF = Utils.sum(transportes.map(t => Calculator._montoCIFdeTransporte(t)));
    const seguro = Number(costos.seguro) || 0;
    const otrosGastos = Utils.sum(Object.values(costos.otrosGastos || {}));

    const cifF = Utils.round2(fob + fleteCIF + seguro + otrosGastos);
    const cifA = Utils.round2(Utils.usdToBob(cifF));

    return { fob, transportes, fleteCIF, seguro, otrosGastos, cifF, cifA };
  },

  /**
   * Calcula los tributos por item (FPxFOB, GA, BI, IVA)
   *
   * Fórmulas:
   * - FPxFOB = (FOBi / FOBtotal) * CIFa
   * - GA = FPxFOB * (GA% / 100)
   * - BI = FPxFOB + GA
   * - IVA = BI * (IVA% / 100)
   *
   * @param {Object[]} items - Items con precio y GA
   * @param {number[]} fobIndividuals - FOB individual por item
   * @param {number} totalFob - Suma de FOBs
   * @param {Object} liquidacion - Resultado de liquidacionGeneral
   * @returns {Object[]} Array con tributos por item
   */
  liquidacionItems(items, fobIndividuals, totalFob, liquidacion) {
    const { cifA } = liquidacion;
    const resultados = [];

    items.forEach((item, idx) => {
      const fobI = fobIndividuals[idx];
      const proporcion = Utils.proporcion(fobI, totalFob);
      const gaPorcentaje = Number(item.ga) || 0;

      let gaEfectivo = gaPorcentaje;
      if (item.convenio === 'partial') {
        gaEfectivo = gaPorcentaje * CONVENIO_GA_FACTOR;
      } else if (item.convenio === 'full') {
        gaEfectivo = 0;
      }

      const fpxFob = Utils.round2(proporcion * cifA);
      const ga = Utils.roundTributo(fpxFob * (gaEfectivo / 100));
      const bi = Utils.roundTributo(fpxFob + ga);
      const iva = Utils.roundTributo(bi * (IVA_RATE / 100));

      resultados.push({
        index: idx,
        descripcion: item.descripcion || `Item ${idx + 1}`,
        precio: item.precio,
        gaPorcentaje: gaPorcentaje,
        gaEfectivo: gaEfectivo,
        fobI: fobI,
        fpxFob: fpxFob,
        ga: ga,
        bi: bi,
        iva: iva,
        convenio: !!item.convenio,
      });
    });

    return resultados;
  },

  /**
   * Calcula el total de tributos a pagar
   * @param {Object[]} itemsResult - Resultado de liquidacionItems
   * @returns {number}
   */
  totalTributos(itemsResult) {
    const totalGA = Utils.sum(itemsResult.map(i => i.ga));
    const totalIVA = Utils.sum(itemsResult.map(i => i.iva));
    return Utils.roundTributo(totalGA + totalIVA);
  },

  /**
   * Ejecuta el cálculo completo para un conjunto de items
   *
   * @param {Object} params
   * @param {Object[]} params.items - Array de items { descripcion, precio, ga, convenio }
   * @param {string} params.incoterm - Código Incoterm
   * @param {Object} params.costosLocales - Costos pre-FOB
   * @param {Object[]} params.transportes - Array de { desc, monto, incluyeCIF }
   * @param {number} params.seguro - Seguro
   * @param {Object} params.otrosGastos - Otros gastos { descripcion: monto }
   * @returns {Object} Resultado completo del cálculo
   */
  calcularCompleto({ items, incoterm, costosLocales, transportes, seguro, otrosGastos }) {
    const costos = { costosLocales, transportes, seguro, otrosGastos };

    const { fobIndividuals, totalFob } = this.calcularFOBIndividual(items, incoterm, costos);
    const liquidacion = this.liquidacionGeneral(totalFob, costos);
    const itemsResult = this.liquidacionItems(items, fobIndividuals, totalFob, liquidacion);
    const total = this.totalTributos(itemsResult);

    return {
      fobIndividuals,
      totalFob,
      liquidacion,
      itemsResult,
      totalTributos: total,
    };
  },

  /**
   * Calcula el tributo omitido completo con actualización de deuda
   *
   * Flujo (4 tablas):
   *   Tabla 1: Liquidación original vs fiscalizada → CIF, GA, BI, IVA
   *   Tabla 2: Determinación del Tributo Omitido Histórico (TO)
   *   Tabla 3: Parámetros de actualización (UFV, días, tasa)
   *   Tabla 4: Cálculo final: MV, TO actualizado, intereses, total
   *
   * @param {Object} params
   * @param {Object} params.original   - { fob, fleteMaritimo, fleteTerrestre, seguro, otros }
   * @param {Object} params.fiscalizado - { fob, fleteMaritimo, fleteTerrestre, seguro, otros }
   * @param {number} params.ga            - Gravamen Arancelario en %
   * @param {number} params.ufvVencimiento - UFV fecha original
   * @param {number} params.ufvPago        - UFV fecha de pago
   * @param {number} params.diasMora       - Días de mora (n)
   * @param {number} params.tasaInteres    - Tasa de interés anual (%, ej: 6)
   * @param {number} params.multaUFV       - Multa fijada en UFV (ej: 250)
   * @returns {Object} { tabla1, tabla2, tabla3, tabla4 }
   */
  calcularTributoOmitidoCompleto({ original, fiscalizado, ga, ufvVencimiento, ufvPago, diasMora, tasaInteres, multaUFV }) {

    const _calcEscenario = (d) => {
      const fletes = Utils.round2(d.fleteMaritimo + d.fleteTerrestre);
      const cifF = Utils.round2(d.fob + fletes + d.seguro + d.otros);
      const cifA = Utils.round2(cifF * TC);
      const gaVal = Utils.round2(cifA * (ga / 100));
      const bi = Utils.round2(cifA + gaVal);
      const iva = Utils.round2(bi * (IVA_RATE / 100));
      return { fob: d.fob, fletes, seguro: d.seguro, otros: d.otros, cifF, cifA, ga: gaVal, bi, iva };
    };

    const orig = _calcEscenario(original);
    const fisc = _calcEscenario(fiscalizado);

    const gaOmitido = Utils.round2(fisc.ga - orig.ga);
    const ivaOmitido = Utils.round2(fisc.iva - orig.iva);
    const to = Utils.round2(gaOmitido + ivaOmitido);

    const mv = (ufvVencimiento && ufvPago)
      ? Utils.round2((ufvPago / ufvVencimiento - 1) * to)
      : 0;
    const toActualizado = Utils.round2(to + mv);
    const int = (diasMora && tasaInteres)
      ? Utils.round2(toActualizado * Math.pow(1 + (tasaInteres / 100) / 360, diasMora) - toActualizado)
      : 0;
    const multaBs = Utils.round2((multaUFV || 0) * (ufvPago || 1));
    const totalDeuda = Utils.round2(to + mv + int + multaBs);

    return {
      tabla1: { original: orig, fiscalizado: fisc },
      tabla2: { gaOmitido, ivaOmitido, to },
      tabla3: { to, ufvVencimiento: ufvVencimiento || 0, ufvPago: ufvPago || 0, diasMora: diasMora || 0, tasaInteres: tasaInteres || 0, multaUFV: multaUFV || 0, multaBs },
      tabla4: { mv, toActualizado, int, multaBs, totalDeuda },
    };
  },
};
