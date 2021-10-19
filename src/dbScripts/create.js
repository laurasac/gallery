const { Pool } = require('pg')
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password : process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
})

;(async () => {

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "Artists"(
                "id" SERIAL ,
                "firstName" VARCHAR(255) NOT NULL,
                "lastName" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "subscribed" BOOLEAN DEFAULT false,
                "email" VARCHAR(1000),
                "password" VARCHAR(1000) ,
                "phone" BIGINT,
                "status" VARCHAR(255),
                PRIMARY KEY("id")
            );
        `)
        console.log("Create table Artists")
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "Albums"(
                "id" SERIAL,
                "name" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "background" VARCHAR(255) DEFAULT '#ffffff',
                "artistId" INT NOT NULL,
                PRIMARY KEY("id"),
                CONSTRAINT "fkArtist"
                    FOREIGN KEY ("artistId")
                    REFERENCES "Artists"("id"),
                UNIQUE("artistId", "name")
            );
        `)
        console.log("Create table Albums")
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "Images"(
                "id" SERIAL,
                "name" VARCHAR(255) NOT NULL,
                "imageHash" VARCHAR(1000) NOT NULL,
                "description" TEXT,
                "alt" VARCHAR(1000) NOT NULL,
                "ext" VARCHAR(255) NOT NULL,
                "albumId" INT NOT NULL ,
                PRIMARY KEY("id"),
                CONSTRAINT "fkAlbum"
                    FOREIGN KEY ("albumId")
                    REFERENCES "Albums"("id")
            );
        `)
        console.log("Create table Images")
        pool.end()
    } catch( err) {
        console.log(err)
      }
  })()



/*pool.query(`
        CREATE TABLE IF NOT EXISTS "Artists"(
        "id" SERIAL ,
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "subscribed" BOOLEAN DEFAULT false,
        "email" VARCHAR(1000) UNIQUE,
        "password" VARCHAR(1000),
        "phone" BIGINT,
        "status" ENUM("enabled", "disabled", "not_verified")
        PRIMARY KEY("id")
        
    )`)
    .then(value => {
        console.log(value)
    })
*/

/* CREATE TABLE IF NOT EXISTS "Artists"(
    "id" INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "birthDate" TIMESTAMP,
    "description" TEXT,
    "subscribed" TINYINT(1) NOT NULL,
    "email" VARCHAR(1000) UNIQUE ,
    "password" VARCHAR(1000),
    "phone" BIGINT,
    "status" ENUM("enabled", "disabled", "not_verified")
)

CREATE TABLE IF NOT EXISTS "Albums"(
    "id" INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "background" VARCHAR(255) DEFAULT "#ffffff",
    "artistId" INT NOT NULL,
    CONSTRAINT fk_artist
    FOREIGN KEY "artistId"("artistId")
    REFERENCES "Artists"("id")
    UNIQUE("artistId", "name")
)

CREATE TABLE IF NOT EXISTS "Images"(
    "id" INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    "image" BLOB NOT NULL,
    "description" TEXT,
    "alt" VARCHAR(1000) NOT NULL,
    "albumId" INT NOT NULL ,
    CONSTRAINT fk_album
    FOREIGN KEY "albumId"("albumId")
    REFERENCES "Albums"("id")
)



ext enum(jpeg, jpg, png)



endpoint
error 500
login req body {email required passsword required} response {jwt} error email not valid 400 email o password errati 401
signup req body {email password firstname lastname required birthdate description phone} response 200 error email not valid 400 utente già esistente 401
getDashboard req {userid } authorization: jwt response{ dati utente più album più immagini per album} 401 jwt non valido o expired 403 forbidden 404 user not found
createAlbum req {name required description background} auth jwt res 200  error 401 unauthorizes
uploadImage  req {albumid required  blob  required description alt required} auth jwt res 200 error 404 album not found 404 immagine troppo grande 401 unauthrozien 403
deleteImage req {imageId required} auth jwt error not found 404 401 unaut 403 forbi
deleteAlbum req {albumId} auht jwt error 404 401 403
updateUser(userId updates {firstname lastname birthdate description phone})
getArtist
*/