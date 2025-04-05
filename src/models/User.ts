import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'parent' | 'teacher' | 'admin';
  
  // Teacher specific fields
  teachingProfile?: {
    bio: string;
    expertise: string[];
    certifications: string[];
    yearsOfExperience: number;
  };
  
  // Parent specific fields
  children?: Array<{
    name: string;
    age: number;
    specialNeeds?: string;
    interests?: string[];
  }>;
  
  // Common fields
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  preferences: {
    maxTravelDistance?: number;
    preferredSubjects?: string[];
    notificationPreferences: {
      email: boolean;
      sms: boolean;
    };
  };
  
  // Activity tracking
  hostedEvents: mongoose.Types.ObjectId[];
  registeredEvents: mongoose.Types.ObjectId[];
  waitlistedEvents: mongoose.Types.ObjectId[];
  
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['parent', 'teacher', 'admin'],
    required: true 
  },
  
  teachingProfile: {
    bio: String,
    expertise: [String],
    certifications: [String],
    yearsOfExperience: Number
  },
  
  children: [{
    name: { type: String },
    age: { type: Number },
    specialNeeds: String,
    interests: [String]
  }],
  
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  
  preferences: {
    maxTravelDistance: Number,
    preferredSubjects: [String],
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  hostedEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  registeredEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  waitlistedEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient querying
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'address.city': 1, 'address.state': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IUser>('User', userSchema); 