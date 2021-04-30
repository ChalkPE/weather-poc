const { MongoClient } = require('mongodb')
const eorzeaWeather = require('eorzea-weather')
const addMinutes = require('date-fns/addMinutes')

const start = new Date('2016-01-01 00:00:00')
const end = new Date('2022-01-01 00:00:00')

const client = new MongoClient('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

async function run() {
  try {
    await client.connect()
    const database = client.db('ffxiv')
    const ishgard = database.collection('ishgard')
    await ishgard.drop()
    await ishgard.createIndex({ weather: 1 })

    let buffer = []
    const flush = async () => {
      const { result } = await ishgard.insertMany(buffer)
      console.log('flush', buffer[0]._id, buffer[buffer.length - 1]._id, result)
      buffer = []
    }

    for (let _id = start; _id < end; _id = addMinutes(_id, 1)) {
      const weather = eorzeaWeather.getWeather(eorzeaWeather.ZONE_ISHGARD, _id)
      
      buffer.push({ _id, weather })
      if (buffer.length >= 100000) await flush()
    }
    await flush()
  } finally {
    await client.close()
  }
}
run().catch(console.dir)