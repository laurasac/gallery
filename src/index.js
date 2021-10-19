const express = require('express');
const jwt = require('jsonwebtoken');
const { createHash } = require('crypto')
const app = express();
const { Pool } = require('pg')
const { readFile, writeFile } = require("fs/promises")
const { join } = require("path");
//require("dotenv").config({ path: join(__dirname, "../.env") })



const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
})

const secretPassword = process.env.HASH_PASSWORD
const secretImage =  process.env.HASH_IMAGE
const secretJwt =  process.env.SECRET_JWT

const status = {
    enabled: "enabled",
    disabled: "disabled",
}



app.use(express.json())
app.use(express.static(join(__dirname, '../static')));

const getScope = (req, res, next) => {
    req.scope = null
    const {path} = req
    switch(path){
        case "/getUser":
        case "/updateUser":
        case "/updatePassword":
        case "/createAlbum":
        case "/insertImageIntoAlbum":
        case "/deleteAlbum":
        case "/deleteImage":
        case "/updateAlbum":
        case "/updateImage":{
            req.scope = "auth"
            break
        } 
        default: {
            req.scope = "notAuth"
            break
        }
    }
    next()
}

const authenticateJWT = (req, res, next) => {
    const auth = req.headers.authorization
    
    if(req.scope === "auth"){
        if (auth) {
            jwt.verify(auth, secretJwt, (err, decoded) => {
                if (err) {
                    res.status(401).json({error: {code: "unauthorized", message: err.message}})
                    return
                }
    
                req.user = decoded
                next();
            })
        } else {
            res.status(401).json({ 
                error: {
                    code: "unauthorized", 
                    message: "Missing jwt"
                }
            })
        }
    } else {
        next()
    }
    
};
app.use(getScope)
app.use(authenticateJWT)




//METHOD GET
app.get('/', (req, res) => {
    res.status(200).sendFile(__dirname + "/pages/home.html")
})

app.get('/artists', ({query: {id}, body}, res) => {
    
    if(id) res.status(200).sendFile(__dirname + "/pages/artist.html")
    else res.status(200).sendFile(__dirname + "/pages/listArtists.html")
})

app.get("/login", (req, res) => {
    res.status(200).sendFile(__dirname + "/pages/login.html")
})

app.get("/signUp", (req, res) => {
    res.status(200).sendFile(__dirname + "/pages/signUp.html")
})

app.get("/dashboard", (req, res) => {
    res.status(200).sendFile(__dirname + "/pages/dashboard.html")
})

app.get("/profile", (req, res) => {
    res.status(200).sendFile(__dirname + "/pages/profile.html")
})


//METHOD POST
app.post("/login", async({body:{email, password}}, res) => {
    try {
        const hashPassword = createHash("sha256").update(password+secretPassword).digest("hex")
        const {rows: [row]} = await pool.query(`
            SELECT "id", "firstName", "lastName", "email" FROM "Artists" 
            WHERE "email" = $1 AND "password" = $2 AND "subscribed" = true`, [email, hashPassword])
        if(row){
            jwt.sign(row, secretJwt, {expiresIn: 3*24*60*60*1000}, (err, token) => {
                if(err) {
                    throw err 
                }
                else {
                    res.status(200).json({data: {jwt: token, userId: row.id}})
                    return
                }
            })
        } else {
            res.status(401).json({error: { code: "unauthorized", message: "Email or password invalid"}})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/signUp", async({body: {firstName, lastName, description, email, password, phone}}, res) => {
    try {
        if(!firstName || !lastName || !email || !password){
            
            res.status(400).json({error: {code: "bad_request", message: "Missing some required fields"}})
        } else {
            const {rows:[row_1]} = await pool.query(`
                SELECT id FROM "Artists"
                WHERE  "subscribed" = true AND "email" = $1 AND "status" = $2`, [email, status.enabled])
            
            if(row_1){
                res.status(400).json({error: { code: "bad_request", message: "User already exist"}})
                return
            }

            const hashPassword = createHash("sha256").update(password+secretPassword).digest("hex")

                
            await pool.query(`
                INSERT INTO "Artists"("firstName", "lastName", "description", "subscribed", "email", "password", "phone", "status" )
                    VALUES ( $1, $2, $3, $4, $5, $6, $7, $8)
            `, [firstName, lastName, description, true, email, hashPassword, phone, status.enabled ])
            
            res.status(200).json({status: "ok"})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/getUser", async ({body:{userId}, user}, res) => {
    try {
        if(userId !== user.id) {
            res.status(403).json({error: {code: "forbidden", message: "action forbidden"}})
        } else {
            const {rows:[row]} = await pool.query(`
                SELECT "id", "firstName", "lastName", "description", "email",  "phone" FROM "Artists"
                WHERE "id" = $1 AND "subscribed" = true AND "status" = $2
            `, [userId, status.enabled])
            
            if(row) res.status(200).json({data: row})
            else res.status(404).json({error: {code: "not_found", message: "user not found"}})
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
    
})

app.post("/updateUser", async ({body:{userId, updates}, user}, res) => {
    try {
        if(userId !== user.id){
            res.status(403).json({error: {code: "forbidden", message: "action forbidden"}})
        } else {
            const {firstName, lastName, description, phone} = updates
            const { rowCount } = await pool.query(`
                UPDATE "Artists"
                SET "firstName" = $1,
                    "lastName" = $2,
                    "description" = $3,
                    "phone" = $4
                 WHERE "id" = $5 AND "subscribed" = true AND "status" = $6
            `, [firstName || "", lastName || "", description, phone, userId, status.enabled])
            
            if(rowCount) res.status(200).json({status: "ok"})
            else res.status(404).json({error: {code: "not_found", message: "user not found"}})
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/updatePassword", async ({body:{userId, newPassword}, user}, res) => {
    try {
        if(userId !== user.id){
            res.status(403).json({error: {code: "forbidden", message: "action forbidden"}})
        } else {
            if(!newPassword){
                res.status(400).json({error: {code:"bad_request", message: "Missing new password"}})
                return
            }
            const hashPassword = createHash("sha256").update(newPassword+secretPassword).digest("hex")

            const { rowCount } = await pool.query(`
                UPDATE "Artists"
                SET "password" = $1
                 WHERE "id" = $2 AND "subscribed" = true AND "status" = $3
            `, [hashPassword,  userId, status.enabled])
            
            if(rowCount) res.status(200).json({status: "ok"})
            else res.status(404).json({error: {code: "not_found", message: "user not found"}})
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/createAlbum", async ({body:{name, description, background}, user}, res) => {
    try {

        if(!name){
            res.status(400).json({error:{ code:"bad_request", message: "Missing some required fileds"}})
            return
        }
        const {rows:[row_1]} = await pool.query(`
            SELECT "id" FROM "Artists"
            WHERE "id" = $1 AND "subscribed" = true AND "status" = $2
        `, [user.id, status.enabled])

        if(row_1){

            background = background || "#ffffff"

            const {rows:[row_2]} = await pool.query(`
                INSERT INTO "Albums"("name", "description","background", "artistId")
                    VALUES ( $1, $2, $3, $4)
                RETURNING *
            `, [name, description, background, user.id])
            
            res.status(200).json({data: row_2})
        } else {
            res.status(403).json({error:{code: "forbidden", message:"user disabled"}})
        }
    } catch (error) {
        console.log(error)
        if(error.routine === "_bt_check_unique" && error.constraint === "Albums_artistId_name_key"){
            res.status(400).json({error: {code: "bad_request", message: "album already exist"}})
        } else {
            res.status(500).json({error:{code: "internal_server_error", message: error.message}})
        }
        
    }
})

app.post("/insertImageIntoAlbum", async ({body:{albumId, name, image, description, alt, ext}, user}, res) => {
    try {
        if(!albumId || !name  || !image || !alt || !ext){
            res.status(400).json({error:{code: "bad_request", message: "Missing some required fileds"}})
            return
        }
        const {rows:[row_1]} = await pool.query(`
            SELECT A."id" FROM "Albums" AS A
            INNER JOIN "Artists" AS U ON U."id" = A."artistId"
            WHERE A."id" = $1 AND U."id" = $2 AND U."subscribed" = true AND U."status" = $3
        `, [albumId, user.id, status.enabled ])

        if(row_1){
            const imageHash = createHash("sha256").update(`${name}${Date.now()}${secretImage}`).digest("hex")
            
            const buffer =  Buffer.from(image)
            
            await writeFile(join(__dirname,`../static/${imageHash}.${ext}`), buffer)
            
            const {rows:[row_2]} = await pool.query(`
                INSERT INTO "Images"("name", "imageHash","description","alt", "ext", "albumId")
                    VALUES ( $1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [name, imageHash, description, alt, ext, albumId ])

            res.status(200).json({data: row_2})

        } else {
            res.status(403).json({error:{code: "forbidden", message: "action forbidden"}})
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/deleteAlbum", async ({body:{albumId}, user}, res) => {
    try {
        if(!albumId){
            res.status(400).json({error: {code: "bad_request", message: "Missing album id"}})
            return
        } 
        
        const {rows:[row]} = await pool.query(`
            SELECT A."id" FROM "Albums" AS A
            INNER JOIN "Artists" AS U ON U."id" = A."artistId"
            WHERE A."id" = $1 AND U."id" = $2 AND U."subscribed" = true AND U."status" = $3
        `, [albumId, user.id, status.enabled ])

        if(!row){
            res.status(403).json({error:{code: "forbidden", message: "action forbidden"}})
            return
        }

        await pool.query(`
            DELETE FROM "Images"
            WHERE "albumId" = $1
        `, [albumId])

        const {rows:{rowCount}} = await pool.query(`
            DELETE FROM "Albums"
            WHERE "id" = $1
        `, [albumId])

        if(rowCount) {
            res.status(404).json({error:{code: "not_found", message: "album not found"}})
            return
        }
        res.status(200).json({status: "ok"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/deleteImage", async ({body:{imageId}, user}, res) => {
    try {
        if(!imageId){
            res.status(400).json({error: {code: "bad_request", message: "Missing image id"}})
            return
        } 
        
        const {rows:[row]} = await pool.query(`
            SELECT I."id" FROM "Images" AS I
            INNER JOIN "Albums" AS A ON A."id" = I."albumId"
            INNER JOIN "Artists" AS U ON U."id" = A."artistId"
            WHERE I."id" = $1   AND U."id" = $2 AND U."subscribed" = true AND U."status" = $3
        `, [imageId, user.id, status.enabled ])

        if(!row){
            res.status(403).json({error:{code: "forbidden", message: "action forbidden"}})
            return
        }

        const {rows:{rowCount}} = await pool.query(`
            DELETE FROM "Images"
            WHERE "id" = $1
        `, [imageId])


        if(rowCount) {
            res.status(404).json({error:{code: "not_found", message: "image not found"}})
            return
        }
        res.status(200).json({status: "ok"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/updateAlbum", async ({body:{albumId, updates}, user}, res) => {
    try {
        const {name, description, background} = updates
        
        if(!albumId ){
            res.status(400).json({error: {code: "bad_request", message: "Missing album id"}})
            return
        } 
        
        const {rows:[row]} = await pool.query(`
            SELECT A."id" FROM "Albums" AS A
            INNER JOIN "Artists" AS U ON U."id" = A."artistId"
            WHERE A."id" = $1 AND U."id" = $2 AND U."subscribed" = true AND U."status" = $3
        `, [albumId, user.id, status.enabled ])
        
        if(!row){
            res.status(403).json({error:{code: "forbidden", message: "action forbidden"}})
            return
        }
        
        const {rowCount } = await pool.query(`
            UPDATE "Albums"
            SET "name" = $1,
                "description" = $2,
                "background" = $3
            WHERE "id" = $4 
        `, [name || "", description, background || "#ffffff", albumId])
        
        if(!rowCount){
            res.status(404).json({error: {code :"not_found", message: "album not found" }})
            return
        }

        res.status(200).json({status:"ok"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/updateImage", async ({body:{imageId, updates}, user}, res) => {
    try {
        const {name, description, alt} = updates
        
        if(!imageId ){
            res.status(400).json({error: {code: "bad_request", message: "Missing image id"}})
            return
        } 
        
        const {rows:[row]} = await pool.query(`
            SELECT I."id" FROM "Images" AS I
            INNER JOIN "Albums" AS A ON A."id" = I."albumId"
            INNER JOIN "Artists" AS U ON U."id" = A."artistId"
            WHERE I."id" = $1   AND U."id" = $2 AND U."subscribed" = true AND U."status" = $3
        `, [imageId, user.id, status.enabled ])

        if(!row){
            res.status(403).json({error:{code: "forbidden", message: "action forbidden"}})
            return
        }
        
        const { rowCount } = await pool.query(`
            UPDATE "Images"
            SET "name" = $1,
                "description" = $2,
                "alt" = $3
            WHERE "id" = $4 
        `, [name || "", description, alt || "", imageId])

        if(!rowCount){
            res.status(404).json({error: {code :"not_found", message: "image not found" }})
            return
        }

        res.status(200).json({status:"ok"})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/listArtists", async ({body:{paginator:{offset, limit}}}, res) => {
    try {
        const { rows: [{json_agg: data}]} = await pool.query(`
            SELECT 
            JSON_AGG(
                json_build_object(
                    'id', A."id",
                    'firstName', A."firstName", 
                    'lastName', A."lastName" 
                )
            )
            FROM "Artists" A
            WHERE "status" = $1
            LIMIT $2
            OFFSET $3
        `, [status.enabled, limit, offset])
        res.status(200).json({data})
   } catch (error) {
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})

app.post("/getArtist", async ({body:{ artistId}}, res) => {
    try{ 
        const { rows:[row]} = await pool.query(`
            SELECT
            A."id",
            A."firstName",
            A."lastName",
            A."description",
            COALESCE(
                JSON_AGG(
                    json_build_object(
                        'id', AL."id",
                        'name',AL."name",
                        'description',AL."description",
                        'background',AL."background",
                        'artistId', AL."artistId",
                        'images', ( 
                            SELECT 
                            COALESCE(
                                JSON_AGG(
                                    json_build_object(
                                        'id', I."id",
                                        'name', I."name",
                                        'description',I."description",
                                        'alt', I."alt",
                                        'albumId',I."albumId",
                                        'imageHash', I."imageHash",
                                        'ext', I."ext"
                                    )
                                )
                                FILTER( WHERE I."id" IS NOT NULL),
                                '[]'
                            )
                            FROM "Images" I
                            WHERE I."albumId" = AL."id"
                        )
                    )
                )
                FILTER (WHERE AL."id" IS NOT NULL),
                '[]'
            ) "albums"
            FROM "Artists" A
            LEFT JOIN "Albums" AL ON AL."artistId" = A."id"
            WHERE A."id" = $1 AND A."status" = $2
            GROUP BY  A."id" 
        `, [artistId, status.enabled])
            
        if(!row){
            res.status(404).json({error:{code:"not_found", message: " artist not found"}})
            return
        }
        
        for(let i = 0; i< row.albums.length; i++){
                
            for(let j = 0; j< row.albums[i].images.length; j++) {
                const {imageHash, ext} = row.albums[i].images[j]
                const image = await readFile(join(__dirname,`../static/${imageHash}.${ext}`))
                row.albums[i].images[j].image = image
            
            }
        }
        

        res.status(200).json({data:row})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: {code: "internal_server_error", message: error.message}})
    }
})


app.all("*", (req, res) =>  {
   res.status(404).send("Not found")
});

app.listen(3000, () => {
    console.log("Listen on port 3000")
})
