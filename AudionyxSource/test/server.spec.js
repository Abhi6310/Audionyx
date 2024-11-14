// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************
/*
describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});
*/

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************


// TODO:  Write 2 test cases for the /register API in your website
describe('Testing Account Signup for User', () => {
  // POSTIVE ->  res.status(200).json({ message: 'Account successfully created!' });
  it('Positive: /register ACCOUNT CREATION', (done) => {
    chai
      .request(server)
      .post('/register') 
      .send({ username: 'abc', password: '123' }) 
      .end((err, res) => {
        if (err) return done(err); 
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Account successfully created!'); 
        done();
      });
  });
  // NEGATIVE -> res.status(400).json({ message: 'Uh oh! Something went wrong, your username was invalid or already registered!' });
  it('Negative: /register INVALID USERNAME CREATION, USERNAME EXCEEDS LIMIT (50)', (done) => {
    chai
      .request(server)
      .post('/register') 
      .send({ username: 'sadihadiuhsadiuashduisahduisahdiusahduisahdsauidhsaiudhasuidhsauidhasaiusdsadihadiuhsadiuashduisahduisahdiusahduisahdsauidhsaiudhasuidhsauidhasaiusdhsauihsaui', password: '123' })
      .end((err, res) => {
        if (err) return done(err); 
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('The username you entered exceeds the 50 character limit. Please choose a different username.'); 
        done();
      });
  });
});

// ********************************************

// TODO: Write two unit test cases (1 positive and 1 negative) for any of the API endpoints, apart from register, in your project.
describe('Testing Account Login for User', () => {
  // POSITIVE
  it('Positive: /login LOGGING INTO ACCOUNT', (done) => {
    chai
      .request(server)
      .post('/login') 
      .send({ username: 'abc', password: '123' }) 
      .end((err, res) => {
        if (err) return done(err); 
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Login successful! Welcome back to Audionyx!'); 
        done();
      });
  });
  // NEGATIVE
  it('Negative: /register INVALID USERNAME CREATION, USERNAME NOT REGISTERED', (done) => {
    chai
      .request(server)
      .post('/login') 
      .send({ username: 'fake_username', password: 'fake_password' })
      .end((err, res) => {
        if (err) return done(err); 
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('No username found, sign up to make an account.'); 
        done();
      });
  });
});


// ********************************************************************************