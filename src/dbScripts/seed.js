const { Pool } = require('pg')
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password : process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
})


const artists = [{
        firstName: "Vincent",
        lastName: "Van Gogh",
        description: `Vincent Van Gogh è tra gli artisti più conosciuti e 
            ammirati in tutto il mondo. Considerato il precursore dell espressionismo 
            e pioniere dellarte contemporanea, le sue opere influenzano ancora oggi 
            pittori e correnti stilistiche. Nato in Olanda nel 1853, è morto a 37 anni 
            a Auvers sur Oise, in Francia, il 29 luglio del 1890. La sua carriera artistica 
            è stata prolifica, seppur durata solo una decina d anni, e ha prodotto oltre 900 dipinti. 
            Ignorato dai suoi contemporanei, è stato un genio tormentato e visionario che ha lasciato 
            ai posteri opere destinate a renderlo immortale anche a 130 anni dalla morte`,
        status: "enabled"
    },

    {
        firstName: "Claude",
        lastName: "Monet",
        description: `Oscar-Claude Monet (Parigi, 14 novembre 1840 – Giverny, 5 dicembre 1926) è stato un pittore francese, considerato uno dei fondatori dell impressionismo francese e certamente 
            il più coerente e prolifico del movimento. I suoi lavori si distinguono per la rappresentazione
            della sua immediata percezione dei soggetti, in modo particolare per quanto riguarda la 
            paesaggistica e la pittura en plein air.`,
            status: "enabled"
    }
]

const albums = [{
        name: "Dipinti",
        description: "Dipinti dal 1888-1889",
        background: "#8CE5FF"
    },

    {
        name: "Ninfee",
        description: "Serie delle Ninfee",
        background: "#CB8CFF"
    }
]

const images = [
    {
        name: "stanza",
        alt: "stanza",
        imageHash: "4b1d8f4a43cfae66eeaf41095a3b46c78bf405395999ebd5f76843625b469790",
        description:"stanza",
        ext: "jpeg",
        albumId:1,
    },
    {
        name: "notte stellata",
        alt: "notte stellata",
        imageHash: "ef4635777a4091fcfc4096950dbffada6beab496b621bdfc9236e274e6cec40f",
        description:"notte stellata",
        ext: "jpeg",
        albumId:1,
    },
    {
        name: "ritratto",
        alt: "ritratto",
        imageHash: "af49c362f8c57db3c1f8702e9982f566e2aae89c71caceca09a9017f40034e06",
        description:"ritratto",
        ext: "jpeg",
        albumId:1,
    },
    {
        name: "ninfee 1",
        alt: "ninfee 1",
        imageHash: "658b8911c1c67ee81376f7db54dda4bf0863f2a2f3fba043cb14357a8bab552e",
        description:"ninfee",
        ext: "jpeg",
        albumId:2,
    },
    {
        name: "ninfee 2",
        imageHash: "43e25f80275612c9c18eabf04c59b307ac36b078af2838947a9660a1175b3353",
        alt: "ninfee 2",
        description :"ninfee",
        ext: "jpeg",
        albumId:2
    },
    {
        name: "ninfee 3",
        imageHash: "8647582e221b6ab84bd7020a86d03038cdd5be4277b02bbaa43ff39b01dc75a1",
        alt: "ninfee 3",
        description :"ninfee",
        ext: "jpeg",
        albumId:2
    },

]

;(async () => {
    try {
        
        for(let i = 0; i< artists.length; i++){
            const { rows } = await pool.query(`
                INSERT INTO "Artists"("firstName", "lastName", "description", "status")
                VALUES ('${artists[i].firstName}', '${artists[i].lastName}', '${artists[i].description}', '${artists[i].status}')
                RETURNING "id" AS "artistId";
            `)
            albums[i].artistId = rows[0].artistId
        }

        for(let i = 0; i<albums.length; i++){
            await pool.query(`
                INSERT INTO "Albums"("name", "description", "artistId", "background")
                VALUES ('${albums[i].name}', '${albums[i].description}', '${albums[i].artistId}', '${albums[i].background}')
            `)
        }

        for(let i = 0; i<images.length; i++){
            await pool.query(`
                INSERT INTO "Images"("name", "description", "imageHash", "alt", "ext", "albumId")
                VALUES ('${images[i].name}', '${images[i].description}', '${images[i].imageHash}', '${images[i].alt}', '${images[i].ext}', ${images[i].albumId})
                RETURNING "id" AS "albumId";
            `)
        }


        pool.end()
    } catch (error) {
        console.log(error)
    }
})()

