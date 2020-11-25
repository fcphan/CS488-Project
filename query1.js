const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;

const url = "mongodb://localhost:27017";

MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;

  const db = client.db("gradesByClass");

  let args = [
    { $unwind: "$major" }, //unwinds major array
    { $unwind: "$non-major" }, //unwinds non-major array
    {
      //filters rows for grades C and up
      $match: {
        year: 2016,
        $expr: { $eq: ["$major.grade", "$non-major.grade"] },
        "major.grade": { $in: ["A", "A-", "B", "B-", "B+", "C", "C+"] },
      },
    },
    {
      //Add a sum field that totals students
      $addFields: {
        total: {
          $add: [
            "$major.male",
            "$major.female",
            "$major.nb",
            "$non-major.male",
            "$non-major.female",
            "$non-major.nb",
          ],
        },
      },
    },
    {
      //aggregate the total column
      $group: { _id: null, "total students": { $sum: "$total" } },
    },
    { $project: { _id: 0, "total students": 1 } }, //only show total
  ];

  db.collection("gradesByClass")
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
