const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.66naq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());



const port = 5000;

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentsCollection = client.db(process.env.DB_NAME).collection("appointments");
  const doctorCollection = client.db(process.env.DB_NAME).collection("doctors");
  
  app.post('/addAppointment', (req,res) => {
    const appointment = req.body;
    console.log(appointment);
    appointmentsCollection.insertOne(appointment)
    .then( result => {
        res.send( result.insertedCount > 0 );
    })
   })
   app.post('/appointmentsByDate',(req,res) => {
    const date = req.body
    console.log(date.date);
    appointmentsCollection.find({date: date.date})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })
  app.post('/addADoctor',(req,res) => {
      const file = req.files.file;
      const name = req.body.name;
      const email = req.body.email;
      const filePath = `${__dirname}/doctors/${file.name}`;
      console.log(name, email, file);

      file.mv(filePath,err => {
        if(err){
          console.log(err);
          return res.status(500).send({msg: 'failed to upload image in the server'})
        }
        const newImg = fs.readFileSync(filePath);
        const encImg = newImg.toString('base64');

       // console.log(encImg);

        var image = {
          name: file.name,
          contentType: file.mimetype,
          size: file.size,
          img: Buffer.from(encImg, 'base64')
      };

        doctorCollection.insertOne({name, email, image})
        .then(result => {
          fs.remove(filePath, error => {
            if(error) {
              console.log(error);
              res.status(500).send({msg: 'failed to upload image in the server'})
            }
            res.send(result.insertedCount > 0)
          })
          
        })
      //  return res.send({name: file.name, path: `/${file.name}`})
      })
  })
  app.get('/doctors',(req,res) => {
      doctorCollection.find({})
      .toArray( (err, documents) => {
        res.send(documents);
      })
  })
  console.log('Database Connected Successfully');
  
});

app.listen(process.env.PORT || port)