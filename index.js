const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();



const app = express();

app.use(cors());
app.use(bodyParser.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tviz5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true  });
client.connect(err => {
  const productCollection = client.db("emaJohnStore").collection("products");
  const orderCollection = client.db("emaJohnStore").collection("orders");
  
  app.post('/addProduct', (req, res) => {
      const product = req.body;
      productCollection.insertOne(product)
      .then((result) => {
          res.send(result.insertedCount > 0);
      })
  })

  app.post('/addOrder', (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order)
    .then((result) => {
        res.send(result.insertedCount > 0);
    })
})

  app.get('/products', (req, res) => {
      productCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  app.post('/selectedProduct', (req, res) => {
      const productKeys = req.body;
      productCollection.find({key: {$in: productKeys}})
      .toArray((err, documents) => {
          res.send(documents);
      })
  })

  app.get('/product/:key', (req, res) => {
    productCollection.find({key: req.params.key})
    .toArray((err, documents) => {
      res.send(documents[0]);
    })
})

app.get('/', (req, res) => {
  res.send('Ema john server');
})


});


app.listen(process.env.PORT || 5000);