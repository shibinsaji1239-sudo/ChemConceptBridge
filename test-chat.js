
require('dotenv').config({path: 'backend/.env'});
const chatController = require('./backend/controllers/chatController');

const req = { 
    body: { 
        message: 'what is pH',
        context: 'Acids and Bases',
        history: []
    } 
};

const res = { 
    json: (data) => {
        console.log('--- RESPONSE ---');
        console.log(JSON.stringify(data, null, 2));
    }, 
    status: (code) => {
        console.log('--- STATUS', code, '---');
        return {
            json: (data) => {
                console.log(JSON.stringify(data, null, 2));
            }
        };
    } 
};

console.log('Testing Chat Controller...');
chatController.chat(req, res).catch(err => {
    console.error('--- CRASH ---');
    console.error(err);
});
