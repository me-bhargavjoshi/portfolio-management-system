import { Request, Response } from 'express';
import { AccountService } from '../services/account';
import { getDatabase } from '../config/database';

/**
 * Create a new account
 * POST /api/accounts
 */
export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountService = new AccountService(getDatabase());
    const { company_id, client_id, name, description, account_manager_id } = req.body;

    // Validation
    if (!company_id || !client_id || !name) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: company_id, client_id, name',
      });
      return;
    }

    const account = await accountService.createAccount({
      company_id,
      client_id,
      name,
      description,
      account_manager_id,
    });

    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get account by ID
 * GET /api/accounts/:id
 */
export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountService = new AccountService(getDatabase());
    const { id } = req.params;

    const account = await accountService.getAccountById(id);

    if (!account) {
      res.status(404).json({
        success: false,
        message: 'Account not found',
      });
      return;
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching account',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all accounts
 * GET /api/accounts
 */
export const getAllAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountService = new AccountService(getDatabase());
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await accountService.getAllAccounts(limit, offset);

    res.json({
      success: true,
      data: result.accounts,
      total: result.total,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching accounts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update account
 * PUT /api/accounts/:id
 */
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountService = new AccountService(getDatabase());
    const { id } = req.params;
    const { name, description, account_manager_id, is_active } = req.body;

    const account = await accountService.updateAccount(id, {
      name,
      description,
      account_manager_id,
      is_active,
    });

    if (!account) {
      res.status(404).json({
        success: false,
        message: 'Account not found',
      });
      return;
    }

    res.json({
      success: true,
      data: account,
      message: 'Account updated successfully',
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating account',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete account
 * DELETE /api/accounts/:id
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountService = new AccountService(getDatabase());
    const { id } = req.params;

    const success = await accountService.deleteAccount(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Account not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
