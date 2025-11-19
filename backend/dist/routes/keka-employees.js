"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KekaEmployeeController_1 = require("../controllers/KekaEmployeeController");
const router = (0, express_1.Router)();
router.get('/', KekaEmployeeController_1.KekaEmployeeController.getEmployees);
router.get('/departments', KekaEmployeeController_1.KekaEmployeeController.getDepartments);
router.get('/:id', KekaEmployeeController_1.KekaEmployeeController.getEmployeeById);
router.get('/:id/time-entries', KekaEmployeeController_1.KekaEmployeeController.getEmployeeTimeEntries);
exports.default = router;
//# sourceMappingURL=keka-employees.js.map