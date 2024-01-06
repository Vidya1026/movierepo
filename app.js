const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "moviesData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
const covertDirectorObjectToResponse = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.directorName,
  };
};
app.get("/movies/", async (request, response) => {
  const getMovieDetailsQuery = `
    SELECT movie_name FROM movie;`;
  const movieArray = await database.all(getMovieDetailsQuery);
  response.send(
    movieArray.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * FROM movie WHERE movie_id=${movieId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//posting new movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postQuery = `
    INSERT INTO movie(director_id,movie_name,lead_actor) 
    VALUES(${directorId},'${movieName}','${leadActor}');`;
  await database.run(postQuery);
  response.send("Movie Successfully Added");
});

//put method
app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const movieId = request.params;
  const updateQuery = `
    UPDATE movie SET
        director_id=${directorId},
        movie_name='${movieName}',
        lead_actor='${leadActor}'
        WHERE
        movie_id=${movieId};`;
  await database.run(updateQuery);
  response.send("Movie Details Updated");
});

//delete method
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE FROM movie
    WHERE movie_id=${movieId};`;
  await database.run(deleteQuery);
  response.send("Movie Removed");
});

//get director
app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `SELECT * FROM  director;`;
  const directorDetails = await database.all(getDirectorQuery);
  response.send(
    directorDetails.map((eachDirector) =>
      covertDirectorObjectToResponse(eachDirector)
    )
  );
});

//get director directed movies
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieDirectedByDirector = `
    SELECT movie_name FROM movie WHERE
    director_id='${directorId}'; `;
  const moviearray = await database.all(getMovieDirectedByDirector);
  response.send(
    moviearray.map((eachmovie) => ({ MovieName: eachmovie.movie_name }))
  );
});
module.exports = app;
