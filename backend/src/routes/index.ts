import express from 'express';
import { authMiddleware, errorHandler } from '../middleware/auth';
import { AuthController } from '../controllers/auth';
import * as ClientController from '../controllers/client';
import * as ProjectController from '../controllers/project';
import * as EmployeeController from '../controllers/employee';
import * as AccountController from '../controllers/account';
import kekaRoutes from '../controllers/keka-sync';

export const createRoutes = (app: express.Application): void => {
  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post('/api/auth/register', AuthController.register);
  app.post('/api/auth/login', AuthController.login);
  app.post('/api/auth/refresh', AuthController.refreshToken);
  app.post('/api/auth/logout', authMiddleware, AuthController.logout);
  app.get('/api/auth/me', authMiddleware, AuthController.getCurrentUser);

  // Client routes (CRUD)
  app.post('/api/clients', authMiddleware, ClientController.createClient);
  app.get('/api/clients', authMiddleware, ClientController.getAllClients);
  app.get('/api/clients/search', authMiddleware, ClientController.searchClients);
  app.get('/api/clients/:id', authMiddleware, ClientController.getClientById);
  app.put('/api/clients/:id', authMiddleware, ClientController.updateClient);
  app.delete('/api/clients/:id', authMiddleware, ClientController.deleteClient);

  // Account routes (CRUD)
  app.post('/api/accounts', authMiddleware, AccountController.createAccount);
  app.get('/api/accounts', authMiddleware, AccountController.getAllAccounts);
  app.get('/api/accounts/:id', authMiddleware, AccountController.getAccountById);
  app.put('/api/accounts/:id', authMiddleware, AccountController.updateAccount);
  app.delete('/api/accounts/:id', authMiddleware, AccountController.deleteAccount);

  // Project routes (CRUD)
  app.post('/api/projects', authMiddleware, ProjectController.createProject);
  app.get('/api/projects', authMiddleware, ProjectController.getAllProjects);
  app.get('/api/projects/active', authMiddleware, ProjectController.getActiveProjects);
  app.get('/api/projects/search', authMiddleware, ProjectController.searchProjects);
  app.get('/api/projects/:id', authMiddleware, ProjectController.getProjectById);
  app.put('/api/projects/:id', authMiddleware, ProjectController.updateProject);
  app.delete('/api/projects/:id', authMiddleware, ProjectController.deleteProject);

  // Employee routes (CRUD)
  app.post('/api/employees', authMiddleware, EmployeeController.createEmployee);
  app.get('/api/employees', authMiddleware, EmployeeController.getAllEmployees);
  app.get('/api/employees/count/active', authMiddleware, EmployeeController.getActiveEmployeesCount);
  app.get('/api/employees/search', authMiddleware, EmployeeController.searchEmployees);
  app.get('/api/employees/:id', authMiddleware, EmployeeController.getEmployeeById);
  app.put('/api/employees/:id', authMiddleware, EmployeeController.updateEmployee);
  app.delete('/api/employees/:id', authMiddleware, EmployeeController.deleteEmployee);

  // Keka Sync routes (CRUD and sync operations)
  app.use('/api/keka', kekaRoutes);

  // Protected routes
  app.get('/api/dashboard', authMiddleware, (_req, res) => {
    res.json({ message: 'Dashboard data - to be implemented' });
  });

  // Error handling middleware
  app.use(errorHandler);
};
