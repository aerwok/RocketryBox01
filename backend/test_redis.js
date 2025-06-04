const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://:GUP1RJOkJVgAhu7ydayYSo9OCwfcrYIZ@redis-13884.c305.ap-south-1-1.ec2.redns.redis-cloud.com:13884'
});

async function testRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Successfully connected to Redis!');

    // Test setting a value
    await redisClient.set('test_key', 'Hello Redis!');
    console.log('✅ Successfully set test value');

    // Test getting the value
    const value = await redisClient.get('test_key');
    console.log('✅ Retrieved value:', value);

    // Clean up
    await redisClient.del('test_key');
    console.log('✅ Cleaned up test key');

    await redisClient.quit();
    console.log('✅ Successfully disconnected from Redis');
  } catch (error) {
    console.error('❌ Redis Error:', error.message);
  }
}

testRedis();
