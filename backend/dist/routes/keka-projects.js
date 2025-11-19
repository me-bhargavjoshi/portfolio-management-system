"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KekaProjectController_1 = require("../controllers/KekaProjectController");
const router = (0, express_1.Router)();
router.get('/', KekaProjectController_1.KekaProjectController.getProjects);
router.get('/:id', KekaProjectController_1.KekaProjectController.getProjectById);
router.get('/:id/tasks', KekaProjectController_1.KekaProjectController.getProjectTasks);
router.get('/:id/time-entries', KekaProjectController_1.KekaProjectController.getProjectTimeEntries);
router.get('/:id/analytics', KekaProjectController_1.KekaProjectController.getProjectAnalytics);
exports.default = router;
//# sourceMappingURL=keka-projects.js.map