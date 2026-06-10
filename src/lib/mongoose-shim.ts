import connectToDatabase from './db';
import { ObjectId } from 'mongodb';

function wrapDoc(doc: any, collectionName: string) {
  if (!doc) return doc;
  
  // Define non-enumerable save method
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    configurable: true,
    value: async function() {
      const db = await connectToDatabase();
      const col = db.collection(collectionName);
      
      const { _id, ...updateData } = this;
      const cleanUpdate = { ...updateData };
      cleanUpdate.updatedAt = new Date();
      
      let parsedId = _id;
      if (typeof _id === 'string') {
        try {
          parsedId = new ObjectId(_id);
        } catch (e) {}
      }
      
      return await col.updateOne({ _id: parsedId }, { $set: cleanUpdate });
    }
  });
  
  return doc;
}

export class ShimQuery {
  colPromise: Promise<any>;
  collectionName: string;
  query: any;
  _sort: any = null;
  _skip: number = 0;
  _limit: number = 0;
  _populate: string[] = [];

  constructor(colPromise: Promise<any>, collectionName: string, query: any) {
    this.colPromise = colPromise;
    this.collectionName = collectionName;
    this.query = query;
  }

  sort(s: any) {
    this._sort = s;
    return this;
  }

  skip(s: number) {
    this._skip = s;
    return this;
  }

  limit(l: number) {
    this._limit = l;
    return this;
  }

  populate(p: string) {
    this._populate.push(p);
    return this;
  }

  select(fields: any) {
    return this;
  }

  lean() {
    return this;
  }

  async then(onfulfilled?: (value: any[]) => any, onrejected?: (reason: any) => any) {
    try {
      const col = await this.colPromise;
      let cursor = col.find(this.query);
      if (this._sort) cursor = cursor.sort(this._sort);
      if (this._skip) cursor = cursor.skip(this._skip);
      if (this._limit) cursor = cursor.limit(this._limit);
      const results = await cursor.toArray();
      const wrappedResults = results.map((r: any) => wrapDoc(r, this.collectionName));
      if (onfulfilled) {
        return onfulfilled(wrappedResults);
      }
      return wrappedResults;
    } catch (err) {
      if (onrejected) {
        return onrejected(err);
      }
      throw err;
    }
  }
}

export class ShimQueryOne {
  colPromise: Promise<any>;
  collectionName: string;
  query: any;
  _populate: string[] = [];
  _sort: any = null;

  constructor(colPromise: Promise<any>, collectionName: string, query: any) {
    this.colPromise = colPromise;
    this.collectionName = collectionName;
    this.query = query;
  }

  sort(s: any) {
    this._sort = s;
    return this;
  }

  populate(p: string) {
    this._populate.push(p);
    return this;
  }

  select(fields: any) {
    return this;
  }

  lean() {
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const col = await this.colPromise;
      let doc;
      if (this._sort) {
        const results = await col.find(this.query).sort(this._sort).limit(1).toArray();
        doc = results[0] || null;
      } else {
        doc = await col.findOne(this.query);
      }
      const wrapped = wrapDoc(doc, this.collectionName);
      if (onfulfilled) {
        return onfulfilled(wrapped);
      }
      return wrapped;
    } catch (err) {
      if (onrejected) {
        return onrejected(err);
      }
      throw err;
    }
  }
}

export class MongooseShim {
  collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getCollection() {
    const db = await connectToDatabase();
    return db.collection(this.collectionName);
  }

  normalizeId(id: any): any {
    if (typeof id === 'string') {
      try {
        return new ObjectId(id);
      } catch (e) {
        return id;
      }
    }
    if (id && id.$in && Array.isArray(id.$in)) {
      return {
        $in: id.$in.map((item: any) => this.normalizeId(item))
      };
    }
    return id;
  }

  findOne(query: any = {}) {
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return new ShimQueryOne(this.getCollection(), this.collectionName, clonedQuery);
  }

  findById(id: any) {
    return this.findOne({ _id: id });
  }

  find(query: any = {}) {
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return new ShimQuery(this.getCollection(), this.collectionName, clonedQuery);
  }

  async create(doc: any) {
    const col = await this.getCollection();
    if (Array.isArray(doc)) {
      const docsWithDates = doc.map((d: any) => ({
        ...d,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      const result = await col.insertMany(docsWithDates);
      return docsWithDates.map((d: any, i: any) => wrapDoc({ ...d, _id: result.insertedIds[i] }, this.collectionName));
    } else {
      const docWithDates = {
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await col.insertOne(docWithDates);
      return wrapDoc({ ...docWithDates, _id: result.insertedId }, this.collectionName);
    }
  }

  async findOneAndUpdate(query: any, update: any, options: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    const returnDocument = options.new ? 'after' : 'before';
    const result = await col.findOneAndUpdate(clonedQuery, update, { ...options, returnDocument });
    return wrapDoc(result, this.collectionName);
  }

  async findByIdAndUpdate(id: any, update: any, options: any = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async findOneAndDelete(query: any, options: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    const result = await col.findOneAndDelete(clonedQuery, options);
    return wrapDoc(result, this.collectionName);
  }

  async updateOne(query: any, update: any, options: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return await col.updateOne(clonedQuery, update, options);
  }

  async updateMany(query: any, update: any, options: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return await col.updateMany(clonedQuery, update, options);
  }

  async deleteOne(query: any, options: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return await col.deleteOne(clonedQuery, options);
  }

  async deleteMany(query: any, options: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return await col.deleteMany(clonedQuery, options);
  }

  async countDocuments(query: any = {}) {
    const col = await this.getCollection();
    const clonedQuery = { ...query };
    if (clonedQuery._id) {
      clonedQuery._id = this.normalizeId(clonedQuery._id);
    }
    return await col.countDocuments(clonedQuery);
  }

  async aggregate(pipeline: any[]) {
    const col = await this.getCollection();
    const results = await col.aggregate(pipeline).toArray();
    return results.map((r: any) => wrapDoc(r, this.collectionName));
  }
}
