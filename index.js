const express = require('express');
const cloudinary = require('cloudinary');
const multer = require('multer');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const {ObjectId} = require('mongodb');
const cors = require('cors');
require('dotenv').config();

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET 
});

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, callback) =>{
      callback(null, 'uploads')
  },
  filename: (req, file, callback) =>{
      callback(null, file.fieldname+path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tviz5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true  });
client.connect(err => {
  const productCollection = client.db("emaJohnStore").collection("products");
  const orderCollection = client.db("emaJohnStore").collection("orders");
  const categoryCollection = client.db("emaJohnStore").collection("Categories");
  const sellerCollection = client.db("emaJohnStore").collection("sellers");
  
  app.post('/addProduct', upload.single('productImage'), async (req, res) => {
      const result = await cloudinary.uploader.upload(req.file.path).catch(cloudError => console.log(cloudError));
      if(result){
        const productData = {...req.body, productImage: result.secure_url};  
        productCollection.insertOne(productData)
        .then(insertResult => {
            if(insertResult.insertedCount < 0){
                res.send({"status": "error","message": `<p className="text-danger">Data corrupted</p>`})
            }
            else{
                res.send(insertResult.ops[0]);
            }
        })
        .catch(dbError => console.log(dbError));
      }
      else{
          res.status(404).send('Upload Failed');
      }
  })

  app.post('/addCategory', (req, res) => {
    const category = req.body;
    categoryCollection.insertOne(category)
    .then((result) => {
      if(result.insertedCount > 0){
        res.send(result.ops[0]);
      }
    })
  })

  app.post('/addOrder', (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order)
    .then((result) => {
        if(result.insertedCount > 0){
          res.send(result.ops[0]);
        }
    })
  })

  app.post('/addSeller', (req, res) => {
    const seller = req.body;
    sellerCollection.insertOne(seller)
    .then((result) => {
        if(result.insertedCount > 0){
          res.send(result.ops[0]);
        }
    })
  })

  app.get('/categories', (req, res) => {
    categoryCollection.find({})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

  app.get('/getAllOrders', (req, res) => {
    orderCollection.find({})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

  app.get('/getAllSellers', (req, res) => {
    sellerCollection.find({})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })



  app.get('/products', (req, res) => {
      productCollection.find({}).hint({ $natural : -1 })
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.get('/product/:key', (req, res) => {
    productCollection.find({_id: ObjectId(req.params.key)})
    .toArray((err, documents) => {
      res.send(documents[0]);
    })
  })

  app.get('/seller/:email', (req, res) => {
    sellerCollection.find({sellerUserName : req.params.email})
    .toArray((err, documents) => {
      res.send(documents[0]);
    })
  })

});

app.get('/', (req, res) => {
  res.send('Ema john server');
})



app.listen(process.env.PORT || 5000);