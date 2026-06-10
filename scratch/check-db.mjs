import { MongoClient } from 'mongodb';
import dns from 'dns';

// Override dns resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'mongodb+srv://cloudeflaretest:WBoeKSGobf8j4bQX@cluster0.e5n1hnl.mongodb.net/cloudeflaretest';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected successfully to database');
    const db = client.db();
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    console.log(collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'products')) {
      const count = await db.collection('products').countDocuments();
      console.log(`Number of products: ${count}`);
      
      const sample = await db.collection('products').find({}).limit(2).toArray();
      console.log('Sample products:', sample.map(p => p.name));
    } else {
      console.log('No products collection found.');
    }
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.close();
  }
}

run();
