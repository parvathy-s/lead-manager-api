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
  /**
   * @swagger
   * /get_user/{id}:
   *  get:
   *      summary: Fetch specific from Example SF Object
   *      description: Fetch example data by ID from Heroku Postgres
   *      parameters:
   *           - in: path
   *             name: id
   *             required: true
   *             description: Username required
   *             schema:
   *                type: string
   *      responses:
   *          200:
   *              description: Status OK
   */
  .get('/get_user/:id', async (req,res) =>{
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select firstname,lastname,email,phone from salesforce.user where username=${usr}`);
    res.status(200).json(rows[0]);
  })
  /**
   * @swagger
   * /get_account/{id}:
   *  get:
   *      summary: Fetch all account records
   *      description: Fetch account by ID from Heroku Postgres
   *      parameters:
   *           - in: path
   *             name: id
   *             required: true
   *             description: Username required
   *             schema:
   *                type: string
   *      responses:
   *          200:
   *              description: Status OK
   */
   .get('/get_account/:id', async (req,res) =>{
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select ac_extid__c, name, phone, type, description, industry from salesforce.account where ownerid in (select sfid from salesforce.user where username=${usr})`);
    if(rows.length==0)
    res.status(401).send("ERROR");
    else
    {
      res.status(200).json(rows);
    }
  })
   /**
   * @swagger
   *  components:
   *      schemas:
   *          Account: 
   *                type: object
   *                properties:
   *                    name:
   *                        type: string
   *                    phone:
   *                        type: integer
   *                    type:
   *                        type: string
   *                    description:
   *                        type: string
   *                    industry:
   *                        type: string
   */
  /**
   * @swagger
   * /save_account:
   *  post:
   *      summary: Create new Account values
   *      description: Post test 
   *      requestBody:
   *          required: true
   *          content:
   *              application/json:
   *                  schema:
   *                     $ref: '#components/schemas/Account' 
   *      responses:
   *          200:
   *              description: Status OK
   *          401:
   *              description: Error
   */
  .post('/save_account',(req,res) =>{
      db.query('INSERT INTO salesforce.account(name, phone, type, description, industry) values ($1, $2, $3, $4, $5)',
      [req.body.name.trim(), req.body.phone, req.body.type.trim(), req.body.description.trim(), req.body.industry.trim()], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          res.status(200).send("Inserted");
        }
      })
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
