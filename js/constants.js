/**
 * constants.js - Constantes del sistema de cálculo de tributos aduaneros
 *
 * Contiene todos los valores fijos utilizados en los cálculos:
 * - Tipo de cambio (TC)
 * - Tasas impositivas (IVA)
 * - Definiciones de Incoterms y qué costos incluye cada uno
 * - Costos pre-FOB y post-FOB por defecto
 * - Factor de convenio internacional
 */

const TC = 6.96;
const IVA_RATE = 14.94;
const CONVENIO_GA_FACTOR = 0.5;

const COSTOS_LOCALES_PREFOB = [
  { id: 'estiba', label: 'Estiba', default: 0 },
  { id: 'transporte_puerto', label: 'Transporte al puerto', default: 0 },
  { id: 'despacho_exportacion', label: 'Despacho de exportación', default: 0 },
  { id: 'carga_buque', label: 'Carga al buque', default: 0 },
];

const OTROS_GASTOS_SUGERIDOS = [
  { label: 'Gastos de puerto', default: 0 },
  { label: 'ASPB', default: 0 },
  { label: 'Descarga en destino', default: 0 },
  { label: 'Estiba en destino', default: 0 },
  { label: 'Comisión agente', default: 0 },
];

const INCOTERMS = {
  EXW: {
    label: 'EXW (Ex Works / En Fábrica)',
    incluye: [],
    descripcion: 'El vendedor entrega la mercancía en su fábrica. El comprador asume todos los costos y riesgos desde la recogida.',
  },
  FOB: {
    label: 'FOB (Free On Board / Franco a Bordo)',
    incluye: ['estiba', 'transporte_puerto', 'despacho_exportacion', 'carga_buque'],
    descripcion: 'El vendedor entrega la mercancía a bordo del buque en el puerto de origen. Incluye costos locales pre-FOB.',
  },
  CFR: {
    label: 'CFR (Cost and Freight / Costo y Flete)',
    incluye: ['estiba', 'transporte_puerto', 'despacho_exportacion', 'carga_buque', 'transporte1'],
    descripcion: 'El vendedor cubre costo, flete marítimo y costos locales. No incluye seguro.',
  },
  CIF: {
    label: 'CIF (Cost, Insurance and Freight / Costo, Seguro y Flete)',
    incluye: ['estiba', 'transporte_puerto', 'despacho_exportacion', 'carga_buque', 'transporte1', 'seguro'],
    descripcion: 'El vendedor cubre costo, seguro y flete hasta el puerto de destino.',
  },
  DAP: {
    label: 'DAP (Delivered at Place / Entregado en Lugar)',
    incluye: ['estiba', 'transporte_puerto', 'despacho_exportacion', 'carga_buque', 'transporte1', 'transporte2', 'seguro', 'otros'],
    descripcion: 'El vendedor entrega la mercancía en el lugar acordado del país de destino. Incluye todos los costos.',
  },
};

const MODOS_TRANSPORTE = [
  { id: 'maritimo', label: 'Marítimo' },
  { id: 'aereo', label: 'Aéreo' },
  { id: 'terrestre', label: 'Terrestre' },
];

const TIPOS_TRANSPORTE = [
  { id: 'modal', label: 'Modal' },
  { id: 'multimodal', label: 'Multimodal' },
];
