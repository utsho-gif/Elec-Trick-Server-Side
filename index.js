const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json());

//connect w mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hnjhc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection = client.db("elec-trick").collection("products");
        const userCollection = client.db("elec-trick").collection("users");
        const orderCollection = client.db("elec-trick").collection("orders");

        //get all services
        app.get('/product', async (req,res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        })

        //update user for JWT
        app.put('/user/:email', async(req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = { upsert : true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '6d'
            })
            res.send({result, token})

        })

        //load a single product
        app.get('/purchase/:id', async(req, res) => {
            const id = req.params.id;
            const result = await productCollection.findOne({_id: ObjectId(id)});
            res.send(result);
        })

        //insert order details
        app.post('/order', async(req,res) => {
            const orderDetail = req.body;
            const result = await orderCollection.insertOne(orderDetail);
            res.send(result);
        })
    }

    finally{

    }
}

run().catch(console.dir);



app.get('/',(req, res) => {
    res.send('Home');
})


app.listen(port, () => {
    console.log('Listening', port);
})