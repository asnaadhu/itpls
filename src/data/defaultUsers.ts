import { User } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    email: 'admin@company.com',
    name: 'Alex Mercer',
    role: 'admin',
    department: 'Information & Telecommunication Systems',
    createdAt: '2026-01-01',
    password: 'admin123',
  },
  {
    id: 'user-mgr-2',
    username: 'manager',
    email: 'sarah.j@company.com',
    name: 'Sarah Jenkins',
    role: 'manager',
    department: 'Finance & Planning',
    createdAt: '2026-02-15',
    password: 'manager123',
  },
  {
    id: 'user-view-3',
    username: 'viewer',
    email: 'd.chen@company.com',
    name: 'David Chen',
    role: 'viewer',
    department: 'Executive Office',
    createdAt: '2026-03-10',
    password: 'viewer123',
  },
];
