import { 
  User, 
  Company as CompanyModel, 
  LinkedInPost as LinkedInPostModel, 
  TwitterPost as TwitterPostModel, 
  NotificationLog as NotificationLogModel, 
  Setting as SettingModel, 
  ActivityLog as ActivityLogModel, 
  Application as ApplicationModel, 
  ResumeVault as ResumeVaultModel 
} from "./models.js";
import { logger } from "../lib/logger.js";

// Helper to convert Mongoose documents to plain objects and map _id to id (string)
function mapDoc<T>(doc: any): T | null {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id ? obj._id.toString() : obj.id;
  if (obj.userId) {
    obj.userId = obj.userId.toString();
  }
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

function mapDocs<T>(docs: any[]): T[] {
  return docs.map(d => mapDoc<T>(d)).filter(Boolean) as T[];
}

export interface Company {
  id: string;
  userId: string;
  company_name: string;
  role: string;
  hr_email: string;
  linkedin_url: string | null;
  website_url: string | null;
  target_person_name: string | null;
  target_person_role: string | null;
  key_skills: string | null;
  experience_level: string | null;
  sender_name: string | null;
  sender_location: string | null;
  status: string;
  scraped_context: string | null;
  generated_subject: string | null;
  generated_mail: string | null;
  personalization_hook: string | null;
  followup_sent_at: Date | null;
  followup_status: string | null;
  sent_at: Date | null;
  reply_detected_at: Date | null;
  error_message: string | null;
  generated_variants_json: string | null;
  createdAt: Date;
}

export interface LinkedInPost {
  id: string;
  userId: string;
  content: string;
  news_sources: string;
  status: string;
  posted_at: Date | null;
  linkedin_post_url: string | null;
  createdAt: Date;
}

export interface TwitterPost {
  id: string;
  userId: string;
  content: string;
  type: 'single' | 'thread';
  status: string;
  posted_at: Date | null;
  twitter_post_id: string | null;
  impressions: number;
  likes: number;
  replies: number;
  error_message: string | null;
  createdAt: Date;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  jd_url: string | null;
  stage: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  resume_version_used: string | null;
  notes: string | null;
  email_history: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeVaultItem {
  id: string;
  userId: string;
  filename: string;
  label: string;
  content: string | null;
  is_default: number;
  cloudinaryUrl?: string;
  createdAt: Date;
}

export const companyQueries = {
  getAll: async (userId: string): Promise<Company[]> => {
    const docs = await CompanyModel.find({ userId }).sort({ createdAt: -1 });
    return mapDocs<Company>(docs);
  },

  getById: async (id: string, userId?: string): Promise<Company | null> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await CompanyModel.findOne(query);
    return mapDoc<Company>(doc);
  },

  getByStatus: async (status: string, userId?: string): Promise<Company[]> => {
    const query = userId ? { status, userId } : { status };
    const docs = await CompanyModel.find(query);
    return mapDocs<Company>(docs);
  },

  getDueForFollowUp: async (days: number, userId?: string): Promise<Company[]> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const query: any = {
      status: 'mail_sent',
      followup_status: null,
      sent_at: { $lte: cutoffDate }
    };
    if (userId) query.userId = userId;

    const docs = await CompanyModel.find(query);
    return mapDocs<Company>(docs);
  },

  insert: async (userId: string, company: Omit<Company, "id" | "userId" | "createdAt">): Promise<Company> => {
    const doc = new CompanyModel({
      userId,
      ...company
    });
    await doc.save();
    return mapDoc<Company>(doc)!;
  },

  update: async (id: string, company: Partial<Company>, userId?: string): Promise<Company | null> => {
    const updateData = { ...company };
    delete (updateData as any).id;
    delete (updateData as any).userId;
    
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await CompanyModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );
    return mapDoc<Company>(doc);
  },

  updateStatus: async (id: string, status: string, extra?: Partial<Company>, userId?: string): Promise<Company | null> => {
    const updateData: any = { status };
    if (extra) {
      Object.keys(extra).forEach((key) => {
        if (key !== "status" && key !== "id" && key !== "userId") {
          updateData[key] = (extra as any)[key];
        }
      });
    }
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await CompanyModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );
    return mapDoc<Company>(doc);
  },

  delete: async (id: string, userId?: string): Promise<any> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    return await CompanyModel.deleteOne(query);
  },

  countMailSent: async (userId: string): Promise<number> => {
    return await CompanyModel.countDocuments({ userId, sent_at: { $ne: null } });
  },

  countMailsSentToday: async (userId: string): Promise<number> => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return await CompanyModel.countDocuments({
      userId,
      sent_at: { $gte: startOfToday }
    });
  },

  countReplies: async (userId: string): Promise<number> => {
    return await CompanyModel.countDocuments({ userId, status: 'replied' });
  },

  countMailsSentThisWeek: async (userId: string): Promise<number> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return await CompanyModel.countDocuments({
      userId,
      sent_at: { $gte: sevenDaysAgo }
    });
  },

  countRepliesThisWeek: async (userId: string): Promise<number> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return await CompanyModel.countDocuments({
      userId,
      status: 'replied',
      reply_detected_at: { $gte: sevenDaysAgo }
    });
  },
};

export const postQueries = {
  getAll: async (userId: string): Promise<LinkedInPost[]> => {
    const docs = await LinkedInPostModel.find({ userId }).sort({ createdAt: -1 });
    return mapDocs<LinkedInPost>(docs);
  },

  getById: async (id: string, userId?: string): Promise<LinkedInPost | null> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await LinkedInPostModel.findOne(query);
    return mapDoc<LinkedInPost>(doc);
  },

  insert: async (userId: string, post: any): Promise<LinkedInPost> => {
    const doc = new LinkedInPostModel({
      userId,
      ...post
    });
    await doc.save();
    return mapDoc<LinkedInPost>(doc)!;
  },

  update: async (id: string, post: Partial<any>, userId?: string): Promise<LinkedInPost | null> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await LinkedInPostModel.findOneAndUpdate(
      query,
      { $set: post },
      { new: true }
    );
    return mapDoc<LinkedInPost>(doc);
  },

  updateStatus: async (id: string, status: string, extra?: any, userId?: string): Promise<LinkedInPost | null> => {
    const updateData: any = { status };
    if (extra?.posted_at) updateData.posted_at = extra.posted_at;
    if (extra?.linkedin_post_url) updateData.linkedin_post_url = extra.linkedin_post_url;
    
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await LinkedInPostModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );
    return mapDoc<LinkedInPost>(doc);
  },

  countPosted: async (userId: string): Promise<number> => {
    return await LinkedInPostModel.countDocuments({ userId, status: 'posted' });
  },

  delete: async (id: string, userId?: string): Promise<any> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    return await LinkedInPostModel.deleteOne(query);
  },
};

export const twitterQueries = {
  getAll: async (userId: string, limit = 50): Promise<TwitterPost[]> => {
    const docs = await TwitterPostModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    return mapDocs<TwitterPost>(docs);
  },

  getById: async (id: string, userId?: string): Promise<TwitterPost | null> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await TwitterPostModel.findOne(query);
    return mapDoc<TwitterPost>(doc);
  },

  insert: async (userId: string, tweet: any): Promise<TwitterPost> => {
    const doc = new TwitterPostModel({
      userId,
      ...tweet
    });
    await doc.save();
    return mapDoc<TwitterPost>(doc)!;
  },

  update: async (id: string, tweet: Partial<any>, userId?: string): Promise<TwitterPost | null> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await TwitterPostModel.findOneAndUpdate(
      query,
      { $set: tweet },
      { new: true }
    );
    return mapDoc<TwitterPost>(doc);
  },

  countPosted: async (userId: string): Promise<number> => {
    return await TwitterPostModel.countDocuments({ userId, status: 'posted' });
  },

  delete: async (id: string, userId?: string): Promise<any> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    return await TwitterPostModel.deleteOne(query);
  },
};

export const settingsQueries = {
  get: async (userId: string, key: string): Promise<string | undefined> => {
    const doc = await SettingModel.findOne({ userId, key });
    return doc?.value ?? undefined;
  },

  set: async (userId: string, key: string, value: string): Promise<any> => {
    return await SettingModel.findOneAndUpdate(
      { userId, key },
      { $set: { value } },
      { upsert: true, new: true }
    );
  },
};

export const notificationsQueries = {
  insert: async (userId: string, type: string, message: string, whatsappStatus: string): Promise<any> => {
    const doc = new NotificationLogModel({
      userId,
      type,
      message,
      whatsapp_status: whatsappStatus
    });
    await doc.save();
    return mapDoc(doc);
  },

  getRecent: async (userId: string, limit: number): Promise<any[]> => {
    const docs = await NotificationLogModel.find({ userId }).sort({ sent_at: -1 }).limit(limit);
    return mapDocs(docs);
  },
};

export const activityQueries = {
  add: async (userId: string, type: string, message: string, meta?: any): Promise<any> => {
    const doc = new ActivityLogModel({
      userId,
      type,
      message,
      meta: meta ? JSON.stringify(meta) : null
    });
    await doc.save();
    return mapDoc(doc);
  },

  getRecent: async (userId: string, limit: number): Promise<any[]> => {
    const docs = await ActivityLogModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    return mapDocs(docs);
  },
};

export const applicationQueries = {
  getAll: async (userId: string): Promise<Application[]> => {
    const docs = await ApplicationModel.find({ userId }).sort({ createdAt: -1 });
    return mapDocs<Application>(docs);
  },

  getById: async (id: string, userId?: string): Promise<Application | undefined> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await ApplicationModel.findOne(query);
    return mapDoc<Application>(doc) || undefined;
  },

  insert: async (userId: string, app: Omit<Application, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Application> => {
    const doc = new ApplicationModel({
      userId,
      ...app
    });
    await doc.save();
    return mapDoc<Application>(doc)!;
  },

  update: async (id: string, app: Partial<Omit<Application, "id" | "userId" | "createdAt">>, userId?: string): Promise<Application | null> => {
    const updateData = { ...app, updatedAt: new Date() };
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await ApplicationModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );
    return mapDoc<Application>(doc);
  },

  delete: async (id: string, userId?: string): Promise<any> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    return await ApplicationModel.deleteOne(query);
  },

  countByStage: async (userId: string, stage: string): Promise<number> => {
    return await ApplicationModel.countDocuments({ userId, stage: stage as any });
  }
};

export const resumeVaultQueries = {
  getAll: async (userId: string): Promise<ResumeVaultItem[]> => {
    const docs = await ResumeVaultModel.find({ userId }).sort({ createdAt: -1 });
    return mapDocs<ResumeVaultItem>(docs);
  },

  getById: async (id: string, userId?: string): Promise<ResumeVaultItem | undefined> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await ResumeVaultModel.findOne(query);
    return mapDoc<ResumeVaultItem>(doc) || undefined;
  },

  insert: async (userId: string, item: Omit<ResumeVaultItem, "id" | "userId" | "createdAt">): Promise<ResumeVaultItem> => {
    const doc = new ResumeVaultModel({
      userId,
      ...item
    });
    await doc.save();
    return mapDoc<ResumeVaultItem>(doc)!;
  },

  setDefault: async (id: string, userId?: string): Promise<any> => {
    const query = userId ? { userId } : {};
    await ResumeVaultModel.updateMany(query, { $set: { is_default: 0 } });
    const findQuery = userId ? { _id: id, userId } : { _id: id };
    return await ResumeVaultModel.findOneAndUpdate(
      findQuery,
      { $set: { is_default: 1 } },
      { new: true }
    );
  },

  update: async (id: string, userId: string, updateData: Partial<ResumeVaultItem>): Promise<ResumeVaultItem | undefined> => {
    const doc = await ResumeVaultModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true }
    );
    return mapDoc<ResumeVaultItem>(doc) || undefined;
  },

  delete: async (id: string, userId?: string): Promise<any> => {
    const query = userId ? { _id: id, userId } : { _id: id };
    return await ResumeVaultModel.deleteOne(query);
  }
};
