'use strict';

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000


const cors = require('cors');
const { Pool } = require('pg');
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { off } = require('process');

const options = {
  definition: {
    openapi : '3.0.0',
    info : {
      title: 'Heroku Connect Data Fetch',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'https://lead-api-app.herokuapp.com/'
      }
    ]
  },
  apis: ['./index.js']
}

const swaggerSpec = swaggerJSDoc(options)

var bodyParser = require('body-parser');

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(cors())
  .use('/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerSpec))
  .use(bodyParser.json())
  .set('views', path.join(__dirname, 'views'))
  .use(express.json())
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/try', async (req,res) =>{
    var usr = 'parvathysajeev0@empathetic-raccoon-ozme25.com';
    var pass = 'Parvathy123#';
    const { rows } = await db.query(`select username,password__c,firstname,lastname,phone from salesforce.userwhere username = ${usr} and password__c = ${pass}`);
    res.json(rows);
  })
  /**
   * @swagger
   *  components:
   *      schemas:
   *          User: 
   *                type: object
   *                properties:
   *                    username:
   *                        type: string
   *                    password:
   *                        type: string
   */
  /**
  /**
   * @swagger
   * /get_user:
   *  post:
   *      summary: Login validation using static values
   *      description: Check login 
   *      requestBody:
   *          required: true
   *          content:
   *              application/json:
   *                  schema:
   *                     $ref: '#components/schemas/User' 
   *      responses:
   *          200:
   *              description: Status OK
   *          401:
   *              description: Error
   */
  .post('/get_user',async (req,res)=>{
    var usr = `'${req.body.username}'`;
    var pass = `'${req.body.password}'`;
    const { rows } = await db.query(`select username,password__c,firstname,lastname,email,phone from salesforce.user where username=${usr} and password__c=${pass}`);
   if(rows.length==0)
    res.status(401).send("ERROR");
    else
    {
      res.status(200).json(rows[0]);
      //console.log(rows.length);
    }
    
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
