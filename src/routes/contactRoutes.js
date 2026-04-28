import { Router } from 'express';
import { submitContact, submitDevlysContact } from '../controllers/contactController.js';

const router = Router();

router.post('/', submitContact);
router.post('/devlys', submitDevlysContact);

export default router;
