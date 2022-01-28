import Dexie from "dexie";
import _ from "lodash";
import {soundex} from "soundex-code";
import {stemmer} from "stemmer";
import {nanoid} from "nanoid";

let database = new Dexie("FTS-FULL-TEST");
database.version(1).stores({
    paragraphs: 'id, text, *tokens, *tokens_stemmed, *tokens_soundex, *tokens_stemmedSoundex'
});

const splitNormalizeText = (text) => text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/gi, ' ')
    .split(/\s+/)
    .filter(word => word.trim() !== '')
    .map(word => _.deburr(word))

const resetDatabase = async (setProgress) => {
    await database.delete()
    database = new Dexie("FTS-FULL-TEST");
    database.version(1).stores({
        paragraphs: 'id, text, *tokens, *tokens_stemmed, *tokens_soundex, *tokens_stemmedSoundex'
    });
}

export const populateDatabase = async (srcURL, setProgress) => {

    setProgress('RESETTING DATABASE...')
    await resetDatabase(setProgress);

    setProgress('FETCHING SOURCE...')
    const response = await fetch(srcURL)
    const text = await response.text()
    const paragraphs = text.split('\n\n')
    let paragraphs$processed = []
    setProgress('PROCESSING SOURCE PARAGRAPHS...')

    try {
        paragraphs$processed = paragraphs.map(paragraph_text => {

            const text = paragraph_text.trim()

            const tokens = [...new Set(text
                .toLowerCase()
                .replace(/[^a-z0-9 ]/gi, ' ')
                .split(/\s+/)
                .filter(word => word.trim() !== '')
                .map(word => _.deburr(word)))
                .values()]

            const tokens_soundex = tokens.map(t => soundex(t))
            const tokens_stemmed = tokens.map(t => stemmer(t))
            const tokens_stemmedSoundex = tokens_stemmed.map(t => soundex(t))

            // const p = document.createElement('p')
            // p.innerHTML = `${text} <br><br> ${tokens.join(', ')}`
            // document.body.append(p)

            return {
                id: nanoid(), text, tokens, tokens_stemmed, tokens_soundex, tokens_stemmedSoundex
            }

        })

        const totalParagraphCount = paragraphs$processed.length
        setProgress(`BULK ADDING SOURCE PARAGRAPHS TO DATABASE: 0/${totalParagraphCount}`)
        await database.transaction('rw', database.paragraphs, async ()=>{
            for(let chunkPosition = 0; chunkPosition < totalParagraphCount; chunkPosition+=200){
                setProgress(`BULK ADDING SOURCE PARAGRAPHS TO DATABASE ${chunkPosition}/${totalParagraphCount}`)
                console.log(paragraphs$processed[chunkPosition])
                await database.paragraphs.bulkAdd(paragraphs$processed.slice(chunkPosition, chunkPosition+200))
            }
        })

    } catch (error) {
        console.log(error)
    }

    setProgress('FETCHING AND PROCESSING COMPLETE')
    return {
        wordCount: text.length,
        paragraphCount: paragraphs.length
    }

}

export const query_naiveFilterToArray = async (queryText) => {
    const normalizedSplitQuery = splitNormalizeText(queryText)
    const start = performance.now()
    let queryResults
    switch (normalizedSplitQuery.length) {
        case 0: return null
        case 1:
            queryResults = await database.paragraphs.filter(paragraph => new RegExp(`\\b${normalizedSplitQuery[0]}\\b`, 'gi').test(paragraph.text)).toArray()
            break
        default:
            queryResults = await database.paragraphs.filter(paragraph => new RegExp(`\\b${normalizedSplitQuery.join('|')}\\b`, 'gi').test(paragraph.text)).toArray()
            break
    }

    return {
        type: 'NAIVE - FILTER THEN TO ARRAY',
        query_time: performance.now() - start,
        queryProcessed: normalizedSplitQuery.join(', '),
        queryResults,
        queryResults_length: queryResults.length
    }
}

export const query_naiveToArrayFilter = async (queryText) => {
    // queryText = normalizeText(queryText)

    const normalizedSplitQuery = splitNormalizeText(queryText)
    const start = performance.now()
    let queryResults
    switch (normalizedSplitQuery.length) {
        case 0: return null
        case 1:
            queryResults = (await database.paragraphs.toArray()).filter(paragraph => new RegExp(`\\b${normalizedSplitQuery[0]}\\b`, 'gi').test(paragraph.text))
            break
        default:
            queryResults = (await database.paragraphs.toArray()).filter(paragraph => new RegExp(`\\b${normalizedSplitQuery.join('|')}\\b`, 'gi').test(paragraph.text))
            break
    }

    return {
        type: 'NAIVE - TO ARRAY THEN FILTER',
        query_time: performance.now() - start,
        queryProcessed: normalizedSplitQuery.join(', '),
        queryResults,
        queryResults_length: queryResults.length
    }
}

export const query_rawTokenSearch = async (queryText) => {
    const normalizedSplitQuery = splitNormalizeText(queryText)
    const start = performance.now()
    let queryResults
    switch (normalizedSplitQuery.length) {
        case 0: return null
        case 1:
            queryResults = await database.paragraphs.where('tokens').equals(normalizedSplitQuery[0]).toArray()
            break
        default:
            queryResults = await database.paragraphs.where('tokens').anyOf(normalizedSplitQuery).distinct().toArray()
            break
    }

    return {
        type: 'RAW TOKEN SEARCH',
        query_time: performance.now() - start,
        queryProcessed: normalizedSplitQuery.join(', '),
        queryResults,
        queryResults_length: queryResults.length
    }

}

export const query_stemmedTokenSearch = async (queryText, AND) => {

    const normalizedSplitQuery = splitNormalizeText(queryText)
    const normalizedSplitQuery$stemmed = normalizedSplitQuery.map(token => stemmer(token))
    const start = performance.now()
    let queryResults

    switch (normalizedSplitQuery.length) {
        case 0: return null
        case 1:
            queryResults = await database.paragraphs.where('tokens_stemmed').equals(normalizedSplitQuery$stemmed[0]).toArray()
            break
        default:
            if(AND){

            } else {
                queryResults = await database.paragraphs.where('tokens_stemmed').anyOf(normalizedSplitQuery$stemmed).distinct().toArray()
            }
            break
    }

    return {
        type: 'STEMMED TOKEN SEARCH',
        query_time: performance.now() - start,
        queryProcessed: normalizedSplitQuery$stemmed.join(', '),
        queryResults,
        queryResults_length: queryResults.length
    }

}

export const query_soundexTokenSearch = async (queryText) => {

    const normalizedSplitQuery = splitNormalizeText(queryText)
    const normalizedSplitQuery$soundex = normalizedSplitQuery.map(token => soundex(token))
    const start = performance.now()
    let queryResults

    switch (normalizedSplitQuery.length) {
        case 0: return null
        case 1:
            queryResults = await database.paragraphs.where('tokens_soundex').equals(normalizedSplitQuery$soundex[0]).toArray()
            break
        default:
            queryResults = await database.paragraphs.where('tokens_soundex').anyOf(normalizedSplitQuery$soundex).distinct().toArray()
            break
    }

    return {
        type: 'SOUNDEX TOKEN SEARCH',
        query_time: performance.now() - start,
        queryProcessed: normalizedSplitQuery$soundex.join(', '),
        queryResults,
        queryResults_length: queryResults.length
    }

}

export const query_stemmedSoundexTokenSearch = async (queryText) => {

    const normalizedSplitQuery = splitNormalizeText(queryText)
    const normalizedSplitQuery$stemmedSoundex = normalizedSplitQuery.map(token => soundex(stemmer(token)))
    const start = performance.now()
    let queryResults

    console.log(normalizedSplitQuery$stemmedSoundex)
    switch (normalizedSplitQuery.length) {
        case 0: return null
        case 1:
            queryResults = await database.paragraphs.where('tokens_stemmedSoundex').equals(normalizedSplitQuery$stemmedSoundex[0]).toArray()
            break
        default:
            queryResults = await database.paragraphs.where('tokens_stemmedSoundex').anyOf(normalizedSplitQuery$stemmedSoundex).distinct().toArray()
            break
    }

    return {
        type: 'STEMMED SOUNDEX TOKEN SEARCH',
        query_time: performance.now() - start,
        queryProcessed: normalizedSplitQuery$stemmedSoundex.join(', '),
        queryResults,
        queryResults_length: queryResults.length
    }

}

export const runFTSTest = async (queryText) => {

    const results = []

    await new Promise(resolve => setTimeout(resolve, 1)) // clear

    results.push(await query_naiveToArrayFilter(queryText))
    results.push(await query_naiveFilterToArray(queryText))
    results.push(await query_rawTokenSearch(queryText))
    results.push(await query_stemmedTokenSearch(queryText))
    results.push(await query_soundexTokenSearch(queryText))
    results.push(await query_stemmedSoundexTokenSearch(queryText))

    return results

}