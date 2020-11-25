const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;

const url = "mongodb://localhost:27017";

MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;

  const db = client.db("persistanceInCS");

  let args = [
    {
      $match: {
        cohort: { $in: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013] },
      },
    },
    {
      $addFields: {
        NURM_total: { $arrayElemAt: ["$NURM.CS", 0] },
        URM_total: { $arrayElemAt: ["$URM.CS", 0] },
        NURM_graduated: { $arrayElemAt: ["$NURM.Graduated", 5] },
        URM_graduated: { $arrayElemAt: ["$URM.Graduated", 5] },
      },
    },
    {
      $group: {
        _id: null,
        total_N_grads: { $sum: "$NURM_graduated" },
        total_U_grads: { $sum: "$URM_graduated" },
        total_N_students: { $sum: "$NURM_total" },
        total_U_students: { $sum: "$URM_total" },
      },
    },
    {
      $project: {
        _id: 0,
        "6 year grads": {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    { $add: ["$total_N_grads", "$total_U_grads"] },
                    { $add: ["$total_N_students", "$total_U_students"] },
                  ],
                },
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
