import { createClient } from "redis";

const redisClient = createClient();
redisClient.on('error', error => console.log(`an error occured: ${error}`));
redisClient.connect().then(() => console.log('redis is connected'))
.catch(error => console.log(`redis connection issue: ${error}`));
export default redisClient;
