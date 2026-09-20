import { Router } from 'express';
import * as purchaseOrderController from '../controllers/purchaseOrder.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPurchaseOrderSchema } from '../validators/purchaseOrder.validators';

export const purchaseOrderRouter = Router();

purchaseOrderRouter.use(requireAuth);
purchaseOrderRouter.post('/', validate(createPurchaseOrderSchema), purchaseOrderController.create);
purchaseOrderRouter.get('/', purchaseOrderController.list);
purchaseOrderRouter.get('/:id', purchaseOrderController.getById);
purchaseOrderRouter.post('/:id/order', purchaseOrderController.markAsOrdered);
purchaseOrderRouter.post('/:id/receive', purchaseOrderController.receive);
purchaseOrderRouter.post('/:id/cancel', purchaseOrderController.cancel);
