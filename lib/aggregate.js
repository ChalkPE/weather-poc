const fs = require('fs')
const { MongoClient } = require('mongodb')

const client = new MongoClient('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

async function run() {
  try {
    await client.connect()
    const database = client.db('ffxiv')
    const ishgard = database.collection('ishgard')

    const data = await ishgard.aggregate([
      {
        $match: {
          weather: 'Clear Skies'
        }
      },
      {
        $addFields: {
          parts: { $dateToParts: { date: '$_id' } }
        }
      },
      {
        $group: {
          _id: {
            $toLong: {
              $dateFromParts: {
                year: '$parts.year',
                month: '$parts.month',
                day: '$parts.day'
              },
            }
          },
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    const map = data.reduce((map, group) => map.set(group._id / 1000, group.count), new Map())
    await fs.promises.writeFile('./data.json', JSON.stringify(Object.fromEntries(map)))
  } finally {
    await client.close()
  }
}
run().catch(console.dir)