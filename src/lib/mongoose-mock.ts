// Mock implementation of mongoose to bypass Edge runtime compatibility issues
export class Schema {
  static Types = {
    ObjectId: 'ObjectId',
    String: 'String',
    Number: 'Number',
    Boolean: 'Boolean',
    Date: 'Date'
  };
  
  constructor() {}
  
  index() {
    return this;
  }
  
  pre() {
    return this;
  }
}

export const Types = {
  ObjectId: class ObjectId {
    toString() {
      return 'mock-id';
    }
  }
};

const mongooseMock = {
  Schema,
  Types,
  model: () => ({}),
  models: {},
  connect: async () => ({}),
  connection: {}
};

export default mongooseMock;
export type Document = any;
export type Model<T> = any;
