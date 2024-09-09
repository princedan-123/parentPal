import db from './db.js';

console.log(db)
async function test() {
    await db.init()
    console.log(await db.clientCollection.insertOne({test: 'hello world'}));
    console.log(await db.clientCollection.findOne());
    db.close();
}
test();
