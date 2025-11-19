"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const KekaClientController_1 = require("../controllers/KekaClientController");
const router = (0, express_1.Router)();
router.get('/', KekaClientController_1.KekaClientController.getClients);
router.get('/:id', KekaClientController_1.KekaClientController.getClientById);
router.get('/:id/projects', KekaClientController_1.KekaClientController.getClientProjects);
router.get('/:id/analytics', KekaClientController_1.KekaClientController.getClientAnalytics);
exports.default = router;
//# sourceMappingURL=keka-clients.js.map