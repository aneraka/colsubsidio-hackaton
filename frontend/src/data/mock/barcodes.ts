// Mapeos EAN → productoId de ejemplo (escaneo exitoso). Los EAN no listados quedan
// "sin mapear" para ejercitar el flujo de enrolamiento.
export const BARCODES_MOCK: Record<string, string> = {
  '7702011012345': 'p-001', // ARAGAN MEDIANO
  '7702011099887': 'p-002', // ALCOHOL GLICERINADO
  '7501031311309': 'p-014', // AGUA BOTELLON
  '7702001234560': 'p-018', // ARROZ BLANCO x 500G
  '7702001234577': 'p-019', // ARROZ DOÑA PEPA x 1KG
  '7702084003001': 'p-009', // ACEITE GIRASOL 20L
}
