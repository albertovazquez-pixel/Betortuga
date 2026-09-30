// Datos del tablero de Betortuga: carrera y negocio de tortugas alrededor de la laguna.
// Estructura inspirada en el clásico juego de compra-venta de propiedades, con
// nombres, tema y textos 100% originales (sin marcas registradas).

const COLORS = {
  charco: '#8b5a2b',
  playa: '#9ad9ea',
  lomita: '#e91e8c',
  muelle: '#f5a623',
  bahia: '#e53935',
  isla: '#f9e547',
  selva: '#3fa34d',
  cima: '#1f5fbf',
};

const BOARD = [
  { id: 0, type: 'go', name: 'Salida' },
  { id: 1, type: 'property', name: 'Charco Chico', group: 'charco', price: 60, rent: [2, 4], color: COLORS.charco },
  { id: 2, type: 'chest', name: 'Caja Comunal' },
  { id: 3, type: 'property', name: 'Charco Grande', group: 'charco', price: 60, rent: [4, 8], color: COLORS.charco },
  { id: 4, type: 'tax', name: 'Impuesto de Mercado', amount: 200 },
  { id: 5, type: 'station', name: 'Embarcadero Norte', price: 200 },
  { id: 6, type: 'property', name: 'Playa Arenosa', group: 'playa', price: 100, rent: [6, 12], color: COLORS.playa },
  { id: 7, type: 'chance', name: 'Suerte' },
  { id: 8, type: 'property', name: 'Playa Coral', group: 'playa', price: 100, rent: [6, 12], color: COLORS.playa },
  { id: 9, type: 'property', name: 'Playa Concha', group: 'playa', price: 120, rent: [8, 16], color: COLORS.playa },
  { id: 10, type: 'jail', name: 'Caparazón (Cárcel / Visita)' },
  { id: 11, type: 'property', name: 'Lomita Verde', group: 'lomita', price: 140, rent: [10, 20], color: COLORS.lomita },
  { id: 12, type: 'utility', name: 'Pozo de Agua Fresca', price: 150 },
  { id: 13, type: 'property', name: 'Lomita del Sol', group: 'lomita', price: 140, rent: [10, 20], color: COLORS.lomita },
  { id: 14, type: 'property', name: 'Lomita Feliz', group: 'lomita', price: 160, rent: [12, 24], color: COLORS.lomita },
  { id: 15, type: 'station', name: 'Embarcadero Sur', price: 200 },
  { id: 16, type: 'property', name: 'Muelle Viejo', group: 'muelle', price: 180, rent: [14, 28], color: COLORS.muelle },
  { id: 17, type: 'chest', name: 'Caja Comunal' },
  { id: 18, type: 'property', name: 'Muelle Nuevo', group: 'muelle', price: 180, rent: [14, 28], color: COLORS.muelle },
  { id: 19, type: 'property', name: 'Muelle del Faro', group: 'muelle', price: 200, rent: [16, 32], color: COLORS.muelle },
  { id: 20, type: 'parking', name: 'Descanso a la Sombra' },
  { id: 21, type: 'property', name: 'Bahía Tranquila', group: 'bahia', price: 220, rent: [18, 36], color: COLORS.bahia },
  { id: 22, type: 'chance', name: 'Suerte' },
  { id: 23, type: 'property', name: 'Bahía Azul', group: 'bahia', price: 220, rent: [18, 36], color: COLORS.bahia },
  { id: 24, type: 'property', name: 'Bahía Dorada', group: 'bahia', price: 240, rent: [20, 40], color: COLORS.bahia },
  { id: 25, type: 'station', name: 'Embarcadero Este', price: 200 },
  { id: 26, type: 'property', name: 'Isla Tortuga', group: 'isla', price: 260, rent: [22, 44], color: COLORS.isla },
  { id: 27, type: 'property', name: 'Isla Coco', group: 'isla', price: 260, rent: [22, 44], color: COLORS.isla },
  { id: 28, type: 'utility', name: 'Central Eléctrica', price: 150 },
  { id: 29, type: 'property', name: 'Isla Perla', group: 'isla', price: 280, rent: [24, 48], color: COLORS.isla },
  { id: 30, type: 'gotojail', name: 'Ve al Caparazón' },
  { id: 31, type: 'property', name: 'Selva Baja', group: 'selva', price: 300, rent: [26, 52], color: COLORS.selva },
  { id: 32, type: 'property', name: 'Selva Alta', group: 'selva', price: 300, rent: [26, 52], color: COLORS.selva },
  { id: 33, type: 'chest', name: 'Caja Comunal' },
  { id: 34, type: 'property', name: 'Selva Encantada', group: 'selva', price: 320, rent: [28, 56], color: COLORS.selva },
  { id: 35, type: 'station', name: 'Embarcadero Oeste', price: 200 },
  { id: 36, type: 'chance', name: 'Suerte' },
  { id: 37, type: 'property', name: 'Cima del Caparazón', group: 'cima', price: 350, rent: [35, 70], color: COLORS.cima },
  { id: 38, type: 'tax', name: 'Impuesto de Lujo', amount: 100 },
  { id: 39, type: 'property', name: 'Palacio Tortuga', group: 'cima', price: 400, rent: [50, 100], color: COLORS.cima },
];

const CHANCE_CARDS = [
  { text: 'Ganaste la carrera anual de tortugas. Cobra 150.', effect: (p) => p.pay(-150) },
  { text: 'Multa por nadar fuera de la zona. Paga 50.', effect: (p) => p.pay(50) },
  { text: 'Avanza hasta la Salida y cobra 200.', effect: (p, g) => g.moveTo(p, 0, true) },
  { text: 'Ve directo al Caparazón (cárcel).', effect: (p, g) => g.sendToJail(p) },
  { text: 'Retrocede 3 casillas.', effect: (p, g) => g.moveBy(p, -3) },
  { text: 'Tarjeta de "Sal Libre del Caparazón". Consérvala.', effect: (p) => { p.getOutOfJailFree += 1; } },
  { text: 'Reparaciones en tu caparazón: paga 25 por propiedad.', effect: (p) => p.pay(25 * p.properties.length) },
  { text: 'Encontraste una concha valiosa. Cobra 50.', effect: (p) => p.pay(-50) },
  { text: 'Viaja al Embarcadero más cercano.', effect: (p, g) => g.moveToNearest(p, 'station') },
  { text: 'Viaja a Isla Tortuga.', effect: (p, g) => g.moveTo(p, 26) },
];

const CHEST_CARDS = [
  { text: 'Error del banco a tu favor. Cobra 200.', effect: (p) => p.pay(-200) },
  { text: 'Honorarios del veterinario. Paga 100.', effect: (p) => p.pay(100) },
  { text: 'Venta de conchas artesanales. Cobra 80.', effect: (p) => p.pay(-80) },
  { text: 'Impuesto por mantenimiento de la laguna. Paga 40.', effect: (p) => p.pay(40) },
  { text: 'Es tu cumpleaños. Cada jugador te da 10.', effect: (p, g) => g.collectFromAll(p, 10) },
  { text: 'Tarjeta de "Sal Libre del Caparazón". Consérvala.', effect: (p) => { p.getOutOfJailFree += 1; } },
  { text: 'Ve directo al Caparazón (cárcel).', effect: (p, g) => g.sendToJail(p) },
  { text: 'Herencia de la tortuga abuela. Cobra 100.', effect: (p) => p.pay(-100) },
  { text: 'Avanza hasta la Salida y cobra 200.', effect: (p, g) => g.moveTo(p, 0, true) },
  { text: 'Pagas la escuela de natación. Paga 50.', effect: (p) => p.pay(50) },
];

const STARTING_MONEY = 1500;
