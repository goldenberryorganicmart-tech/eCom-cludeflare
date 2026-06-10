import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  createdAt: Date;
}

const SubscriberSchema: Schema = new Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Ensure unique email
SubscriberSchema.index({ email: 1 }, { unique: true });

import { MongooseShim } from '@/lib/mongoose-shim';
const Subscriber: any = new MongooseShim('subscribers');
export default Subscriber;
