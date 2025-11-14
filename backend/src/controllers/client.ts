import { Request, Response } from 'express';
import { ClientService } from '../services/client';
import { getDatabase } from '../config/database';

/**
 * Create a new client
 * POST /api/clients
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const { company_id, name, email, phone, address, city, state, country, postal_code, is_active } = req.body;

    // Validation
    if (!company_id || !name) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: company_id, name',
      });
      return;
    }

    const client = await clientService.createClient({
      company_id,
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      is_active,
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating client',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get client by ID
 * GET /api/clients/:id
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const { id } = req.params;

    const client = await clientService.getClientById(id);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error('Error getting client:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting client',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all clients
 * GET /api/clients
 */
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await clientService.getAllClients(limit, offset);

    res.status(200).json({
      success: true,
      data: result.clients,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting clients',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get clients by company ID
 * GET /api/clients?company_id=:companyId
 */
export const getClientsByCompanyId = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const { company_id } = req.query;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!company_id) {
      res.status(400).json({
        success: false,
        message: 'company_id query parameter is required',
      });
      return;
    }

    const result = await clientService.getClientsByCompanyId(company_id as string, limit, offset);

    res.status(200).json({
      success: true,
      data: result.clients,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting clients by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting clients',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update client
 * PUT /api/clients/:id
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const { id } = req.params;
    const updateData = req.body;

    const client = await clientService.updateClient(id, updateData);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete client
 * DELETE /api/clients/:id
 */
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const { id } = req.params;

    const success = await clientService.deleteClient(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting client',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Search clients
 * GET /api/clients/search?q=:query
 */
export const searchClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientService = new ClientService(getDatabase());
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query (q) is required',
      });
      return;
    }

    const clients = await clientService.searchClients(q as string, limit);

    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching clients',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
