import { Hono } from 'hono';
import { TestDriveController } from '../controllers/test-drive.controller.js';

export const testDriveRouter = new Hono();

testDriveRouter.get('/', TestDriveController.listRuns);
testDriveRouter.post('/', TestDriveController.createRun);
testDriveRouter.get('/:id', TestDriveController.getRun);
testDriveRouter.post('/:id/execute', TestDriveController.executeRun);
testDriveRouter.post('/:id/events', TestDriveController.ingestEvents);
testDriveRouter.post('/:id/complete', TestDriveController.completeRun);
