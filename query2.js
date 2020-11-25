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
        class: { $in: ["CS162", "CS163", "CS202"] },
        $expr: { $eq: ["$major.grade", "$non-major.grade"] },
        "major.grade": { $in: ["A", "A-", "B", "B-", "B+", "C", "C+"] },
      },
    },
    {
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
        }, //add field for total students
        total_male: { $add: ["$major.male", "$non-major.male"] }, //add field for total male students
        total_female: { $add: ["$major.female", "$non-major.female"] }, //add field for total female students
        total_nb: { $add: ["$major.nb", "$non-major.nb"] },
      }, //add field for toal nb students
    },
    {
      //total up the newly made columns
      $group: {
        _id: null,
        grand_total: { $sum: "$total" },
        male: { $sum: "$total_male" },
        female: { $sum: "$total_female" },
        nb: { $sum: "$total_nb" },
      },
    },
    {
      //display unweighted average
      $project: {
        _id: 0,
        Male: {
          $round: [
            { $multiply: [{ $divide: ["$male", "$grand_total"] }, 100] },
            2,
          ],
        },
        Female: {
          $round: [
            { $multiply: [{ $divide: ["$female", "$grand_total"] }, 100] },
            2,
          ],
        },
        "Non-binary": {
          $round: [
            { $multiply: [{ $divide: ["$nb", "$grand_total"] }, 100] },
            2,
          ],
        },
      },
    },
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
