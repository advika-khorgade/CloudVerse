/**
 * In-memory auth store — mirrors what Cognito/DynamoDB would do in production.
 * Passwords stored as plain text for demo; swap with bcrypt in prod.
 */

import { v4 as uuidv4 } from 'uuid';
import { User, AuthSession, UserRole } from './types';

let users: User[] = [
  // Seeded admin account
  {
    userId: 'admin-001',
    name: 'Admin',
    email: 'admin@organmatch.com',
    passwordHash: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

export function getUsers(): User[] {
  return users;
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(userId: string): User | undefined {
  return users.find(u => u.userId === userId);
}

export function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): User {
  if (findUserByEmail(data.email)) throw new Error('Email already registered');
  const user: User = {
    userId: uuidv4(),
    name: data.name,
    email: data.email,
    passwordHash: data.password, // plain for demo
    role: data.role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export function loginUser(email: string, password: string): AuthSession {
  const user = findUserByEmail(email);
  if (!user || user.passwordHash !== password) throw new Error('Invalid email or password');
  return toSession(user);
}

export function linkDonorToUser(userId: string, donorId: string): void {
  const idx = users.findIndex(u => u.userId === userId);
  if (idx !== -1) users[idx] = { ...users[idx], donorId };
}

export function linkRecipientToUser(userId: string, recipientId: string): void {
  const idx = users.findIndex(u => u.userId === userId);
  if (idx !== -1) users[idx] = { ...users[idx], recipientId };
}

export function toSession(user: User): AuthSession {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    donorId: user.donorId,
    recipientId: user.recipientId,
  };
}

export function deleteUser(userId: string): void {
  users = users.filter(u => u.userId !== userId);
}
