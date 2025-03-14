import fs from 'fs'
import pdf from 'pdf-parse'
import formidable from 'formidable'
import path, { dirname } from 'path'
import { __dirname } from '../config/config.js'
import { createWorker } from 'tesseract.js'
// import pdf2Img from "pdf-img-convert"



const uploadDir = path.join(dirname(__dirname), 'uploads');

const facture = {
    numclient: null,
    refclient: null,
    commune: null,
    refencais: null,
    categorie: null,
    electricite: {
        numcompteur: null,
        tarif: null,
        puissance: null,
    },
    eau: {
        numcompteur: null,
        consommation: null,
        calibre: null,
        tarif: null
    },
    tva: null
}

export const scanPdf = (req, res) => {

    const form = formidable(
        {
            uploadDir,
            multiples: true,
            keepExtensions: true
        }
    )


    form.parse(req, (err, fields, files) => {

    }).then(response => {
        const fichier = req.files.file

        let newPath = path.resolve(dirname(__dirname), 'uploads', fichier.name)

        try {

            //Move the uploaded file to the uploads folder
            fichier.mv(newPath, async (err) => {
                if (err) {
                    console.log("error")
                }

                //Read the buffer and convert into text
                let rawData = fs.readFileSync(newPath)
                const data = await pdf(rawData)

                //Format the data 
                const textBuffer = data.text.split('\n')

                //Regex filter for the number of counter
                let numComptReg = /\d{10}[EW]/g

                let pickIndexOne = false
                let pickIndexTwo = false
                let pickIndexThree = false
                let pickIndexFour = false
                let initial = 0

                let numCompteur = false
                let indexOne = false
                let indexTwo = false
                let indexThree = false
                let indexFour = false


                textBuffer.forEach(line => {

                    if (initial === 0) {
                        numCompteur = data.text.includes("N° compteur")
                        indexOne = data.text.includes("1ère tranche de consommation ")
                        indexTwo = data.text.includes("2ème tranche de consommation ")
                        indexThree = data.text.includes("3ème tranche de consommation ")
                        indexFour = data.text.includes("3ème tranche de consommation ")
                    }
                    console.log(line)

                    if (numCompteur) {
                        console.log('----------------------------------------------------')
                        console.log({ line })

                        if (numComptReg.exec(line)) {
                            console.log(line.match(numComptReg))
                        }
                    }

                    if (pickIndexOne) {
                        console.log('----------------------------------------------------')
                        console.log({ line: line.split('.00') })

                        pickIndexOne = false
                    }

                    if (indexOne) {
                        pickIndexOne = true
                    }

                    if (pickIndexTwo) {
                        console.log('----------------------------------------------------')
                        console.log({ line: line.split('.00') })

                        pickIndexTwo = false
                    }

                    if (indexTwo) {
                        pickIndexTwo = true
                    }

                    if (pickIndexThree) {
                        console.log('----------------------------------------------------')
                        console.log({ line: line.split('.00') })

                        pickIndexThree = false
                    }

                    if (indexThree) {
                        pickIndexThree = true
                    }

                    if (pickIndexFour) {
                        console.log('----------------------------------------------------')
                        console.log({ line: line.split('.00') })

                        pickIndexFour = false
                    }

                    if (indexFour) {
                        pickIndexFour = true
                    }

                    initial++

                })

                res.status(200).send({ "message": "Upload succeed" })

            })

        } catch (error) {
            console.log({ error })
        }
    })

}

//For test
export const lecture = (req, res) => {
    const fichier = req.files.file
    let findCategory = 0
    let newPath = path.resolve(dirname(__dirname), 'uploads', fichier.name)

    try {
        fichier.mv(newPath, async (err) => {
            if (err) {
                console.error(err)
            }

            //Read the buffer and convert into text
            fs.readFile(newPath, { enconding: "utf-8" }, (err, data) => {

                pdf(data).then(dataText => {

                    let texte = dataText.text
                    let lines = texte.split('\n')

                    lines.forEach(line => {

                        if (/[a-zA-Z\sÀ-ÿ-]+Catégorie/.test(line)) {

                            // let categ = /[a-zA-Z]+Catégorie/.exec(line)
                            let categ = /[a-zA-Z\sÀ-ÿ-]+Catégorie/.exec(line)
                            console.log({ line, categ })
                            // if (categ !== null) {
                            //     categ = categ[0].toString().substring(0, categ.toString().indexOf('C'))
                            //     facture.categorie = categ
                            // }
                        }
                    })

                    res.status(200).send({ "message": "test succeed" })
                })

            })

        })
    } catch (error) {

    }
}

//Scan image
export const scanImage = async (req, res) => {
    const fichier = req.files.file

    let newPath = path.resolve(dirname(__dirname), 'uploads', 'images', fichier.name)
    let numComptReg = /\d{10}[EW]/g

    try {
        fichier.mv(newPath, async (err) => {

            const ext = path.extname(newPath)

            if (err) {
                console.error(err)
            }

            const worker = await createWorker()

            const { data: { text } } = await worker.recognize(newPath)

            let lines = text.split('\n')

            lines.forEach(line => {

                if (line.includes('Référence client')) {
                    const refC = /\d{11}/
                    console.log(refC.exec(line))
                }
            })


            await worker.terminate()
        })

        fs.unlink(newPath, (err) => {
            if (err) {
                res.status(500).send({ error: "Error in deleting the image" })
            }
        })
    } catch (error) {
        res.status(500).send({ error: "Internal server error" })
    }

}


export const displayPdfData = async (req, res) => {

    const fichier = req.files.file
    let findCateg = 0
    let newPath = path.resolve(dirname(__dirname), 'uploads', fichier.name)

    const ext = path.extname(newPath)
    let dataText = null


    // let findNumFactElec = 0
    // let numComptReg = /\d{10}[EWO]/g
    // let numComptReg = /[0-9A-Z]{11}/g
    // let numComptReg = /^[0-9A]{10}[EOW]$/g
    
    try {

        //Move the uploaded file to the uploads folder
        fichier.mv(newPath, async (err) => {
            if (err) {
                console.log("error")
            }

            if (ext === '.pdf') {

                //Read the buffer and convert into text
                let rawData = fs.readFileSync(newPath)
                dataText = (await pdf(rawData)).text

                // console.log(dataText)

            } else {

                const worker = await createWorker()
                const { data: { text } } = await worker.recognize(newPath)
                dataText = text
                // console.log(text)
            }

            let lines = dataText.split('\n')

            lines.forEach(line => {

                if (line.includes('Référence client')) {
                    const refC = /\d{11}/

                    facture.refclient = refC.exec(line)[0]
                }

                if (line.includes('N° client')) {
                    let numcli = null

                    //lecture pdf
                    if (/:\d{8}/.test(line)) {
                        numcli = /:\d{8}/.exec(line)[0]
                        numcli = /\d+/.exec(numcli)[0]

                        //lecture image
                    } else {
                        numcli = /\d{8}/.exec(line)[0]
                    }

                    // console.log({ numcli, line })
                    facture.numclient = numcli

                }

                if (line.includes('Commune')) {

                    let com = /^[A-Z0-9\s-]+/.exec(line)[0].toString()
                    com = com.slice(0, -1)

                    if (ext !== '.pdf') {
                        com = line.toString().substring(line.toString().lastIndexOf(':'))
                        com = com.replace(':', '')
                    }

                    facture.commune = com

                }

                if (line.includes('Référence encais')) {
                    const encReg = /\d{4}/
                    facture.refencais = encReg.exec(line)[0]
                }

                //Lecture puissance pdf et image

                if (line.includes(':PS')) {

                    if (/\d{10}[E]/.test(line)) {
                        facture.electricite.numcompteur = line.match(/\d{10}[E]/)[0]
                    } else if (/[0-9A-Z]+[N]/.test(line)) {
                        const numcompteur = /[0-9A-Z]+[N]/.exec(line)[0]
                        console.log({ numc: /\d+/.exec(numcompteur), numcompteur })

                        facture.electricite.numcompteur = (numcompteur.toString().replace(facture.numclient, '').replace('N', '').trim().slice(2) !== "") ? numcompteur.toString().replace(facture.numclient, '').replace('N', '').trim().slice(2) : null
                    }

                    let psReg = /\d+(\.\d+)?$/
                    if (psReg.exec(line) !== null) {
                        facture.electricite.puissance = parseFloat(psReg.exec(line)[0])
                    }

                    line = line.toString().substring(line.toString().indexOf(')') + 3)

                    if (/[a-zA-Z\s]+/.test(line)) {
                        // console.log(/[a-zA-Z\s]+/.exec(line)[0])
                        facture.electricite.tarif = /[a-zA-Z\s]+/.exec(line)[0]
                    }



                }
                if (ext !== '.pdf' && (line.includes('PS'))) {

                    let puissance = line.toString().substring(line.toString().lastIndexOf(':'))
                    puissance = parseFloat(puissance.toString().replace(':', ''))
                    facture.electricite.puissance = puissance

                    if (/[a-zA-Z\s]+/.test(line)) {

                        let tarifTotal = null
                        if (/\d{2}\s[a-zA-Z\s]+/.test(line.toString().substring(line.indexOf('T')))) {
                            tarifTotal = /\d{2}\s[a-zA-Z\s]+/.exec(line.toString().substring(line.indexOf('T')))
                            console.log({ tarifTotal })
                            facture.electricite.tarif = /[a-zA-Z\s]+/.exec(tarifTotal.toString().replace('PS', ''))[0].trim()
                        }

                    }

                    if (/[0-9A-Z]{8,}/.exec(line)) {
                        console.log({ holla: /[0-9A-Z]{7,}/.exec(line.slice(40)), lin: line.match(/[0-9A-Z]{8,}/) })
                        facture.electricite.numcompteur = (/[0-9A-Z]{7,}/.exec(line.slice(40)) !== null) ? /[0-9A-Z]{7,}/.exec(line.slice(40))[0] : null
                    }
                }

                if (line.includes('1000m3')) {

                    console.log(line)
                    let calText = line.toString().substring(line.toString().indexOf('T'))
                    let tarifeau = line.toString().substring(line.toString().indexOf('T'), 0)

                    console.log({ tarifeau, calText })

                    if (/[0-9]+/.test(calText)) {
                        facture.eau.calibre = parseInt(/[0-9]{2}/.exec(calText)[0])
                    }

                    if (/:\d{2}/.test(tarifeau)) {
                        facture.eau.tarif = parseInt(/:\d{2}/.exec(tarifeau).toString().substring(1))
                    }

                    //Lecture image
                    if (ext !== '.pdf') {

                        console.log(dataText)
                        calText = line.toString().substring(line.toString().lastIndexOf(':')).replace(':', '')

                        tarifeau = line.toString().substring(line.toString().lastIndexOf('T'))
                        console.log(tarifeau)

                        if (/:\d{2}/.test(tarifeau)) {
                            // tarifeau = parseInt(/\d{2}/.exec(tarifeau)[0])
                            console.log({ tarifeau: tarifeau.match(/\d{2}C/) })

                            // facture.eau.tarif = parseInt(/\d{2}/.exec(tarifeau)[0].toString().slice(1))
                            // facture.eau.tarif = parseInt(tarifeau.match(/\d{2}C/)[0])

                            tarifeau = tarifeau.match(/\d{2}C/)[0]
                            tarifeau = parseInt(tarifeau.match(/\d{2}/)[0])

                            facture.eau.calibre = parseInt(calText)
                            facture.eau.tarif = tarifeau

                        }

                    }

                    if (/[0-9A-Z]{8,}/.exec(line)) {
                        console.log({ holla: /[0-9A-Z]{8,}/.exec(line.slice(40)), lin: line.match(/[0-9A-Z]{8,}/) })
                        facture.eau.numcompteur = /[0-9A-Z]{8,}/.exec(line.slice(40))[0]
                    }

                }

                if (line.includes('Consommation')) {

                    console.log(line)
                    let conso = /[<>=]+\d+m3/g.exec(line)

                    if (conso !== null) {
                        facture.eau.consommation = conso[0]
                    }

                }

                if (line.includes('Catégorie :')) {

                    let categ = /[a-zA-Z\sÀ-ÿ-]+Catégorie/.exec(line)

                    if (categ !== null) {
                        console.log(categ.toString().replace('Client ', ''))
                        categ[0] = categ.toString().replace('Client ', '')
                        categ = categ[0].toString().substring(0, categ.toString().indexOf('C'))
                    }

                    if (ext !== '.pdf') {
                        let ligne = line.toString().substring(line.indexOf('C'))
                        categ = ligne.toString().substring(ligne.indexOf(':'), ligne.lastIndexOf('C')).replace(':', '').trim()
                    }

                    if (findCateg === 0) facture.categorie = categ
                    findCateg = 1
                }

                if (line.includes('TVA :')) {

                    let tva = /:[a-zA-Z\sÀ-ÿ-]+/.exec(line)

                    if (tva !== null) {
                        facture.tva = /[a-zA-Z\sÀ-ÿ-]+/.exec(tva)[0]
                    }

                }

                if (line.includes('TVA:')) {

                    let tvatext = line.slice(4).match(/[a-zA-Z\sÀ-ÿ]+[N]/)

                    if (tvatext !== null) {
                        console.log({ tvatext: tvatext[0].replace('N', '').trim() })
                        facture.tva = tvatext[0].replace('N', '').trim()
                    }

                }

                if (line.includes('eau :') && line.includes('1000m3')) {
                    let numComptEauReg = /[0-9A]{10}[WO]/.exec(line)[0]
                    console.log({ numComptEauReg })
                    facture.eau.numcompteur = numComptEauReg
                }

            })

            fs.unlink(newPath, (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression du fichier :', err)
                }
                res.status(200).send({ facture })
            })

        })

    } catch (error) {
        console.error(error)
        res.status(500).send({ "message": "internal server error" })
    }
}