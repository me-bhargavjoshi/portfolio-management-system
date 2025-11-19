"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProjects = exports.getActiveProjects = exports.deleteProject = exports.updateProject = exports.getProjectsByCompanyId = exports.getAllProjects = exports.getProjectById = exports.createProject = void 0;
const project_1 = require("../services/project");
const database_1 = require("../config/database");
const createProject = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
        const { company_id, account_id, name, description, start_date, end_date, budget, status, project_manager_id } = req.body;
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
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating project',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createProject = createProject;
const getProjectById = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
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
    }
    catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting project',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getProjectById = getProjectById;
const getAllProjects = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const result = await projectService.getAllProjects(limit, offset);
        res.status(200).json({
            success: true,
            data: result.projects,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting projects',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAllProjects = getAllProjects;
const getProjectsByCompanyId = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
        const { company_id } = req.query;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        if (!company_id) {
            res.status(400).json({
                success: false,
                message: 'company_id query parameter is required',
            });
            return;
        }
        const result = await projectService.getProjectsByCompanyId(company_id, limit, offset);
        res.status(200).json({
            success: true,
            data: result.projects,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error getting projects by company:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting projects',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getProjectsByCompanyId = getProjectsByCompanyId;
const updateProject = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
        const { id } = req.params;
        const updateData = req.body;
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
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating project',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
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
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.deleteProject = deleteProject;
const getActiveProjects = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
        const limit = parseInt(req.query.limit) || 50;
        const projects = await projectService.getActiveProjects(limit);
        res.status(200).json({
            success: true,
            data: projects,
        });
    }
    catch (error) {
        console.error('Error getting active projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting active projects',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getActiveProjects = getActiveProjects;
const searchProjects = async (req, res) => {
    try {
        const projectService = new project_1.ProjectService((0, database_1.getDatabase)());
        const { q } = req.query;
        const limit = parseInt(req.query.limit) || 50;
        if (!q) {
            res.status(400).json({
                success: false,
                message: 'Search query (q) is required',
            });
            return;
        }
        const projects = await projectService.searchProjects(q, limit);
        res.status(200).json({
            success: true,
            data: projects,
        });
    }
    catch (error) {
        console.error('Error searching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching projects',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.searchProjects = searchProjects;
//# sourceMappingURL=project.js.map