import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { adjustStockSchema, createProductSchema } from '../validators/product.validators';

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.post('/', validate(createProductSchema), productController.create);
productRouter.get('/', productController.list);
productRouter.get('/:id', productController.getById);
productRouter.patch('/:id/stock', validate(adjustStockSchema), productController.adjustStock);
