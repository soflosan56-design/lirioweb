import type { GarmentDetails } from '@/lib/types';

export const CONDITIONS = ['Nuevo con etiqueta', 'Muy buen estado', 'Usado'];

export type GarmentFormValues = {
  brand: string;
  size: string;
  condition: string;
  material: string;
  description: string;
};

export const EMPTY_GARMENT_FORM: GarmentFormValues = {
  brand: '',
  size: '',
  condition: CONDITIONS[1],
  material: '',
  description: '',
};

export function toGarmentDetails(values: GarmentFormValues): GarmentDetails {
  return {
    brand: values.brand.trim() || null,
    size: values.size.trim() || null,
    condition: values.condition || null,
    material: values.material.trim() || null,
    description: values.description.trim() || null,
  };
}
