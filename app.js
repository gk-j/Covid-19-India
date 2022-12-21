const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//get:states
app.get("/states/", async (request, response) => {
  const getQuery = `
select
  *
from
  state`;
  const statesArray = await db.all(getQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

///get states/:stateId/
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuery = `
SELECT
*
FROM
state
WHERE
state_id = ${stateId};`;

  const statedetails = await db.get(getstateQuery);
  response.send(convertStateDbObjectToResponseObject(statedetails));
});

//post-districts
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
INSERT INTO
district (district_name, state_id, cases, cured, active, deaths)
VALUES
('${districtName}', ${stateId},${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//get//districts/:districtId/
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
SELECT
*
FROM
district
WHERE
district_id = ${districtId};`;

  const districtdetails = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(districtdetails));
});

//delete/districts/:districtId/
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
DELETE FROM
district
WHERE
district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//put/districts/:districtId/
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateQuery = `
UPDATE
district
SET
district_name = '${districtName}',
state_id = ${stateId},
cases = ${cases},
cured=${cured},
active=${active},
deaths=${deaths}
WHERE
district_id = ${districtId};`;

  await db.run(updateQuery);
  response.send("District Details Updated");
});

//get/states/:stateId/stats/
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getstatestatQuery = `
SELECT
 SUM(cases) as totalCases,
 SUM(cured) as totalCured,
 SUM(active) as totalActive ,
 SUM(deaths) as totalDeaths
FROM
   district
WHERE
  state_id=${stateId};`;
  const stats = await db.get(getstatestatQuery);

  response.send(stats);
});

///districts/:districtId/details/
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDirectorsQuery = `
SELECT
  state_name  
FROM
   district NATURAL JOIN state
WHERE
   district_id=${districtId};`;
  const state = await db.all(getDirectorsQuery);
  console.log(state);

  response.send(
    state.map((statename) => ({ stateName: statename.state_name }))
  );
});

module.exports = app;
