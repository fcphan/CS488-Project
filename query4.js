const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;

const url = "mongodb://localhost:27017";

MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;

  const db = client.db("persistanceInCS");

  let args = [
    { $match: { cohort: 2012 } },
    {
      $addFields: {
        total_students: {
          $add: [
            { $arrayElemAt: ["$NURM.CS", 0] },
            { $arrayElemAt: ["$URM.CS", 0] },
          ],
        },
      },
    },
    { $unwind: "$NURM" },
    { $unwind: "$URM" },
    { $match: { "NURM.year": 2016, "URM.year": 2016 } },
    {
      $addFields: {
        total_changed_dropped: {
          $add: [
            "$NURM.Non-CS",
            "$URM.Non-CS",
            "$NURM.Stopped Out",
            "$URM.Stopped Out",
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        cohort: 1,
        "Percentage by 2016": {
          $round: [
            {
              $multiply: [
                { $divide: ["$total_changed_dropped", "$total_students"] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
  ];

  db.collection("persistanceInCS")
    .aggregate(args)
    .toArray()
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      client.close();
    });
});
