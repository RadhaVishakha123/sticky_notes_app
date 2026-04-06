import { z } from 'zod';

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(100, 'Email must be at most 100 characters')
  .email('Please enter a valid email address')
  .refine(
    (val) => {
      const domain = val.split('@')[1];
      if (!domain) return false;
      if (domain.split('.').length > 3) return false;
      return true;
    },
    { message: 'Please enter a valid email domain' }
  );

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .refine((v) => v.trim().length >= 2, 'Name must be at least 2 characters')
      .refine((v) => v.trim().length <= 50, 'Name cannot exceed 50 characters')
      .refine(
        (v) => /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s'\-.]+$/.test(v.trim()),
        'Name cannot contain numbers, special characters, or emojis'
      ),
    email: emailField,
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});


export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title cannot exceed 50 characters'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => {
      const n = parseFloat(v);
      return !isNaN(n) && n > 0;
    }, 'Enter a valid amount greater than 0'),
});

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title cannot exceed 50 characters'),
  content: z.string().max(5000, 'Content cannot exceed 5000 characters').optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title cannot exceed 50 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
});

export const eventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(50, 'Title cannot exceed 50 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
