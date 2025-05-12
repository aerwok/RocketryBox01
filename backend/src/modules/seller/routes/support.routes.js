import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { createTicketSchema, addTicketResponseSchema } from '../validators/support.validator.js';
import { listTickets, createTicket, getTicketDetails, addTicketResponse } from '../controllers/support.controller.js';

const router = express.Router();

router.use(protect);

// List tickets
router.get('/support-tickets', listTickets);
// Create ticket
router.post('/support-tickets', validate(createTicketSchema), createTicket);
// Get ticket details
router.get('/support-tickets/:id', getTicketDetails);
// Add ticket response
router.post('/support-tickets/:id/responses', validate(addTicketResponseSchema), addTicketResponse);

export default router; 