"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KekaDashboardController_1 = require("../controllers/KekaDashboardController");
const router = (0, express_1.Router)();
router.get('/dashboard-metrics', KekaDashboardController_1.KekaDashboardController.getDashboardMetrics);
router.get('/recent-timesheets', KekaDashboardController_1.KekaDashboardController.getRecentTimesheets);
router.get('/timesheets', KekaDashboardController_1.KekaDashboardController.getAllTimesheets);
router.get('/top-projects', KekaDashboardController_1.KekaDashboardController.getTopProjects);
router.get('/employee-utilization', KekaDashboardController_1.KekaDashboardController.getEmployeeUtilization);
router.get('/timesheet-analytics', KekaDashboardController_1.KekaDashboardController.getTimesheetAnalytics);
exports.default = router;
//# sourceMappingURL=keka-dashboard.js.map