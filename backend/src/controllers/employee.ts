import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee';
import { getDatabase } from '../config/database';

/**
 * Create a new employee
 * POST /api/employees
 */
export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const { company_id, first_name, last_name, email, keka_employee_id, department, designation, reporting_manager_id, billable_rate, cost_per_hour, is_active } = req.body;

    // Validation
    if (!company_id || !first_name || !last_name || !email) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: company_id, first_name, last_name, email',
      });
      return;
    }

    const employee = await employeeService.createEmployee({
      company_id,
      first_name,
      last_name,
      email,
      keka_employee_id,
      department,
      designation,
      reporting_manager_id,
      billable_rate: billable_rate ? parseFloat(billable_rate) : undefined,
      cost_per_hour: cost_per_hour ? parseFloat(cost_per_hour) : undefined,
      is_active,
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get employee by ID
 * GET /api/employees/:id
 */
export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const { id } = req.params;

    const employee = await employeeService.getEmployeeById(id);

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting employee',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all employees
 * GET /api/employees
 */
export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await employeeService.getAllEmployees(limit, offset);

    res.status(200).json({
      success: true,
      data: result.employees,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting employees',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get employees by company ID
 * GET /api/employees?company_id=:companyId
 */
export const getEmployeesByCompanyId = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
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

    const result = await employeeService.getEmployeesByCompanyId(company_id as string, limit, offset);

    res.status(200).json({
      success: true,
      data: result.employees,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting employees by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting employees',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get active employees count
 * GET /api/employees/count/active
 */
export const getActiveEmployeesCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const { company_id } = req.query;

    const count = await employeeService.getActiveEmployeesCount(company_id as string);

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error('Error getting active employees count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting active employees count',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update employee
 * PUT /api/employees/:id
 */
export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const { id } = req.params;
    const updateData = req.body;

    // Convert dates if provided
    if (updateData.date_of_joining) {
      updateData.date_of_joining = new Date(updateData.date_of_joining);
    }
    if (updateData.date_of_exit) {
      updateData.date_of_exit = new Date(updateData.date_of_exit);
    }

    const employee = await employeeService.updateEmployee(id, updateData);

    if (!employee) {
      res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete employee
 * DELETE /api/employees/:id
 */
export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const { id } = req.params;

    const success = await employeeService.deleteEmployee(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Search employees
 * GET /api/employees/search?q=:query
 */
export const searchEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const employeeService = new EmployeeService(getDatabase());
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query (q) is required',
      });
      return;
    }

    const employees = await employeeService.searchEmployees(q as string, limit);

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching employees',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
