import { Router } from 'express';
import { Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'portfolio_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'portfolio_management',
  password: process.env.DB_PASSWORD || 'portfolio_pass',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Types for Resource Planning
interface Resource {
  id: number;
  name: string;
  role: string;
  capacity: number;
  email: string;
  avatar: string;
}

// Database storage is now used instead of in-memory storage

// Sample data for bookings and capacity calculations
const sampleResources: Resource[] = [
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

// Helper functions
function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Not Sunday or Saturday
}

function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
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

function calculateDailyHours(allocationMethod: string, allocationValue: number, workingDays: number): number {
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



// Routes

// Get all resources
router.get('/resources', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: sampleResources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources'
    });
  }
});

// Get all projects
router.get('/projects', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: sampleProjects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// Get all bookings from database
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { resourceId, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM resource_bookings WHERE 1=1';
    const params: any[] = [];
    let paramCounter = 1;
    
    if (resourceId) {
      query += ` AND resource_id = $${paramCounter}`;
      params.push(parseInt(resourceId as string));
      paramCounter++;
    }
    
    if (startDate && endDate) {
      query += ` AND end_date >= $${paramCounter} AND start_date <= $${paramCounter + 1}`;
      params.push(startDate, endDate);
      paramCounter += 2;
    }
    
    query += ' ORDER BY start_date, resource_id';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Create new booking
router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const {
      resourceId,
      projectId,
      startDate,
      endDate,
      allocationMethod,
      allocationValue,
      type = 'hard'
    } = req.body;

    // Validation
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

    // Skip resource/project validation - they come from Keka and use different ID schemes
    // The database will enforce foreign key constraints if needed
    
    // Calculate daily hours based on allocation method
    const workingDays = getWorkingDaysBetween(start, end);
    const dailyHours = calculateDailyHours(allocationMethod, allocationValue, workingDays);

    if (dailyHours <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Daily hours must be greater than 0'
      });
    }

    // Note: Capacity checking is handled on the frontend
    // Backend trusts the frontend validation for overbooking checks

    // Create booking in database
    const insertQuery = `
      INSERT INTO resource_bookings 
      (resource_id, project_id, start_date, end_date, daily_hours, allocation_method, allocation_value, booking_type, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const description = `${type} booking - ${allocationValue} ${allocationMethod === 'hours' ? 'hours/day' : allocationMethod === 'percentage' ? '%' : 'total hours'}`;
    
    const result = await pool.query(insertQuery, [
      resourceId,
      projectId,
      startDate,
      endDate,
      dailyHours,
      allocationMethod,
      allocationValue,
      type,
      description
    ]);

    const booking = result.rows[0];

    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

// Update booking
router.put('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    // Check if booking exists
    const checkQuery = 'SELECT * FROM resource_bookings WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [bookingId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const existingBooking = checkResult.rows[0];
    const {
      resourceId = existingBooking.resource_id,
      projectId = existingBooking.project_id,
      startDate = existingBooking.start_date,
      endDate = existingBooking.end_date,
      allocationMethod = existingBooking.allocation_method,
      allocationValue = existingBooking.allocation_value,
      type = existingBooking.booking_type
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Calculate daily hours
    const workingDays = getWorkingDaysBetween(start, end);
    const dailyHours = calculateDailyHours(allocationMethod, allocationValue, workingDays);

    // Update booking in database
    const updateQuery = `
      UPDATE resource_bookings 
      SET resource_id = $1, project_id = $2, start_date = $3, end_date = $4, 
          daily_hours = $5, allocation_method = $6, allocation_value = $7, 
          booking_type = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      resourceId,
      projectId,
      startDate,
      endDate,
      dailyHours,
      allocationMethod,
      allocationValue,
      type,
      bookingId
    ]);

    const updatedBooking = result.rows[0];

    return res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking'
    });
  }
});

// Delete booking
router.delete('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    // Delete booking from database
    const deleteQuery = 'DELETE FROM resource_bookings WHERE id = $1 RETURNING *';
    const result = await pool.query(deleteQuery, [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const deletedBooking = result.rows[0];

    return res.json({
      success: true,
      data: deletedBooking,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete booking'
    });
  }
});

// Check resource capacity for a specific period (simplified)
router.post('/capacity-check', (req: Request, res: Response) => {
  try {
    const { resourceId, startDate, endDate, dailyHours } = req.body;

    if (!resourceId || !startDate || !endDate || !dailyHours) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: resourceId, startDate, endDate, dailyHours'
      });
    }

    // Simplified capacity check - just check if daily hours exceed 8
    const isOverbooked = dailyHours > 8;

    return res.json({
      success: true,
      data: {
        isOverbooked,
        message: isOverbooked ? 'Daily hours exceed capacity' : 'Capacity check passed'
      }
    });

  } catch (error) {
    console.error('Error checking capacity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check capacity'
    });
  }
});

// Get resource utilization report (temporarily disabled - needs database integration)
/*
// TODO: Update utilization endpoints to use database queries instead of in-memory bookings array
/*
router.get('/utilization/:resourceId', (req: Request, res: Response) => {
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
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredBookings = filteredBookings.filter(b => 
        new Date(b.endDate) >= start && new Date(b.startDate) <= end
      );
    }

    // Calculate utilization statistics
    const totalBookings = filteredBookings.length;
    const hardBookings = filteredBookings.filter(b => b.type === 'hard').length;
    const softBookings = filteredBookings.filter(b => b.type === 'soft').length;
    
    // Calculate total booked hours
    let totalBookedHours = 0;
    filteredBookings.forEach(booking => {
      const workingDays = getWorkingDaysBetween(new Date(booking.startDate), new Date(booking.endDate));
      totalBookedHours += booking.dailyHours * workingDays;
    });

    // Calculate available capacity for the period
    const period = startDate && endDate ? 
      getWorkingDaysBetween(new Date(startDate as string), new Date(endDate as string)) :
      30; // Default to 30 working days
    
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

  } catch (error) {
    console.error('Error getting utilization report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get utilization report'
    });
  }
});
*/

// Get all resource utilizations (summary)
/*
router.get('/utilization', (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const utilizationSummary = sampleResources.map(resource => {
      let resourceBookings = bookings.filter(b => b.resourceId === resource.id);

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        resourceBookings = resourceBookings.filter(b => 
          new Date(b.endDate) >= start && new Date(b.startDate) <= end
        );
      }

      // Calculate total booked hours
      let totalBookedHours = 0;
      resourceBookings.forEach(booking => {
        const workingDays = getWorkingDaysBetween(new Date(booking.startDate), new Date(booking.endDate));
        totalBookedHours += booking.dailyHours * workingDays;
      });

      // Calculate capacity for the period
      const period = startDate && endDate ? 
        getWorkingDaysBetween(new Date(startDate as string), new Date(endDate as string)) :
        30; // Default to 30 working days
      
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

  } catch (error) {
    console.error('Error getting utilization summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get utilization summary'
    });
  }
});
*/

export default router;