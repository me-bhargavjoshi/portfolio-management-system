"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
let bookings = [];
let bookingIdCounter = 1;
const sampleResources = [
    { id: 1, name: 'John Smith', role: 'Senior Developer', capacity: 8, email: 'john.smith@company.com', avatar: 'JS' },
    { id: 2, name: 'Sarah Jones', role: 'UI/UX Designer', capacity: 8, email: 'sarah.jones@company.com', avatar: 'SJ' },
    { id: 3, name: 'Mike Wilson', role: 'Project Manager', capacity: 8, email: 'mike.wilson@company.com', avatar: 'MW' },
    { id: 4, name: 'Lisa Brown', role: 'QA Engineer', capacity: 8, email: 'lisa.brown@company.com', avatar: 'LB' },
    { id: 5, name: 'David Garcia', role: 'DevOps Engineer', capacity: 8, email: 'david.garcia@company.com', avatar: 'DG' }
];
const sampleProjects = [
    { id: 1, name: 'Project Alpha', description: 'Web Development', client: 'Client A' },
    { id: 2, name: 'Project Beta', description: 'Mobile App', client: 'Client B' },
    { id: 3, name: 'Project Gamma', description: 'Data Analytics', client: 'Client C' },
    { id: 4, name: 'Project Delta', description: 'Infrastructure', client: 'Client D' }
];
function isWorkingDay(date) {
    const day = date.getDay();
    return day !== 0 && day !== 6;
}
function getWorkingDaysBetween(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (isWorkingDay(currentDate)) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
}
function calculateDailyHours(allocationMethod, allocationValue, workingDays) {
    switch (allocationMethod) {
        case 'hours':
            return allocationValue;
        case 'percentage':
            return (allocationValue / 100) * 8;
        case 'total':
            return allocationValue / workingDays;
        default:
            return 0;
    }
}
function checkResourceCapacity(resourceId, startDate, endDate, dailyHours) {
    const checks = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (isWorkingDay(currentDate)) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayBookings = bookings.filter(b => b.resourceId === resourceId &&
                new Date(b.startDate) <= currentDate &&
                new Date(b.endDate) >= currentDate);
            const totalHours = dayBookings.reduce((sum, b) => sum + b.dailyHours, 0) + dailyHours;
            const resource = sampleResources.find(r => r.id === resourceId);
            const capacity = resource ? resource.capacity : 8;
            checks.push({
                resourceId,
                date: dateStr,
                totalHours,
                bookings: dayBookings,
                isOverbooked: totalHours > capacity
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return checks;
}
router.get('/resources', (_req, res) => {
    try {
        res.json({
            success: true,
            data: sampleResources
        });
    }
    catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resources'
        });
    }
});
router.get('/projects', (_req, res) => {
    try {
        res.json({
            success: true,
            data: sampleProjects
        });
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects'
        });
    }
});
router.get('/bookings', (req, res) => {
    try {
        const { resourceId, startDate, endDate } = req.query;
        let filteredBookings = [...bookings];
        if (resourceId) {
            filteredBookings = filteredBookings.filter(b => b.resourceId === parseInt(resourceId));
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            filteredBookings = filteredBookings.filter(b => new Date(b.endDate) >= start && new Date(b.startDate) <= end);
        }
        res.json({
            success: true,
            data: filteredBookings
        });
    }
    catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
});
router.post('/bookings', (req, res) => {
    try {
        const { resourceId, projectId, startDate, endDate, allocationMethod, allocationValue, type = 'hard' } = req.body;
        if (!resourceId || !projectId || !startDate || !endDate || !allocationValue) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: resourceId, projectId, startDate, endDate, allocationValue'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        const resource = sampleResources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        const project = sampleProjects.find(p => p.id === projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        const workingDays = getWorkingDaysBetween(start, end);
        const dailyHours = calculateDailyHours(allocationMethod, allocationValue, workingDays);
        if (dailyHours <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Daily hours must be greater than 0'
            });
        }
        const capacityChecks = checkResourceCapacity(resourceId, start, end, dailyHours);
        const overbooked = capacityChecks.filter(c => c.isOverbooked);
        if (overbooked.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Booking would cause overbooking',
                data: {
                    overbooked: overbooked.map(c => ({
                        date: c.date,
                        totalHours: c.totalHours,
                        capacity: resource.capacity
                    }))
                }
            });
        }
        const booking = {
            id: bookingIdCounter++,
            resourceId,
            projectId,
            startDate,
            endDate,
            dailyHours,
            type,
            allocationMethod,
            allocationValue,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        bookings.push(booking);
        return res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully'
        });
    }
    catch (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create booking'
        });
    }
});
router.put('/bookings/:id', (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        const existingBooking = bookings[bookingIndex];
        const { resourceId = existingBooking.resourceId, projectId = existingBooking.projectId, startDate = existingBooking.startDate, endDate = existingBooking.endDate, allocationMethod = existingBooking.allocationMethod, allocationValue = existingBooking.allocationValue, type = existingBooking.type } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        const workingDays = getWorkingDaysBetween(start, end);
        const dailyHours = calculateDailyHours(allocationMethod, allocationValue, workingDays);
        const tempBookings = bookings.filter(b => b.id !== bookingId);
        const originalBookings = [...bookings];
        bookings = tempBookings;
        const capacityChecks = checkResourceCapacity(resourceId, start, end, dailyHours);
        const overbooked = capacityChecks.filter(c => c.isOverbooked);
        if (overbooked.length > 0) {
            bookings = originalBookings;
            const resource = sampleResources.find(r => r.id === resourceId);
            return res.status(409).json({
                success: false,
                message: 'Updated booking would cause overbooking',
                data: {
                    overbooked: overbooked.map(c => ({
                        date: c.date,
                        totalHours: c.totalHours,
                        capacity: resource?.capacity || 8
                    }))
                }
            });
        }
        const updatedBooking = {
            ...existingBooking,
            resourceId,
            projectId,
            startDate,
            endDate,
            dailyHours,
            type,
            allocationMethod,
            allocationValue,
            updatedAt: new Date()
        };
        bookings = [...tempBookings, updatedBooking];
        return res.json({
            success: true,
            data: updatedBooking,
            message: 'Booking updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update booking'
        });
    }
});
router.delete('/bookings/:id', (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        const deletedBooking = bookings.splice(bookingIndex, 1)[0];
        return res.json({
            success: true,
            data: deletedBooking,
            message: 'Booking deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting booking:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete booking'
        });
    }
});
router.post('/capacity-check', (req, res) => {
    try {
        const { resourceId, startDate, endDate, dailyHours } = req.body;
        if (!resourceId || !startDate || !endDate || !dailyHours) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: resourceId, startDate, endDate, dailyHours'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const checks = checkResourceCapacity(resourceId, start, end, dailyHours);
        return res.json({
            success: true,
            data: {
                checks,
                isOverbooked: checks.some(c => c.isOverbooked),
                overbooked: checks.filter(c => c.isOverbooked)
            }
        });
    }
    catch (error) {
        console.error('Error checking capacity:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check capacity'
        });
    }
});
router.get('/utilization/:resourceId', (req, res) => {
    try {
        const resourceId = parseInt(req.params.resourceId);
        const { startDate, endDate } = req.query;
        const resource = sampleResources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }
        let filteredBookings = bookings.filter(b => b.resourceId === resourceId);
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            filteredBookings = filteredBookings.filter(b => new Date(b.endDate) >= start && new Date(b.startDate) <= end);
        }
        const totalBookings = filteredBookings.length;
        const hardBookings = filteredBookings.filter(b => b.type === 'hard').length;
        const softBookings = filteredBookings.filter(b => b.type === 'soft').length;
        let totalBookedHours = 0;
        filteredBookings.forEach(booking => {
            const workingDays = getWorkingDaysBetween(new Date(booking.startDate), new Date(booking.endDate));
            totalBookedHours += booking.dailyHours * workingDays;
        });
        const period = startDate && endDate ?
            getWorkingDaysBetween(new Date(startDate), new Date(endDate)) :
            30;
        const totalCapacityHours = resource.capacity * period;
        const utilizationPercentage = totalCapacityHours > 0 ? (totalBookedHours / totalCapacityHours) * 100 : 0;
        return res.json({
            success: true,
            data: {
                resource: {
                    id: resource.id,
                    name: resource.name,
                    role: resource.role,
                    capacity: resource.capacity
                },
                period: {
                    startDate: startDate || 'All time',
                    endDate: endDate || 'All time',
                    workingDays: period
                },
                utilization: {
                    totalBookings,
                    hardBookings,
                    softBookings,
                    totalBookedHours,
                    totalCapacityHours,
                    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
                    availableHours: totalCapacityHours - totalBookedHours
                },
                bookings: filteredBookings
            }
        });
    }
    catch (error) {
        console.error('Error getting utilization report:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get utilization report'
        });
    }
});
router.get('/utilization', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const utilizationSummary = sampleResources.map(resource => {
            let resourceBookings = bookings.filter(b => b.resourceId === resource.id);
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                resourceBookings = resourceBookings.filter(b => new Date(b.endDate) >= start && new Date(b.startDate) <= end);
            }
            let totalBookedHours = 0;
            resourceBookings.forEach(booking => {
                const workingDays = getWorkingDaysBetween(new Date(booking.startDate), new Date(booking.endDate));
                totalBookedHours += booking.dailyHours * workingDays;
            });
            const period = startDate && endDate ?
                getWorkingDaysBetween(new Date(startDate), new Date(endDate)) :
                30;
            const totalCapacityHours = resource.capacity * period;
            const utilizationPercentage = totalCapacityHours > 0 ? (totalBookedHours / totalCapacityHours) * 100 : 0;
            return {
                resource: {
                    id: resource.id,
                    name: resource.name,
                    role: resource.role,
                    capacity: resource.capacity
                },
                utilization: {
                    totalBookings: resourceBookings.length,
                    totalBookedHours,
                    totalCapacityHours,
                    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
                    availableHours: totalCapacityHours - totalBookedHours
                }
            };
        });
        res.json({
            success: true,
            data: {
                period: {
                    startDate: startDate || 'All time',
                    endDate: endDate || 'All time'
                },
                resources: utilizationSummary
            }
        });
    }
    catch (error) {
        console.error('Error getting utilization summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get utilization summary'
        });
    }
});
exports.default = router;
//# sourceMappingURL=resource-planning.js.map