'use strict';

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

var dbstat = {
  status: "null"
}

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
    openapi: '3.0.0',
    info: {
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
  .use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  .use(bodyParser.json())
  .set('views', path.join(__dirname, 'views'))
  .use(express.json())
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/try', async (req, res) => {
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
  .post('/get_user', async (req, res) => {
    var usr = `'${req.body.username}'`;
    var pass = `'${req.body.password}'`;
    const { rows } = await db.query(`select username,password__c,firstname,lastname,email,phone from salesforce.user where username=${usr} and password__c=${pass}`);
    if (rows.length == 0)
      res.status(401).send("ERROR");
    else {
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
  .get('/get_user/:id', async (req, res) => {
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select firstname,lastname,email,phone from salesforce.user where username=${usr}`);
    res.status(200).json(rows[0]);
  })
  /**
   * @swagger
   * /get_account/{id}:
   *  get:
   *      tags:
   *          - Account
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
  .get('/get_account/:id', async (req, res) => {
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select ac_extid__c, name, phone, type, description, industry from salesforce.account where ownerid in (select sfid from salesforce.user where username=${usr})`);
    if (rows.length == 0)
      res.status(401).send("ERROR");
    else {
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
  *                        type: string
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
   *      tags:
   *          - Account
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
  .post('/save_account', (req, res) => {
    db.query('INSERT INTO salesforce.account(name, phone, type, description, industry) values ($1, $2, $3, $4, $5)',
      [req.body.name.trim(), req.body.phone, req.body.type.trim(), req.body.description.trim(), req.body.industry.trim()], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "inserted"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
 * @swagger
 * /account_info/{id}:
 *  get:
 *      tags:
 *          - Account
 *      summary: Fetch specific account
 *      description: Fetch example data by ID from Heroku Postgres
 *      parameters:
 *           - in: path
 *             name: id
 *             required: true
 *             description: ACCID required
 *             schema:
 *                type: string
 *      responses:
 *          200:
 *              description: Status OK
 */
  .get('/account_info/:id', async (req, res) => {
    var aid = `'${req.params.id}'`;
    const { rows } = await db.query(`select name, phone, type, description, industry from salesforce.account where ac_extid__c=${aid}`);
    res.status(200).json(rows[0]);
  })
  /**
* @swagger
* /update_account/{id}:
*  put:
*      tags:
*          - Account
*      summary: Update existing Account records
*      description: Put test 
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: Unique ID required
*             schema:
*                type: string
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
  .put('/update_account/:id', (req, res) => {
    var aid = `'${req.params.id}'`;
    db.query('UPDATE salesforce.account set name= $1, phone= $2, type= $3, description= $4, industry= $5 where ac_extid__c= $6',
      [req.body.name.trim(), req.body.phone.trim(), req.body.type.trim(), req.body.description.trim(), req.body.industry.trim(), req.params.id], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "inserted"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
 * @swagger
 * /delete_account/{id}:
 *  post:
 *      tags:
 *          - Account
 *      summary: Delet existing Account records
 *      description: Delet test 
 *      parameters:
 *           - in: path
 *             name: id
 *             required: true
 *             description: Unique ID required
 *             schema:
 *                type: string
 *      responses:
 *          200:
 *              description: Status OK
 *          401:
 *              description: Error
 */
  .post('/delete_account/:id', (req, res) => {
    db.query('DELETE from salesforce.opportunity where accountid in (SELECT sfid from salesforce.account where ac_extid__c= $1)',
      [req.params.id], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          db.query('DELETE from salesforce.contact where accountid in (SELECT sfid from salesforce.account where ac_extid__c= $1)',
            [req.params.id], (err, result) => {
              if (err) {
                res.status(404).send(err.stack);
              } else {
                db.query('DELETE from salesforce.account where ac_extid__c= $1',
                  [req.params.id], (err, result) => {
                    if (err) {
                      res.status(404).send(err.stack);
                    } else {
                      dbstat.status = "deleted"
                      res.status(200).json(dbstat);
                    }
                  })
              }
            })
        }
      })

  })
  /**
 * @swagger
 * /get_contact/{id}:
 *  get:
 *      tags:
 *          - Contact
 *      summary: Fetch all contact records
 *      description: Fetch contact by ID from Heroku Postgres
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
  .get('/get_contact/:id', async (req, res) => {
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select c.c_extd__c,c.name "cname" , a.name "aname" , c.title from salesforce.contact c, salesforce.account a where c.accountid = a.sfid and c.ownerid in (select sfid from salesforce.user where username= ${usr})`);
    if (rows.length == 0)
      res.status(401).send("ERROR");
    else {
      res.status(200).json(rows);
    }
  })
  /**
  * @swagger
  * /account_list/{id}:
  *  get:
  *      tags:
  *          - Contact
  *      summary: List accounts
  *      description: To be fed to spinner
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
  .get('/account_list/:id', async (req, res) => {
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select name, sfid from salesforce.account where ownerid in (select sfid from salesforce.user where username= ${usr});`);
    if (rows.length == 0)
      res.status(401).send("ERROR");
    else {
      res.status(200).json(rows);
    }
  })
  /**
 * @swagger
 *  components:
 *      schemas:
 *          Contact: 
 *                type: object
 *                properties:
 *                    firstname:
 *                        type: string
 *                    lastname:
 *                        type: string
 *                    name:
 *                        type: string
 *                    accountid:
 *                        type: string
 *                    title:
 *                        type: string
 *                    phone:
 *                        type: string
 *                    email:
 *                        type: string
 */
  /**
   * @swagger
   * /save_contact:
   *  post:
   *      tags:
   *          - Contact
   *      summary: Create new Contact values
   *      description: Post test 
   *      requestBody:
   *          required: true
   *          content:
   *              application/json:
   *                  schema:
   *                     $ref: '#components/schemas/Contact' 
   *      responses:
   *          200:
   *              description: Status OK
   *          401:
   *              description: Error
   */
  .post('/save_contact', (req, res) => {
    db.query('INSERT INTO salesforce.contact(name, firstname, lastname, accountid, title, phone, email) values ($1, $2, $3, $4, $5, $6, $7)',
      [req.body.name.trim(), req.body.firstname.trim(), req.body.lastname.trim(), req.body.accountid.trim(), req.body.title.trim(), req.body.phone.trim(), req.body.email.trim()], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "inserted"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
  * @swagger
  * /contact_info/{id}:
  *  get:
  *      tags:
  *          - Contact
  *      summary: Fetch specific contact
  *      description: Fetch example data by ID from Heroku Postgres
  *      parameters:
  *           - in: path
  *             name: id
  *             required: true
  *             description: cxtdid required
  *             schema:
  *                type: string
  *      responses:
  *          200:
  *              description: Status OK
  */
  .get('/contact_info/:id', async (req, res) => {
    var cid = `'${req.params.id}'`;
    const { rows } = await db.query(`select name, firstname, lastname, accountid, title, phone, email from salesforce.contact where c_extd__c=${cid}`);
    res.status(200).json(rows[0]);
  })
  /**
* @swagger
* /update_contact/{id}:
*  put:
*      tags:
*          - Contact
*      summary: Update existing Contact records
*      description: Put test 
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: Unique ID required
*             schema:
*                type: string
*      requestBody:
*          required: true
*          content:
*              application/json:
*                  schema:
*                     $ref: '#components/schemas/Contact' 
*      responses:
*          200:
*              description: Status OK
*          401:
*              description: Error
*/
  .put('/update_contact/:id', (req, res) => {
    db.query('UPDATE salesforce.contact set firstname= $1, lastname= $2, name= $3, accountid= $4, title= $5, phone= $6, email= $7 where c_extd__c= $8',
      [req.body.firstname.trim(), req.body.lastname.trim(), req.body.name.trim(), req.body.accountid.trim(), req.body.title.trim(), req.body.phone.trim(), req.body.email.trim(), req.params.id], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "updated"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
  * @swagger
  * /delete_contact/{id}:
  *  post:
  *      tags:
  *          - Contact
  *      summary: Delet existing Contact records
  *      description: Delet test 
  *      parameters:
  *           - in: path
  *             name: id
  *             required: true
  *             description: Unique ID required
  *             schema:
  *                type: string
  *      responses:
  *          200:
  *              description: Status OK
  *          401:
  *              description: Error
  */
  .post('/delete_contact/:id', (req, res) => {
    db.query('DELETE from salesforce.opportunity where contact__c in (SELECT sfid from salesforce.contact where c_extd__c= $1)',
      [req.params.id], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          db.query('DELETE from salesforce.contact where c_extd__c= $1',
            [req.params.id], (err, result) => {
              if (err) {
                res.status(404).send(err.stack);
              } else {
                dbstat.status = "deleted"
                res.status(200).json(dbstat);
              }
            })
        }
      })
  })
  /**
* @swagger
* /get_opportunity/{id}:
*  get:
*      tags:
*          - Opportunity
*      summary: Fetch all opportunity records
*      description: Fetch opportunity by ID from Heroku Postgres
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
  .get('/get_opportunity/:id', async (req, res) => {
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`select o.o_extid__c, o.name "oname", a.name "aname", o.stagename from salesforce.opportunity o, salesforce.account a where o.accountid=a.sfid and o.ownerid in (select sfid from salesforce.user where username= ${usr});`);
    if (rows.length == 0)
      res.status(401).send("ERROR");
    else {
      res.status(200).json(rows);
    }
  })
  /**
* @swagger
* /contact_list/{id}:
*  get:
*      tags:
*          - Opportunity
*      summary: List contact
*      description: To be fed to spinner
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
  .get('/contact_list/:id', async (req, res) => {
    var aid = `'${req.params.id}'`;
    const { rows } = await db.query(`select sfid, name from salesforce.contact where accountid=${aid}`);
    res.status(200).json(rows);
  })
  /**
* @swagger
*  components:
*      schemas:
*          Opportunity: 
*                type: object
*                properties:
*                    name:
*                        type: string
*                    amount:
*                        type: string
*                    closedate:
*                        type: string
*                    stage:
*                        type: string
*                    accountid:
*                        type: string
*                    contactid:
*                        type: string
*/
  /**
   * @swagger
   * /save_opportunity:
   *  post:
   *      tags:
   *          - Opportunity
   *      summary: Create new Opportunity values
   *      description: Post test 
   *      requestBody:
   *          required: true
   *          content:
   *              application/json:
   *                  schema:
   *                     $ref: '#components/schemas/Opportunity' 
   *      responses:
   *          200:
   *              description: Status OK
   *          401:
   *              description: Error
   */
  .post('/save_opportunity', (req, res) => {
    db.query('INSERT INTO salesforce.opportunity(name, amount, closedate, stagename, accountid, contact__c) values ($1, $2, $3, $4, $5, $6)',
      [req.body.name.trim(), req.body.amount.trim(), req.body.closedate.trim(), req.body.stage.trim(), req.body.accountid.trim(), req.body.contactid.trim()], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "inserted"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
* @swagger
* /opportunity_info/{id}:
*  get:
*      tags:
*          - Opportunity
*      summary: Fetch specific opportunity
*      description: Fetch example data by ID from Heroku Postgres
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: oxtdid required
*             schema:
*                type: string
*      responses:
*          200:
*              description: Status OK
*/
  .get('/opportunity_info/:id', async (req, res) => {
    var oid = `'${req.params.id}'`;
    const { rows } = await db.query(`select name, amount, closedate, stagename, accountid, contact__c from salesforce.opportunity where o_extid__c=${oid}`);
    res.status(200).json(rows[0]);
  })
  /**
* @swagger
* /update_opportunity/{id}:
*  put:
*      tags:
*          - Opportunity
*      summary: Update existing Opportunity records
*      description: Put test 
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: Unique ID required
*             schema:
*                type: string
*      requestBody:
*          required: true
*          content:
*              application/json:
*                  schema:
*                     $ref: '#components/schemas/Opportunity' 
*      responses:
*          200:
*              description: Status OK
*          401:
*              description: Error
*/
  .put('/update_opportunity/:id', (req, res) => {
    db.query('UPDATE salesforce.opportunity set name= $1, amount= $2, closedate= $3, stagename= $4, accountid= $5, contact__c= $6 where o_extid__c= $7',
      [req.body.name.trim(), req.body.amount.trim(), req.body.closedate.trim(), req.body.stage.trim(), req.body.accountid.trim(), req.body.contactid.trim(), req.params.id], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "updated"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
* @swagger
* /delete_opportunity/{id}:
*  post:
*      tags:
*          - Opportunity
*      summary: Delet existing Contact records
*      description: Delet test 
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: Unique ID required
*             schema:
*                type: string
*      responses:
*          200:
*              description: Status OK
*          401:
*              description: Error
*/
  .post('/delete_opportunity/:id', (req, res) => {
    db.query('DELETE from salesforce.opportunity where o_extid__c= $1',
      [req.params.id], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "deleted"
          res.status(200).json(dbstat);
        }
      })
  })
  /**
* @swagger
* /get_lead/{id}:
*  get:
*      tags:
*          - Lead
*      summary: Fetch all lead records
*      description: Fetch lead by ID from Heroku Postgres
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
  .get('/get_lead/:id', async (req, res) => {
    var usr = `'${req.params.id}'`;
    const { rows } = await db.query(`SELECT l_extid__c,name, company,status from salesforce.lead where ownerid in (select sfid from salesforce.user where username= ${usr});`);
    if (rows.length == 0)
      res.status(401).send("ERROR");
    else {
      res.status(200).json(rows);
    }
  })
    /**
* @swagger
*  components:
*      schemas:
*          Lead: 
*                type: object
*                properties:
*                    firstname:
*                        type: string
*                    lastname:
*                        type: string
*                    name:
*                        type: string
*                    company:
*                        type: string
*                    email:
*                        type: string
*                    title:
*                        type: string
*                    status:
*                        type: string         
*/
  /**
   * @swagger
   * /save_lead:
   *  post:
   *      tags:
   *          - Lead
   *      summary: Create new lead values
   *      description: Post test 
   *      requestBody:
   *          required: true
   *          content:
   *              application/json:
   *                  schema:
   *                     $ref: '#components/schemas/Lead' 
   *      responses:
   *          200:
   *              description: Status OK
   *          401:
   *              description: Error
   */
   .post('/save_lead', (req, res) => {
    db.query('INSERT INTO salesforce.lead(firstname, lastname, name, company, email, title, status) values ($1, $2, $3, $4, $5, $6, $7)',
      [req.body.firstname.trim(), req.body.lastname.trim(), req.body.name.trim(), req.body.company.trim(), req.body.email.trim(), req.body.title.trim(), req.body.status.trim()], (err, result) => {
        if (err) {
          res.status(404).send(err.stack);
        } else {
          dbstat.status = "inserted"
          res.status(200).json(dbstat);
        }
      })
  })
    /**
* @swagger
* /lead_info/{id}:
*  get:
*      tags:
*          - Lead
*      summary: Fetch specific lead
*      description: Fetch example data by ID from Heroku Postgres
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: lxtdid required
*             schema:
*                type: string
*      responses:
*          200:
*              description: Status OK
*/
.get('/lead_info/:id', async (req, res) => {
  var lid = `'${req.params.id}'`;
  const { rows } = await db.query(`select firstname, lastname, name, company, email, title, status from salesforce.lead where l_extid__c=${lid}`);
  res.status(200).json(rows[0]);
})
/**
* @swagger
* /update_lead/{id}:
*  put:
*      tags:
*          - Lead
*      summary: Update existing Lead records
*      description: Put test 
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: Unique ID required
*             schema:
*                type: string
*      requestBody:
*          required: true
*          content:
*              application/json:
*                  schema:
*                     $ref: '#components/schemas/Lead' 
*      responses:
*          200:
*              description: Status OK
*          401:
*              description: Error
*/
.put('/update_lead/:id', (req, res) => {
  db.query('UPDATE salesforce.lead set firstname= $1, lastname= $2, name= $3, company= $4, email= $5, title= $6, status= $7 where l_extid__c= $8',
    [req.body.firstname.trim(), req.body.lastname.trim(), req.body.name.trim(), req.body.company.trim(), req.body.email.trim(), req.body.title.trim(), req.body.status.trim(), req.params.id], (err, result) => {
      if (err) {
        res.status(404).send(err.stack);
      } else {
        dbstat.status = "updated"
        res.status(200).json(dbstat);
      }
    })
})
  /**
* @swagger
* /delete_lead/{id}:
*  post:
*      tags:
*          - Lead
*      summary: Delet existing lead records
*      description: Delet test 
*      parameters:
*           - in: path
*             name: id
*             required: true
*             description: Unique ID required
*             schema:
*                type: string
*      responses:
*          200:
*              description: Status OK
*          401:
*              description: Error
*/
.post('/delete_lead/:id', (req, res) => {
  db.query('DELETE from salesforce.lead where l_extid__c= $1',
    [req.params.id], (err, result) => {
      if (err) {
        res.status(404).send(err.stack);
      } else {
        dbstat.status = "deleted"
        res.status(200).json(dbstat);
      }
    })
})
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
