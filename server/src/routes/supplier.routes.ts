import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSupplierSchema } from '../validators/supplier.validators';

export const supplierRouter = Router();

supplierRouter.use(requireAuth);
supplierRouter.post('/', validate(createSupplierSchema), supplierController.create);
supplierRouter.get('/', supplierController.list);
supplierRouter.get('/:id', supplierController.getById);
