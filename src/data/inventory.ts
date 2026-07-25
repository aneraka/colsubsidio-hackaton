export type Categoria = "Carnes" | "Lácteos" | "Vegetales" | "Bebidas";
export type Unidad = "Kg" | "Litros" | "Unidades";

export interface Articulo {
  id: string;
  nombre: string;
  categoria: Categoria;
  cantidad: number;
  unidad: Unidad;
  costoUnitario: number;
}

export const CATEGORIAS: Categoria[] = ["Carnes", "Lácteos", "Vegetales", "Bebidas"];
export const UNIDADES: Unidad[] = ["Kg", "Litros", "Unidades"];

export const initialArticulos: Articulo[] = [
  { id: "1", nombre: "Lomo de res", categoria: "Carnes", cantidad: 12, unidad: "Kg", costoUnitario: 18.5 },
  { id: "2", nombre: "Pechuga de pollo", categoria: "Carnes", cantidad: 3, unidad: "Kg", costoUnitario: 8.9 },
  { id: "3", nombre: "Leche entera", categoria: "Lácteos", cantidad: 24, unidad: "Litros", costoUnitario: 1.4 },
  { id: "4", nombre: "Queso mozzarella", categoria: "Lácteos", cantidad: 4, unidad: "Kg", costoUnitario: 9.2 },
  { id: "5", nombre: "Mantequilla", categoria: "Lácteos", cantidad: 2, unidad: "Kg", costoUnitario: 6.5 },
  { id: "6", nombre: "Tomate", categoria: "Vegetales", cantidad: 18, unidad: "Kg", costoUnitario: 1.8 },
  { id: "7", nombre: "Lechuga romana", categoria: "Vegetales", cantidad: 9, unidad: "Unidades", costoUnitario: 1.2 },
  { id: "8", nombre: "Cebolla", categoria: "Vegetales", cantidad: 22, unidad: "Kg", costoUnitario: 0.9 },
  {
    id: "9",
    nombre: "Vino tinto reserva",
    categoria: "Bebidas",
    cantidad: 14,
    unidad: "Unidades",
    costoUnitario: 12.0,
  },
  { id: "10", nombre: "Agua mineral", categoria: "Bebidas", cantidad: 48, unidad: "Unidades", costoUnitario: 0.6 },
  { id: "11", nombre: "Cerveza artesanal", categoria: "Bebidas", cantidad: 4, unidad: "Unidades", costoUnitario: 2.8 },
  { id: "12", nombre: "Salmón fresco", categoria: "Carnes", cantidad: 6, unidad: "Kg", costoUnitario: 22.0 },
];

export const STOCK_BAJO_UMBRAL = 5;
