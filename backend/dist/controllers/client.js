"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchClients = exports.deleteClient = exports.updateClient = exports.getClientsByCompanyId = exports.getAllClients = exports.getClientById = exports.createClient = void 0;
const client_1 = require("../services/client");
const database_1 = require("../config/database");
const createClient = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
        const { company_id, name, email, phone, address, city, state, country, postal_code, is_active } = req.body;
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
    }
    catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating client',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createClient = createClient;
const getClientById = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
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
    }
    catch (error) {
        console.error('Error getting client:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting client',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getClientById = getClientById;
const getAllClients = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const result = await clientService.getAllClients(limit, offset);
        res.status(200).json({
            success: true,
            data: result.clients,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error getting clients:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting clients',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAllClients = getAllClients;
const getClientsByCompanyId = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
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
        const result = await clientService.getClientsByCompanyId(company_id, limit, offset);
        res.status(200).json({
            success: true,
            data: result.clients,
            total: result.total,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error getting clients by company:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting clients',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getClientsByCompanyId = getClientsByCompanyId;
const updateClient = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
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
    }
    catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating client',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updateClient = updateClient;
const deleteClient = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
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
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting client',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.deleteClient = deleteClient;
const searchClients = async (req, res) => {
    try {
        const clientService = new client_1.ClientService((0, database_1.getDatabase)());
        const { q } = req.query;
        const limit = parseInt(req.query.limit) || 50;
        if (!q) {
            res.status(400).json({
                success: false,
                message: 'Search query (q) is required',
            });
            return;
        }
        const clients = await clientService.searchClients(q, limit);
        res.status(200).json({
            success: true,
            data: clients,
        });
    }
    catch (error) {
        console.error('Error searching clients:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching clients',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.searchClients = searchClients;
//# sourceMappingURL=client.js.map