import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  hostName: string;
  hostEmail: string;
  hostWechatId: string;
  description: string;
  
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  dateTime: Date;
  duration: number; // in minutes
  
  // Class details
  maxCapacity: number;
  currentEnrollment: number;
  
  // Age specifications
  suggestedAgeRange: {
    min: number;
    max: number;
  };
  
  subject: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Materials
  materialsProvided: boolean;
  requiredMaterials: string[];
  additionalNotes: string;
  
  // Simple participant list
  participants: Array<{
    parentName: string;
    parentEmail: string;
    parentWechatId: string;
    childName: string;
    childAge: number;
    notes: string;
    registeredAt: Date;
  }>;
  
  status: 'upcoming' | 'cancelled';
  lastUpdated: Date;
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  hostName: { type: String, required: true },
  hostEmail: { type: String, required: true },
  hostWechatId: { type: String, required: true },
  description: { type: String, required: true },
  
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  
  dateTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  
  maxCapacity: { type: Number, required: true },
  currentEnrollment: { type: Number, default: 0 },
  
  suggestedAgeRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  
  subject: { type: String, required: true },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  materialsProvided: { type: Boolean, default: false },
  requiredMaterials: [{ type: String }],
  additionalNotes: { type: String },
  
  participants: [{
    parentName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    parentWechatId: { type: String, required: true },
    childName: { type: String, required: true },
    childAge: { type: Number, required: true },
    notes: String,
    registeredAt: { type: Date, default: Date.now }
  }],
  
  status: {
    type: String,
    enum: ['upcoming', 'cancelled'],
    default: 'upcoming'
  },
  
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for efficient querying
eventSchema.index({ dateTime: 1, status: 1 });
eventSchema.index({ 'location.city': 1, 'location.state': 1 });
eventSchema.index({ subject: 1 });
eventSchema.index({ 'suggestedAgeRange.min': 1, 'suggestedAgeRange.max': 1 });

// Update lastUpdated timestamp on every save
eventSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.model<IEvent>('Event', eventSchema); 