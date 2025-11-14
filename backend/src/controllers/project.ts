import { Request, Response } from 'express';
import { ProjectService } from '../services/project';
import { getDatabase } from '../config/database';

/**
 * Create a new project
 * POST /api/projects
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const { company_id, account_id, name, description, start_date, end_date, budget, status, project_manager_id } = req.body;

    // Validation
    if (!company_id || !account_id || !name || !start_date || !end_date) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: company_id, account_id, name, start_date, end_date',
      });
      return;
    }

    const project = await projectService.createProject({
      company_id,
      account_id,
      name,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      budget,
      status,
      project_manager_id,
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get project by ID
 * GET /api/projects/:id
 */
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const { id } = req.params;

    const project = await projectService.getProjectById(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all projects
 * GET /api/projects
 */
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await projectService.getAllProjects(limit, offset);

    res.status(200).json({
      success: true,
      data: result.projects,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting projects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get projects by company ID
 * GET /api/projects?company_id=:companyId
 */
export const getProjectsByCompanyId = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
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

    const result = await projectService.getProjectsByCompanyId(company_id as string, limit, offset);

    res.status(200).json({
      success: true,
      data: result.projects,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error getting projects by company:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting projects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update project
 * PUT /api/projects/:id
 */
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const { id } = req.params;
    const updateData = req.body;

    // Convert dates if provided
    if (updateData.start_date) {
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date) {
      updateData.end_date = new Date(updateData.end_date);
    }

    const project = await projectService.updateProject(id, updateData);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete project
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const { id } = req.params;

    const success = await projectService.deleteProject(id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get active projects
 * GET /api/projects/active
 */
export const getActiveProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const limit = parseInt(req.query.limit as string) || 50;

    const projects = await projectService.getActiveProjects(limit);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error getting active projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting active projects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Search projects
 * GET /api/projects/search?q=:query
 */
export const searchProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectService = new ProjectService(getDatabase());
    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query (q) is required',
      });
      return;
    }

    const projects = await projectService.searchProjects(q as string, limit);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching projects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
