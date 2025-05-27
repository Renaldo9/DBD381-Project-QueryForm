const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// MongoDB Atlas connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Collections to manage
const collections = ['product_categories', 'users', 'addresses', 'products', 'orders', 'payments', 'reviews', 'cart'];

// Connect to MongoDB Atlas
let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db('e-commerce');
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
connectDB();

// Validate ObjectId format
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Home route
app.get('/', (req, res) => {
  res.render('index', { collections });
});

// Generic CRUD route for each collection
collections.forEach(collection => {
  // GET: Render form and list records
  app.get(`/${collection}`, async (req, res) => {
    try {
      const searchQuery = req.query.search || '';
      let query = {};
      if (searchQuery) {
        if (collection === 'product_categories') {
          query = { name: { $regex: searchQuery, $options: 'i' } };
        } else if (collection === 'users') {
          query = { $or: [
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ] };
        } else if (collection === 'addresses') {
          query = { $or: [
            { street: { $regex: searchQuery, $options: 'i' } },
            { city: { $regex: searchQuery, $options: 'i' } }
          ] };
        } else if (collection === 'products') {
          query = { name: { $regex: searchQuery, $options: 'i' } };
        }
      }

      const records = await db.collection(collection).find(query).toArray();
      res.render('collection', { collection, records, searchQuery, collections });
    } catch (err) {
      res.status(500).send(`Error fetching ${collection}: ${err.message}`);
    }
  });

  // POST: Handle CRUD actions
  app.post(`/${collection}`, async (req, res) => {
    try {
      const action = req.body.action;
      if (action === 'insert') {
        let newRecord = {};
        if (req.body.id && !isValidObjectId(req.body.id)) {
          throw new Error('Invalid _id format: Must be a 24-character hexadecimal string');
        }
        if (collection === 'product_categories') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description,
            createdAt: new Date(req.body.createdAt)
          };
        } else if (collection === 'users') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            passwordHash: req.body.passwordHash,
            defaultAddressId: req.body.defaultAddressId ? new ObjectId(req.body.defaultAddressId) : undefined,
            loyaltyPoints: Number(req.body.loyaltyPoints),
            createdAt: new Date(req.body.createdAt),
            role: req.body.role,
            isVerified: req.body.isVerified === 'on'
          };
        } else if (collection === 'addresses') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            userId: new ObjectId(req.body.userId),
            label: req.body.label,
            street: req.body.street,
            suburb: req.body.suburb,
            city: req.body.city,
            province: req.body.province,
            postalCode: req.body.postalCode,
            country: req.body.country,
            isPrimary: req.body.isPrimary === 'on',
            location: JSON.parse(req.body.location)
          };
        } else if (collection === 'products') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            name: req.body.name,
            description: req.body.description,
            priceZAR: Number(req.body.priceZAR),
            VAT: Number(req.body.VAT),
            categoryId: new ObjectId(req.body.categoryId),
            variants: JSON.parse(req.body.variants),
            images: JSON.parse(req.body.images),
            tags: JSON.parse(req.body.tags),
            createdAt: new Date(req.body.createdAt),
            isActive: req.body.isActive === 'on'
          };
        } else if (collection === 'orders') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            userId: new ObjectId(req.body.userId),
            items: JSON.parse(req.body.items),
            totalAmountZAR: Number(req.body.totalAmountZAR),
            shippingAddressId: new ObjectId(req.body.shippingAddressId),
            status: req.body.status,
            createdAt: new Date(req.body.createdAt),
            updatedAt: new Date(req.body.updatedAt)
          };
        } else if (collection === 'payments') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            orderId: new ObjectId(req.body.orderId),
            userId: new ObjectId(req.body.userId),
            amountZAR: Number(req.body.amountZAR),
            paymentMethod: req.body.paymentMethod,
            transactionId: req.body.transactionId,
            status: req.body.status,
            createdAt: new Date(req.body.createdAt)
          };
        } else if (collection === 'reviews') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            productId: new ObjectId(req.body.productId),
            userId: new ObjectId(req.body.userId),
            rating: Number(req.body.rating),
            comment: req.body.comment,
            createdAt: new Date(req.body.createdAt),
            isVerifiedPurchase: req.body.isVerifiedPurchase === 'on'
          };
        } else if (collection === 'cart') {
          newRecord = {
            ...(req.body.id && { _id: new ObjectId(req.body.id) }),
            userId: new ObjectId(req.body.userId),
            items: JSON.parse(req.body.items),
            createdAt: new Date(req.body.createdAt),
            updatedAt: new Date(req.body.updatedAt)
          };
        }
        await db.collection(collection).insertOne(newRecord);
      } else if (action === 'update') {
        const { id, newId, ...updateData } = req.body;
        if (newId && !isValidObjectId(newId)) {
          throw new Error('Invalid new _id format: Must be a 24-character hexadecimal string');
        }
        if (collection === 'product_categories') {
          updateData.createdAt = new Date(updateData.createdAt);
        } else if (collection === 'users') {
          updateData.defaultAddressId = updateData.defaultAddressId ? new ObjectId(updateData.defaultAddressId) : undefined;
          updateData.loyaltyPoints = Number(updateData.loyaltyPoints);
          updateData.createdAt = new Date(updateData.createdAt);
          updateData.isVerified = updateData.isVerified === 'on';
        } else if (collection === 'addresses') {
          updateData.userId = new ObjectId(updateData.userId);
          updateData.isPrimary = updateData.isPrimary === 'on';
          updateData.location = JSON.parse(updateData.location);
        } else if (collection === 'products') {
          updateData.priceZAR = Number(updateData.priceZAR);
          updateData.VAT = Number(updateData.VAT);
          updateData.categoryId = new ObjectId(updateData.categoryId);
          updateData.variants = JSON.parse(updateData.variants);
          updateData.images = JSON.parse(updateData.images);
          updateData.tags = JSON.parse(updateData.tags);
          updateData.createdAt = new Date(updateData.createdAt);
          updateData.isActive = updateData.isActive === 'on';
        } else if (collection === 'orders') {
          updateData.userId = new ObjectId(updateData.userId);
          updateData.items = JSON.parse(updateData.items);
          updateData.totalAmountZAR = Number(updateData.totalAmountZAR);
          updateData.shippingAddressId = new ObjectId(updateData.shippingAddressId);
          updateData.createdAt = new Date(updateData.createdAt);
          updateData.updatedAt = new Date(updateData.updatedAt);
        } else if (collection === 'payments') {
          updateData.orderId = new ObjectId(updateData.orderId);
          updateData.userId = new ObjectId(updateData.userId);
          updateData.amountZAR = Number(updateData.amountZAR);
          updateData.createdAt = new Date(updateData.createdAt);
        } else if (collection === 'reviews') {
          updateData.productId = new ObjectId(updateData.productId);
          updateData.userId = new ObjectId(updateData.userId);
          updateData.rating = Number(updateData.rating);
          updateData.createdAt = new Date(updateData.createdAt);
          updateData.isVerifiedPurchase = updateData.isVerifiedPurchase === 'on';
        } else if (collection === 'cart') {
          updateData.userId = new ObjectId(updateData.userId);
          updateData.items = JSON.parse(updateData.items);
          updateData.createdAt = new Date(updateData.createdAt);
          updateData.updatedAt = new Date(updateData.updatedAt);
        }
        if (newId && newId !== id) {
          // Replace document to change _id
          const newRecord = { _id: new ObjectId(newId), ...updateData };
          await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
          await db.collection(collection).insertOne(newRecord);
        } else {
          // Update fields without changing _id
          await db.collection(collection).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
        }
      } else if (action === 'delete') {
        await db.collection(collection).deleteOne({ _id: new ObjectId(req.body.id) });
      }
      res.redirect(`/${collection}`);
    } catch (err) {
      res.status(500).send(`Error processing ${collection} action: ${err.message}`);
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});