const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        //get all services
        app.get('/product', async (req,res) => {
            const result = await productCollection.find().toArray();
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