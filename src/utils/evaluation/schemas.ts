import { z } from 'zod';
import { RubricData, ChecklistData, AutoEvaluationBuilderData } from '../../types/evaluation';

export const rubricSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  criteria: z.array(
    z.object({
      name: z.string().min(1, "Nombre del criterio requerido"),
      weight: z.number().min(1).max(100, "Peso debe ser 1-100"),
      levels: z.array(
        z.object({
          description: z.string().min(1, "Descripción requerida"),
          score: z.number().positive("Puntaje debe ser positivo")
        })
      ).min(2, "Mínimo 2 niveles requeridos")
    })
  ).min(1, "Mínimo 1 criterio requerido")
}) satisfies z.ZodType<RubricData>;

export const checklistSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  items: z.array(
    z.object({
      description: z.string().min(1, "Descripción requerida"),
      required: z.boolean()
    })
  ).min(1, "Mínimo 1 ítem requerido")
}) satisfies z.ZodType<ChecklistData>;

export const autoEvaluationSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  dimensions: z.array(
    z.object({
      name: z.enum(['SER', 'DECIDIR']),
      criteria: z.array(
        z.object({
          description: z.string().min(1, "Descripción del criterio requerida"),
          levels: z.array(
            z.object({
              name: z.string().min(1, "Nombre del nivel requerido"),
              value: z.number().min(0, "Valor debe ser positivo"),
              selected: z.boolean()
            })
          ).min(1, "Mínimo 1 nivel requerido")
        })
      )
    })
  ).length(2, "Debe tener exactamente 2 dimensiones: SER y DECIDIR")
});