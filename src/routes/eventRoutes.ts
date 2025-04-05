import express, { Request, Response, NextFunction } from 'express';
import Event from '../models/Event';

const router = express.Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all events
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.find({ status: 'upcoming' }).sort({ dateTime: 1 });
  res.json(events);
}));

// Get single event
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json(event);
}));

// Create new event
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const newEvent = new Event(req.body);
  const savedEvent = await newEvent.save();
  res.status(201).json(savedEvent);
}));

// Update event
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!updatedEvent) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json(updatedEvent);
}));

// Delete event
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const deletedEvent = await Event.findByIdAndDelete(req.params.id);
  if (!deletedEvent) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json({ message: 'Event deleted successfully' });
}));

// Register participant for event
router.post('/:id/register', asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  if (event.currentEnrollment >= event.maxCapacity) {
    return res.status(400).json({ message: 'Event is full' });
  }

  const newParticipant = {
    parentName: req.body.parentName,
    parentEmail: req.body.parentEmail,
    parentPhone: req.body.parentPhone,
    childName: req.body.childName,
    childAge: req.body.childAge,
    notes: req.body.notes,
    registeredAt: new Date()
  };

  event.participants.push(newParticipant);
  event.currentEnrollment = event.participants.length;
  
  const updatedEvent = await event.save();
  res.json(updatedEvent);
}));

// Cancel registration
router.delete('/:id/register/:participantEmail', asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const participantIndex = event.participants.findIndex(
    p => p.parentEmail === req.params.participantEmail
  );

  if (participantIndex === -1) {
    return res.status(404).json({ message: 'Registration not found' });
  }

  event.participants.splice(participantIndex, 1);
  event.currentEnrollment = event.participants.length;
  
  const updatedEvent = await event.save();
  res.json(updatedEvent);
}));

// Search events
router.get('/search/filter', asyncHandler(async (req: Request, res: Response) => {
  const {
    subject,
    city,
    state,
    minAge,
    maxAge,
    startDate,
    endDate
  } = req.query;

  const query: any = { status: 'upcoming' };

  if (subject) query.subject = new RegExp(subject as string, 'i');
  if (city) query['location.city'] = new RegExp(city as string, 'i');
  if (state) query['location.state'] = new RegExp(state as string, 'i');
  
  if (minAge) query['suggestedAgeRange.max'] = { $gte: Number(minAge) };
  if (maxAge) query['suggestedAgeRange.min'] = { $lte: Number(maxAge) };
  
  if (startDate || endDate) {
    query.dateTime = {};
    if (startDate) query.dateTime.$gte = new Date(startDate as string);
    if (endDate) query.dateTime.$lte = new Date(endDate as string);
  }

  const events = await Event.find(query).sort({ dateTime: 1 });
  res.json(events);
}));

export default router; 