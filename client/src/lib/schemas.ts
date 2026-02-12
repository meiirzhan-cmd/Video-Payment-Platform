import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priceCents: z.number().min(0, 'Price must be 0 or more'),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  priceCents: z.number().min(0).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateVideoFormData = z.infer<typeof createVideoSchema>;
export type UpdateVideoFormData = z.infer<typeof updateVideoSchema>;
